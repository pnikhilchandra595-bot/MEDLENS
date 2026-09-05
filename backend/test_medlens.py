import os
import sys
import unittest

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, SessionLocal, Patient, Report, TestResult, PatientReportedData, Consent, ReportHash
from extractors.vision_extractor import calculate_sha256, check_patient_match, ground_bbox, normalize_numeric_string, VisionExtractionEngine
from normalizers.loinc_normalizer import LoincNormalizer
from normalizers.sanity_checker import BiologicalSanityChecker
from normalizers.rxnorm_service import RxNormService
from intake.provenance import detect_inconsistencies
from trends.temporal_engine import TemporalIntelligenceEngine
from adversarial.interpreter import AdversarialInterpreter, validate_and_sanitize_output, DIAGNOSTIC_BLOCKLIST
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
        res_match = check_patient_match("Arjun Sharma", "Arjun Sharma")
        self.assertEqual(res_match["status"], "match")
        self.assertGreaterEqual(res_match["similarity"], 90.0)

        res_mismatch = check_patient_match("Priya Sharma", "Arjun Sharma")
        self.assertEqual(res_mismatch["status"], "needs_confirmation")
        self.assertLess(res_mismatch["similarity"], 70.0)

    def test_03_loinc_normalization(self):
        norm = LoincNormalizer()
        
        # Local exact/canonical
        r1 = norm.normalize("TSH")
        self.assertEqual(r1["loinc_code"], "3016-3")
        self.assertTrue(r1["is_recognized"])

        # Fuzzy test name
        r2 = norm.normalize("Thyroid Stimulating Hormone (TSH)")
        self.assertEqual(r2["loinc_code"], "3016-3")

        # Unrecognized test (routed to human review, not dropped)
        r3 = norm.normalize("Unknown Exotic Biomarker XYZ 99")
        self.assertFalse(r3["is_recognized"])
        self.assertIn("Unrecognized", r3["canonical_name"])

    def test_04_rxnorm_drug_normalization(self):
        rx = RxNormService()
        
        # Indian commercial brand -> Canonical RxNorm active ingredient
        r1 = rx.normalize_drug("Crocin 500mg")
        self.assertTrue(r1["is_recognized"])
        self.assertIn("acetaminophen", r1["active_ingredient"])
        self.assertEqual(r1["rxcui"], "161")

        # Thyroid brand -> Levothyroxine
        r2 = rx.normalize_drug("Thyronorm 50mcg")
        self.assertTrue(r2["is_recognized"])
        self.assertIn("levothyroxine", r2["active_ingredient"])

        # Statin brand -> Atorvastatin
        r3 = rx.normalize_drug("Atorva 10mg")
        self.assertTrue(r3["is_recognized"])
        self.assertIn("atorvastatin", r3["active_ingredient"])

    def test_05_biological_sanity_check_and_citations(self):
        checker = BiologicalSanityChecker()

        # Check citations exist in database
        self.assertIn("3016-3", checker.bio_ranges)
        self.assertIn("citation", checker.bio_ranges["3016-3"])
        self.assertIn("Harrison", checker.bio_ranges["3016-3"]["citation"])

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

    def test_06_grounded_bbox(self):
        ocr_lines = [
            {"text": "Patient Name: Arjun Sharma", "bbox": {"x": 0.1, "y": 0.1, "w": 0.8, "h": 0.05}},
            {"text": "TSH (Thyroid Stimulating Hormone)  6.80 uIU/mL (0.40 - 4.50)", "bbox": {"x": 0.1, "y": 0.28, "w": 0.8, "h": 0.04}}
        ]
        # Test numeric normalization ("6.8" matches "6.80")
        bbox, grounded, gtype = ground_bbox("6.8", "TSH", ocr_lines)
        self.assertTrue(grounded)
        self.assertIsNotNone(bbox)
        self.assertIn(gtype, ["independent_ocr_line_match", "model_self_consistency"])

        bbox2, grounded2, gtype2 = ground_bbox("999.9", "Unknown", ocr_lines)
        self.assertFalse(grounded2)
        self.assertIsNone(bbox2)
        self.assertEqual(gtype2, "unconfirmed")

    def test_07_inconsistency_detection_with_rxnorm(self):
        patient_reported = {
            "conditions": "No diabetes, mild fatigue",
            "medications": "Thyronorm 50mcg, Combiflam daily"
        }
        extracted_results = [
            {"loinc_code": "2345-7", "test_name": "Blood Glucose", "value": 180.0, "is_abnormal": True},
            {"loinc_code": "3016-3", "test_name": "TSH", "value": 6.8, "is_abnormal": True},
            {"loinc_code": "2160-0", "test_name": "Serum Creatinine", "value": 1.9, "is_abnormal": True}
        ]
        flags = detect_inconsistencies(patient_reported, extracted_results)
        self.assertGreaterEqual(len(flags), 3)
        # Check RxNorm brand name reconciliation
        self.assertTrue(any("Levothyroxine" in f["title"] or "Thyroid" in f["title"] for f in flags))
        self.assertTrue(any("NSAID" in f["title"] for f in flags))

    def test_08_temporal_correlation_engine(self):
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
        self.assertGreaterEqual(len(res["correlation_flags"]), 1)
        self.assertIn("3016-3+2093-3", [f["pair_key"] for f in res["correlation_flags"]])

    def test_09_adversarial_ai_safety(self):
        interpreter = AdversarialInterpreter()
        results = [
            {"canonical_name": "TSH", "value": 6.8, "is_abnormal": True},
            {"canonical_name": "Total Cholesterol", "value": 242.0, "is_abnormal": True}
        ]
        intel = interpreter.generate_clinical_intelligence(results, language="en")
        
        self.assertEqual(intel["flag_count"], 2)
        summary = intel["primary_summary"].lower()
        for term in DIAGNOSTIC_BLOCKLIST:
            self.assertNotIn(term, summary)
        self.assertGreaterEqual(len(intel["counter_explanations"]), 2)
        self.assertGreaterEqual(len(intel["doctor_questions"]), 2)

    def test_10_fhir_and_abdm_bundle_builder(self):
        patient = {"id": "pat-test", "name": "Arjun Sharma", "sex": "Male", "phone": "+919876543210"}
        report = {"id": "rep-test", "lab_name": "Metropolis Lab", "report_date": "2026-03-01"}
        results = [
            {"test_name": "TSH", "canonical_name": "Thyroid Stimulating Hormone", "loinc_code": "3016-3", "value": 6.8, "unit": "uIU/mL", "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": True, "confidence_tier": "medium", "source": "Extracted from report"}
        ]
        
        # International Bundle
        intl_bundle = FhirBundleBuilder.build_fhir_bundle(patient, report, results, is_abdm_profile=False)
        self.assertEqual(intl_bundle["resourceType"], "Bundle")
        self.assertEqual(intl_bundle["type"], "collection")

        # ABDM India NRCeS Bundle
        abdm_bundle = FhirBundleBuilder.build_fhir_bundle(patient, report, results, is_abdm_profile=True)
        self.assertEqual(abdm_bundle["resourceType"], "Bundle")
        patient_entry = [e["resource"] for e in abdm_bundle["entry"] if e["resource"]["resourceType"] == "Patient"][0]
        self.assertIn("nrces.in", patient_entry["meta"]["profile"][0])

    def test_11_dpdp_consent_and_delete(self):
        import uuid
        temp_id = f"pat-temp-{uuid.uuid4().hex[:8]}"
        p = Patient(id=temp_id, name="Temporary Delete Patient")
        self.db.add(p)
        self.db.commit()

        ConsentManager.record_consent(self.db, temp_id)
        status = ConsentManager.get_consent_status(self.db, temp_id)
        self.assertTrue(status["has_consented"])

        del_res = ConsentManager.delete_patient_data(self.db, temp_id)
        self.assertEqual(del_res["status"], "success")

        deleted_p = self.db.query(Patient).filter(Patient.id == temp_id).first()
        self.assertIsNone(deleted_p)

    def test_12_output_side_safety_blocklist_intercepts_diagnoses(self):
        # Strict invariant: any diagnostic phrasing must be intercepted
        unsafe_samples = [
            "Patient is diagnosed with hypothyroidism and needs urgent thyroxine.",
            "Findings suggest the presence of type 2 diabetes mellitus.",
            "The patient suffers from severe chronic kidney disease and hypertension.",
            "Elevated triglycerides indicate a case of advanced dyslipidemia."
        ]
        for unsafe in unsafe_samples:
            is_safe, violation = validate_and_sanitize_output(unsafe)
            self.assertFalse(is_safe)
            self.assertIsNotNone(violation)

        # Non-diagnostic statement must pass
        safe_sample = "On your report, TSH and Total Cholesterol are outside standard laboratory reference intervals."
        is_safe, violation = validate_and_sanitize_output(safe_sample)
        self.assertTrue(is_safe)
        self.assertIsNone(violation)

    def test_13_numeric_string_normalization(self):
        self.assertEqual(normalize_numeric_string("6.80"), "6.8")
        self.assertEqual(normalize_numeric_string("195.00"), "195")
        self.assertEqual(normalize_numeric_string("1,250.0"), "1250")
        self.assertEqual(normalize_numeric_string("0.90"), "0.9")

    def test_14_extraction_engine_mode_flag(self):
        engine = VisionExtractionEngine()
        res = engine.process_document(
            file_bytes=b"Sample PDF bytes content",
            file_name="sample_report.pdf",
            active_patient_name="Test Patient"
        )
        self.assertIn("extraction_mode", res)
        self.assertIn(res["extraction_mode"], ["gemini_live", "demo_fallback"])
        self.assertIn("sha256_hash", res)
        self.assertEqual(len(res["sha256_hash"]), 64)

if __name__ == "__main__":
    unittest.main()
