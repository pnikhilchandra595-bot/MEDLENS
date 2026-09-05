import os
import sys
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from adversarial.interpreter import validate_and_sanitize_output
from database import Patient, Report, ResultAuditTrail, SessionLocal, init_db
from fastapi.testclient import TestClient
from main import app, generate_session_token, verify_session_token
from samples.sample_data import seed_sample_database


class TestMedLensIntegrationAndSecurity(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["MEDLENS_DB_PATH"] = os.path.join(os.path.dirname(__file__), "test_integration.db")
        init_db()
        cls.db = SessionLocal()
        seed_sample_database(cls.db)
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        db_file = os.environ.get("MEDLENS_DB_PATH", "")
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except Exception:
                pass

    def test_01_health_and_security_metadata(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("security_features", data)
        self.assertIn("HMAC Session Tokens", data["security_features"])

    def test_02_magic_byte_validation_rejects_disguised_files(self):
        # Disguised executable/plain text file with .pdf extension
        fake_bytes = b"This is plain text pretending to be a PDF."
        file_obj = ("fake.pdf", fake_bytes, "application/pdf")
        resp = self.client.post(
            "/api/upload",
            data={"consent_confirmed": "true", "patient_name": "Test Security Patient"},
            files={"file": file_obj},
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Invalid file format", resp.json()["detail"])

    def test_03_magic_byte_accepts_valid_pdf_and_returns_session_token(self):
        valid_pdf_header = b"%PDF-1.4\n%Synthetic Lab Report\n" + (b"0" * 200)
        file_obj = ("valid_report.pdf", valid_pdf_header, "application/pdf")
        resp = self.client.post(
            "/api/upload",
            data={"consent_confirmed": "true", "patient_name": "Integration Patient"},
            files={"file": file_obj},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("session_token", data)
        self.assertIn("sha256_hash", data)
        self.assertEqual(len(data["sha256_hash"]), 64)
        self.assertTrue(verify_session_token(data["session_token"], data["patient_id"]))

    def test_04_bbox_coordinates_roundtrip_identically(self):
        # Fetch patients from seeded database
        reports_resp = self.client.get("/api/patients")
        self.assertEqual(reports_resp.status_code, 200)
        patients = reports_resp.json()
        self.assertGreater(len(patients), 0)

        target_patient = patients[0]
        patient_reports = self.client.get(f"/api/patients/{target_patient['id']}/reports").json()
        self.assertGreater(len(patient_reports), 0)

        report_id = patient_reports[0]["id"]
        report_details = self.client.get(f"/api/reports/{report_id}").json()
        self.assertIn("results", report_details)

        for r in report_details["results"]:
            if r.get("bbox"):
                bbox = r["bbox"]
                self.assertIn("x", bbox)
                self.assertIn("y", bbox)
                self.assertIn("w", bbox)
                self.assertIn("h", bbox)
                self.assertTrue(0.0 <= bbox["x"] <= 1.0)
                self.assertTrue(0.0 <= bbox["y"] <= 1.0)

    def test_05_hitl_correction_workflow_with_mandatory_auth(self):
        # 1. Unauthenticated request must return 401
        patient = self.db.query(Patient).first()
        report = self.db.query(Report).filter(Report.patient_id == patient.id).first()
        test_res = report.test_results[0]

        unauth_resp = self.client.post(
            f"/api/reports/{report.id}/correct-result",
            json={"result_id": test_res.id, "corrected_value": 5.5, "correction_reason": "Missing token attempt"},
        )
        self.assertEqual(unauth_resp.status_code, 401)
        self.assertIn("Authentication token is required", unauth_resp.json()["detail"])

        # 2. Authenticated valid request must succeed
        token = generate_session_token(patient.id)
        resp = self.client.post(
            f"/api/reports/{report.id}/correct-result",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "result_id": test_res.id,
                "corrected_value": 4.2,
                "correction_reason": "Verified against pathologist physical slide",
            },
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["source"], "Human-corrected")
        self.assertEqual(data["corrected_value"], 4.2)

        # Assert audit trail entry was created
        audit = self.db.query(ResultAuditTrail).filter(ResultAuditTrail.result_id == test_res.id).first()
        self.assertIsNotNone(audit)
        self.assertEqual(audit.corrected_value, 4.2)

    def test_06_unauthorized_token_rejected_with_403(self):
        # Attempt to correct with a token belonging to another patient
        patient1 = self.db.query(Patient).first()
        reports = self.db.query(Report).filter(Report.patient_id == patient1.id).first()

        # Token for fraudulent patient
        fake_token = generate_session_token("pat-fraudulent-attacker")
        resp = self.client.post(
            f"/api/reports/{reports.id}/correct-result",
            headers={"Authorization": f"Bearer {fake_token}"},
            json={
                "result_id": reports.test_results[0].id,
                "corrected_value": 99.9,
                "correction_reason": "Malicious tampering",
            },
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("Forbidden", resp.json()["detail"])

    def test_07_delete_endpoint_strictly_enforces_authentication(self):
        import uuid

        temp_id = f"pat-delete-guard-{uuid.uuid4().hex[:6]}"
        p = Patient(id=temp_id, name="Delete Guard Patient")
        self.db.add(p)
        self.db.commit()

        # 1. No Authorization header -> MUST return 401 Unauthorized
        unauth_resp = self.client.delete(f"/api/delete-my-data/{temp_id}")
        self.assertEqual(unauth_resp.status_code, 401)
        self.assertIn("Authentication token is required", unauth_resp.json()["detail"])
        # Verify patient record was NOT deleted
        self.assertIsNotNone(self.db.query(Patient).filter(Patient.id == temp_id).first())

        # 2. Fraudulent Authorization token -> MUST return 403 Forbidden
        attacker_token = generate_session_token("pat-attacker-999")
        forbidden_resp = self.client.delete(
            f"/api/delete-my-data/{temp_id}", headers={"Authorization": f"Bearer {attacker_token}"}
        )
        self.assertEqual(forbidden_resp.status_code, 403)
        self.assertIn("Forbidden", forbidden_resp.json()["detail"])
        # Verify patient record still intact
        self.assertIsNotNone(self.db.query(Patient).filter(Patient.id == temp_id).first())

        # 3. Legitimate matching Authorization token -> MUST succeed with 200
        legit_token = generate_session_token(temp_id)
        success_resp = self.client.delete(
            f"/api/delete-my-data/{temp_id}", headers={"Authorization": f"Bearer {legit_token}"}
        )
        self.assertEqual(success_resp.status_code, 200)
        # Verify patient record is now permanently deleted
        self.assertIsNone(self.db.query(Patient).filter(Patient.id == temp_id).first())

    def test_08_multi_factor_search(self):
        resp = self.client.get("/api/reports/search?query=TSH&is_abnormal=true")
        self.assertEqual(resp.status_code, 200)
        results = resp.json()
        self.assertIsInstance(results, list)

    def test_09_parametrized_diagnostic_blocklist_generalization(self):
        adversarial_test_cases = [
            "Patient is suffering from severe hypothyroidism.",
            "Test results clearly indicate Hashimoto's thyroiditis.",
            "This pattern indicates a case of type 2 diabetes mellitus.",
            "Patient is anemic and has iron deficiency disease.",
            "The values confirm chronic kidney disease stage 3.",
            "Observation of hypercholesterolemia and dyslipidemia.",
            "Patient has advanced liver cirrhosis and hepatitis.",
            "Biomarkers show presence of leukemia or lymphoma.",
            "Diagnosis: acute metabolic syndrome.",
            "The patient is diagnosed with polycystic ovary syndrome.",
        ]

        for phrase in adversarial_test_cases:
            is_safe, violation = validate_and_sanitize_output(phrase)
            self.assertFalse(is_safe, f"Failed to intercept adversarial phrase: '{phrase}'")
            self.assertIsNotNone(violation)


if __name__ == "__main__":
    unittest.main()
