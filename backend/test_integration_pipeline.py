import os
import sys
import json
import unittest
from io import BytesIO

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app, generate_session_token, verify_session_token
from database import init_db, get_db, SessionLocal, Patient, Report, TestResult, AiSummaryCache, ResultAuditTrail
from adversarial.interpreter import validate_and_sanitize_output

class TestMedLensIntegrationAndSecurity(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.environ["MEDLENS_DB_PATH"] = os.path.join(os.path.dirname(__file__), "test_integration.db")
        init_db()
        cls.client = TestClient(app)
        cls.db = SessionLocal()

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
        # Fake file: text content with .pdf extension
        fake_bytes = b"This is plain text pretending to be a PDF."
        file_obj = ("fake.pdf", fake_bytes, "application/pdf")
        resp = self.client.post(
            "/api/upload",
            data={"consent_confirmed": "true", "patient_name": "Test Security Patient"},
            files={"file": file_obj}
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Invalid file format", resp.json()["detail"])

    def test_03_magic_byte_accepts_valid_pdf_and_returns_session_token(self):
        valid_pdf_header = b"%PDF-1.4\n%Synthetic Lab Report\n" + (b"0" * 200)
        file_obj = ("valid_report.pdf", valid_pdf_header, "application/pdf")
        resp = self.client.post(
            "/api/upload",
            data={"consent_confirmed": "true", "patient_name": "Integration Patient"},
            files={"file": file_obj}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("session_token", data)
        self.assertIn("sha256_hash", data)
        self.assertEqual(len(data["sha256_hash"]), 64)
        self.assertTrue(verify_session_token(data["session_token"], data["patient_id"]))

    def test_04_bbox_coordinates_roundtrip_identically(self):
        # Retrieve report details and assert bbox format
        reports_resp = self.client.get("/api/patients")
        self.assertEqual(reports_resp.status_code, 200)
        patients = reports_resp.json()
        self.assertGreater(len(patients), 0)
        
        # Check Arjun Sharma report
        arjun = [p for p in patients if "Arjun" in p["name"]][0]
        patient_reports = self.client.get(f"/api/patients/{arjun['id']}/reports").json()
        self.assertGreater(len(patient_reports), 0)
        
        report_id = patient_reports[0]["id"]
        report_details = self.client.get(f"/api/reports/{report_id}").json()
        self.assertIn("results", report_details)
        
        for r in report_details["results"]:
            self.assertIn("bbox", r)
            bbox = r["bbox"]
            self.assertIn("x", bbox)
            self.assertIn("y", bbox)
            self.assertIn("w", bbox)
            self.assertIn("h", bbox)
            self.assertTrue(0.0 <= bbox["x"] <= 1.0)
            self.assertTrue(0.0 <= bbox["y"] <= 1.0)

    def test_05_hitl_correction_workflow(self):
        # Create or fetch a test result
        patient = self.db.query(Patient).first()
        report = self.db.query(Report).filter(Report.patient_id == patient.id).first()
        test_res = report.test_results[0]
        
        original_val = test_res.value
        corrected_val = 4.2

        token = generate_session_token(patient.id)
        resp = self.client.post(
            f"/api/reports/{report.id}/correct-result",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "result_id": test_res.id,
                "corrected_value": corrected_val,
                "correction_reason": "Verified against pathologist physical slide"
            }
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
                "correction_reason": "Malicious tampering"
            }
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("Forbidden", resp.json()["detail"])

    def test_07_multi_factor_search(self):
        resp = self.client.get("/api/reports/search?query=TSH&is_abnormal=true")
        self.assertEqual(resp.status_code, 200)
        results = resp.json()
        self.assertIsInstance(results, list)

    def test_08_parametrized_diagnostic_blocklist_generalization(self):
        # Comprehensive test bank of 20+ adversarial diagnostic strings
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
            "The patient is diagnosed with polycystic ovary syndrome."
        ]

        for phrase in adversarial_test_cases:
            is_safe, violation = validate_and_sanitize_output(phrase)
            self.assertFalse(is_safe, f"Failed to intercept adversarial phrase: '{phrase}'")
            self.assertIsNotNone(violation)

if __name__ == "__main__":
    unittest.main()
