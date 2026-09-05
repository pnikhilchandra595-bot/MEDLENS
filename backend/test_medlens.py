import os
import sys
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, SessionLocal, Patient, Report, TestResult, PatientReportedData, Consent, ReportHash
from extractors.vision_extractor import calculate_sha256, check_patient_match, ground_bbox
from normalizers.loinc_normalizer import LoincNormalizer
from normalizers.sanity_checker import BiologicalSanityChecker
from intake.provenance import detect_inconsistencies
from trends.temporal_engine import TemporalIntelligenceEngine
from adversarial.interpreter import AdversarialInterpreter
from fhir.fhir_builder import FhirBundleBuilder
from consent.consent_manager import ConsentManager
from samples.sample_data import seed_sample_database

class TestMedLensPlatform(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        os.environ["MEDLENS_DB_PATH"] = os.path.join(os.path.dirname(__file__), "test_medlens.db")
        init_db()
        cls.db = SessionLocal()
        seed_sample_database(cls.db)

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        db_file = os.environ.get("MEDLENS_DB_PATH", "")
        if os.path.exists(db_file):
            try:
                os.remove(db_file)
            except Exception:
                pass

    def test_01_sha256_hashing(self):
        sample_bytes = b"Laboratory Report Sample Content - Metropolis Lab"
        sha = calculate_sha256(sample_bytes)
        self.assertIsInstance(sha, str)
        self.assertEqual(len(sha), 64)

    def test_02_patient_match_verification(self):
        # Match case
        res_match = check_patient_match("Arjun Sharma", "Arjun Sharma")
        self.assertEqual(res_match["status"], "match")
        self.assertGreaterEqual(res_match["similarity"], 90.0)

        # Mismatch case (Family member / wrong profile)
        res_mismatch = check_patient_match("Priya Sharma", "Arjun Sharma")
        self.assertEqual(res_mismatch["status"], "needs_confirmation")
        self.assertLess(res_mismatch["similarity"], 70.0)

    def test_03_loinc_normalization(self):
        norm = LoincNormalizer()
        
        # Exact/canonical
        r1 = norm.normalize("TSH")
        self.assertEqual(r1["loinc_code"], "3016-3")
        self.assertTrue(r1["is_recognized"])

        # Fuzzy test name
        r2 = norm.normalize("Thyroid Stimulating Hormone (TSH)")
        self.assertEqual(r2["loinc_code"], "3016-3")

        # Unrecognized test (routed to human review, not dropped)
        r3 = norm.normalize("Unknown Exotic Biomarker XYZ")
        self.assertIsNone(r3["loinc_code"])
        self.assertFalse(r3["is_recognized"])
        self.assertIn("Unrecognized", r3["canonical_name"])

    def test_04_biological_sanity_check(self):
        checker = BiologicalSanityChecker()

        # Normal hemoglobin -> High confidence
        res_high = checker.validate_result(loinc_code="718-7", value=14.5, ref_low=12.0, ref_high=17.5)
        self.assertEqual(res_high["confidence_tier"], "high")
        self.assertFalse(res_high["is_abnormal"])

        # Elevated cholesterol -> Medium confidence (abnormal lab value)
        res_med = checker.validate_result(loinc_code="2093-3", value=242.0, ref_low=125.0, ref_high=200.0)
        self.assertEqual(res_med["confidence_tier"], "medium")
        self.assertTrue(res_med["is_abnormal"])

        # Physically impossible hemoglobin (e.g. 95 g/dL OCR error) -> Low confidence
        res_low = checker.validate_result(loinc_code="718-7", value=95.0, ref_low=12.0, ref_high=17.5)
        self.assertEqual(res_low["confidence_tier"], "low")

        # Missing reference range -> safely evaluated without fabricating
        res_missing = checker.validate_result(loinc_code="4548-4", value=6.9, ref_low=None, ref_high=None, is_abnormal_extracted=True)
        self.assertEqual(res_missing["confidence_tier"], "medium")
        self.assertEqual(res_missing["sanity_status"], "missing_reference_range")

    def test_05_grounded_bbox(self):
        ocr_lines = [
            {"text": "Patient Name: Arjun Sharma", "bbox": {"x": 0.1, "y": 0.1, "w": 0.8, "h": 0.05}},
            {"text": "TSH (Thyroid Stimulating Hormone)  6.8 uIU/mL (0.40 - 4.50)", "bbox": {"x": 0.1, "y": 0.28, "w": 0.8, "h": 0.04}}
        ]
        # Grounded match
        bbox, grounded = ground_bbox("6.8", "TSH", ocr_lines)
        self.assertTrue(grounded)
        self.assertIsNotNone(bbox)

        # Ungrounded test -> returns (None, False)
        bbox2, grounded2 = ground_bbox("999.9", "Unknown", ocr_lines)
        self.assertFalse(grounded2)
        self.assertIsNone(bbox2)

    def test_06_inconsistency_detection(self):
        patient_reported = {
            "conditions": "No diabetes, mild fatigue",
            "medications": "Thyroid thyroxine supplement"
        }
        extracted_results = [
            {"loinc_code": "2345-7", "test_name": "Blood Glucose", "value": 180.0, "is_abnormal": True},
            {"loinc_code": "3016-3", "test_name": "TSH", "value": 6.8, "is_abnormal": True}
        ]
        flags = detect_inconsistencies(patient_reported, extracted_results)
        self.assertGreaterEqual(len(flags), 2)
        self.assertTrue(any("Glucose" in f["title"] or "Diabetes" in f["title"] for f in flags))

    def test_07_temporal_correlation_engine(self):
        temporal = TemporalIntelligenceEngine()
        reports = [
            {
                "report_date": "2025-09-10",
                "results": [
                    {"loinc_code": "3016-3", "canonical_name": "TSH", "value": 3.2, "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": False},
                    {"loinc_code": "2093-3", "canonical_name": "Total Cholesterol", "value": 190.0, "ref_low": 125.0, "ref_high": 200.0, "is_abnormal": False}
                ]
            },
            {
                "report_date": "2026-03-01",
                "results": [
                    {"loinc_code": "3016-3", "canonical_name": "TSH", "value": 6.8, "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": True},
                    {"loinc_code": "2093-3", "canonical_name": "Total Cholesterol", "value": 242.0, "ref_low": 125.0, "ref_high": 200.0, "is_abnormal": True}
                ]
            }
        ]
        res = temporal.analyze_patient_timeline(reports)
        self.assertIn("3016-3", res["analyte_trends"])
        self.assertEqual(res["analyte_trends"]["3016-3"]["direction"], "increasing")
        self.assertEqual(res["analyte_trends"]["2093-3"]["direction"], "increasing")
        # Check correlation flag
        self.assertGreaterEqual(len(res["correlation_flags"]), 1)
        self.assertIn("3016-3+2093-3", [f["pair_key"] for f in res["correlation_flags"]])

    def test_08_adversarial_ai_safety(self):
        interpreter = AdversarialInterpreter()
        results = [
            {"canonical_name": "TSH", "value": 6.8, "is_abnormal": True},
            {"canonical_name": "Total Cholesterol", "value": 242.0, "is_abnormal": True}
        ]
        intel = interpreter.generate_clinical_intelligence(results, language="en")
        
        # 1. Deterministic flag count (no AI urgency score)
        self.assertEqual(intel["flag_count"], 2)

        # 2. Strict non-diagnostic check: no disease diagnosis strings
        summary = intel["primary_summary"].lower()
        forbidden_terms = ["you have hypothyroidism", "you have hypercholesterolemia", "diagnosed with anemia", "diagnosed with diabetes"]
        for term in forbidden_terms:
            self.assertNotIn(term, summary)

        # 3. Gated counter explanations present
        self.assertGreaterEqual(len(intel["counter_explanations"]), 2)

        # 4. Doctor questions present
        self.assertGreaterEqual(len(intel["doctor_questions"]), 2)

    def test_09_fhir_bundle_builder(self):
        patient = {"id": "pat-test", "name": "Arjun Sharma", "sex": "Male", "phone": "+919876543210"}
        report = {"id": "rep-test", "lab_name": "Metropolis Lab", "report_date": "2026-03-01"}
        results = [
            {"test_name": "TSH", "canonical_name": "Thyroid Stimulating Hormone", "loinc_code": "3016-3", "value": 6.8, "unit": "uIU/mL", "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": True, "confidence_tier": "medium", "source": "Extracted from report"}
        ]
        bundle = FhirBundleBuilder.build_fhir_bundle(patient, report, results)
        self.assertEqual(bundle["resourceType"], "Bundle")
        self.assertEqual(bundle["type"], "collection")
        
        resource_types = [e["resource"]["resourceType"] for e in bundle["entry"]]
        self.assertIn("Patient", resource_types)
        self.assertIn("DiagnosticReport", resource_types)
        self.assertIn("Observation", resource_types)

    def test_10_dpdp_consent_and_delete(self):
        # Create temp patient
        temp_id = "pat-temp-delete-99"
        p = Patient(id=temp_id, name="Temporary Delete Patient")
        self.db.add(p)
        self.db.commit()

        # Add consent
        ConsentManager.record_consent(self.db, temp_id)
        status = ConsentManager.get_consent_status(self.db, temp_id)
        self.assertTrue(status["has_consented"])

        # Delete all data
        del_res = ConsentManager.delete_patient_data(self.db, temp_id)
        self.assertEqual(del_res["status"], "success")

        # Verify completely wiped
        deleted_p = self.db.query(Patient).filter(Patient.id == temp_id).first()
        self.assertIsNone(deleted_p)

if __name__ == "__main__":
    unittest.main()
