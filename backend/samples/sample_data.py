import logging
import uuid
from datetime import datetime, timezone

from database import Consent, Patient, PatientReportedData, Report, ReportHash, TestResult
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def seed_sample_database(db: Session):
    """
    Seeds database with 3 clinical test scenarios:
    1. Arjun Sharma - 3 chronological reports demonstrating multi-marker correlation (TSH + Cholesterol)
    2. Kavita Patel - Report with missing reference range (handled safely without guessing)
    3. Priya Sharma - Name mismatch scenario for family profile safety check
    """
    if db.query(Patient).count() > 0:
        return

    logger.info("[SampleData] Seeding database with demo patient profiles and chronological lab reports...")

    # Patient 0: P Vijay Kumar (Premier Smart Report Dataset)
    p0 = Patient(
        id="pat-p-vijay-kumar",
        name="P Vijay Kumar",
        age=48,
        sex="Male",
        phone="+91 94401 23456",
        email="vijay.kumar@example.com",
    )
    db.add(p0)

    # Consent for P Vijay Kumar
    c0 = Consent(
        id="cst-vijay-01",
        patient_id=p0.id,
        consented_at=datetime(2026, 8, 25, 8, 0, tzinfo=timezone.utc),
        purpose="Clinical laboratory report analysis and temporal intelligence",
    )
    db.add(c0)

    # Intake for P Vijay Kumar
    intake0 = PatientReportedData(
        id="intk-vijay-01",
        patient_id=p0.id,
        age=48,
        sex="Male",
        symptoms="No active acute symptoms; periodic routine health checkup following dietary optimization",
        conditions="Resolved iron deficiency anemia (2024), mild subclinical dyslipidemia",
        allergies="None known",
        medications="Occasional multivitamin",
        source="Patient-reported",
    )
    db.add(intake0)

    # Historical Report Dates for P Vijay Kumar
    vijay_report_dates = [
        ("rep-vijay-01", "2023-09-14", 16.5, 4.6, 47.0, 3.2, 190.0),
        ("rep-vijay-02", "2024-04-01", 10.1, 3.4, 32.0, 3.5, 195.0),
        ("rep-vijay-03", "2024-05-05", 10.8, 3.6, 34.0, 3.6, 200.0),
        ("rep-vijay-04", "2024-06-23", 14.3, 4.2, 42.0, 3.8, 210.0),
        ("rep-vijay-05", "2025-02-18", 13.2, 3.8, 37.8, 5.8, 228.0),
        ("rep-vijay-06", "2025-08-06", 14.2, 4.42, 44.5, 4.2, 208.0),
        ("rep-vijay-07", "2025-10-10", 15.1, 4.46, 45.4, 3.6, 194.0),
        ("rep-vijay-08", "2026-04-09", 17.0, 5.08, 52.8, 2.8, 182.0),
    ]

    for rep_id, rep_date, hb_val, rbc_val, pcv_val, tsh_val, chol_val in vijay_report_dates:
        r_hist = Report(
            id=rep_id,
            patient_id=p0.id,
            lab_name="Apollo Diagnostics Central Laboratory",
            report_date=rep_date,
            doctor_name="Dr. Ramesh Chandra, MD",
            file_name=f"vijay_report_{rep_date}.pdf",
            file_url="/samples/sample_report_1.png",
        )
        db.add(r_hist)
        db.add(
            TestResult(
                id=f"res-{rep_id}-hb",
                report_id=rep_id,
                patient_id=p0.id,
                test_name="Hemoglobin",
                canonical_name="Hemoglobin",
                loinc_code="718-7",
                value=hb_val,
                unit="g/dL",
                ref_low=13.0,
                ref_high=17.0,
                ref_raw="13.0 - 17.0 g/dL",
                is_abnormal=(hb_val < 13.0 or hb_val > 17.0),
                category="Complete Blood Count (CBC) Test",
                source="Extracted from report",
                is_grounded=True,
            )
        )
        db.add(
            TestResult(
                id=f"res-{rep_id}-rbc",
                report_id=rep_id,
                patient_id=p0.id,
                test_name="RBC Count",
                canonical_name="Red Blood Cell Count",
                loinc_code="789-8",
                value=rbc_val,
                unit="10^6/µl",
                ref_low=4.5,
                ref_high=5.5,
                ref_raw="4.5 - 5.5 10^6/µl",
                is_abnormal=(rbc_val < 4.5 or rbc_val > 5.5),
                category="Complete Blood Count (CBC) Test",
                source="Extracted from report",
                is_grounded=True,
            )
        )
        db.add(
            TestResult(
                id=f"res-{rep_id}-pcv",
                report_id=rep_id,
                patient_id=p0.id,
                test_name="PCV",
                canonical_name="Packed Cell Volume (Hematocrit)",
                loinc_code="20570-8",
                value=pcv_val,
                unit="%",
                ref_low=40.0,
                ref_high=50.0,
                ref_raw="40 - 50 %",
                is_abnormal=(pcv_val < 40.0 or pcv_val > 50.0),
                category="Complete Blood Count (CBC) Test",
                source="Extracted from report",
                is_grounded=True,
            )
        )
        db.add(
            TestResult(
                id=f"res-{rep_id}-tsh",
                report_id=rep_id,
                patient_id=p0.id,
                test_name="TSH",
                canonical_name="Thyroid Stimulating Hormone",
                loinc_code="3016-3",
                value=tsh_val,
                unit="uIU/mL",
                ref_low=0.40,
                ref_high=4.50,
                ref_raw="0.40 - 4.50 uIU/mL",
                is_abnormal=(tsh_val < 0.40 or tsh_val > 4.50),
                category="Thyroid Profile Total",
                source="Extracted from report",
                is_grounded=True,
            )
        )
        db.add(
            TestResult(
                id=f"res-{rep_id}-chol",
                report_id=rep_id,
                patient_id=p0.id,
                test_name="Total Cholesterol",
                canonical_name="Total Cholesterol",
                loinc_code="2093-3",
                value=chol_val,
                unit="mg/dL",
                ref_low=125.0,
                ref_high=200.0,
                ref_raw="< 200.0 mg/dL",
                is_abnormal=(chol_val > 200.0),
                category="Lipid Profile Test",
                source="Extracted from report",
                is_grounded=True,
            )
        )

    # Latest Report for P Vijay Kumar: 2026-08-25 (rep-vijay-09) with 26 parameters
    r_vijay = Report(
        id="rep-vijay-09",
        patient_id=p0.id,
        lab_name="Apollo Diagnostics Central Laboratory",
        report_date="2026-08-25",
        doctor_name="Dr. Ramesh Chandra, MD",
        file_name="vijay_comprehensive_aug_2026.pdf",
        file_url="/samples/sample_report_1.png",
    )
    db.add(r_vijay)
    db.add(
        ReportHash(
            id="hsh-vijay-09",
            report_id=r_vijay.id,
            sha256_hash="c89f31a47e2b109dc04587621fba89410ce921b76402ea87bc1290384a511cd9",
        )
    )

    vijay_full_results = [
        # 1. Complete Blood Count
        ("Hemoglobin", "Hemoglobin", "718-7", 16.3, "g/dL", 13.0, 17.0, "13.0 - 17.0 g/dL", False, "Complete Blood Count (CBC) Test"),
        ("RBC Count", "Red Blood Cell Count", "789-8", 4.65, "10^6/µl", 4.5, 5.5, "4.5 - 5.5 10^6/µl", False, "Complete Blood Count (CBC) Test"),
        ("PCV", "Packed Cell Volume (Hematocrit)", "20570-8", 48.3, "%", 40.0, 50.0, "40 - 50 %", False, "Complete Blood Count (CBC) Test"),
        ("Platelet Count", "Platelet Count", "777-3", 240.0, "10^3/µl", 150.0, 450.0, "150 - 450 10^3/µl", False, "Complete Blood Count (CBC) Test"),
        ("Total Leukocyte Count (WBC)", "Leukocyte Count (WBC)", "6690-2", 7.2, "10^3/µl", 4.0, 11.0, "4.0 - 11.0 10^3/µl", False, "Complete Blood Count (CBC) Test"),
        # 2. Thyroid Profile Total
        ("TSH", "Thyroid Stimulating Hormone", "3016-3", 2.45, "uIU/mL", 0.40, 4.50, "0.40 - 4.50 uIU/mL", False, "Thyroid Profile Total"),
        ("Total T3", "Triiodothyronine (Total T3)", "3049-4", 1.15, "ng/mL", 0.80, 2.00, "0.80 - 2.00 ng/mL", False, "Thyroid Profile Total"),
        ("Total T4", "Thyroxine (Total T4)", "3026-2", 7.8, "µg/dL", 5.1, 14.1, "5.1 - 14.1 µg/dL", False, "Thyroid Profile Total"),
        # 3. Liver Function Test (LFT)
        ("Total Bilirubin", "Total Bilirubin", "1975-2", 0.8, "mg/dL", 0.2, 1.2, "0.2 - 1.2 mg/dL", False, "Liver Function Test (LFT)"),
        ("SGOT (AST)", "Aspartate Aminotransferase (AST)", "1920-8", 28.0, "U/L", 10.0, 40.0, "10.0 - 40.0 U/L", False, "Liver Function Test (LFT)"),
        ("SGPT (ALT)", "Alanine Aminotransferase (ALT)", "1742-6", 32.0, "U/L", 10.0, 41.0, "10.0 - 41.0 U/L", False, "Liver Function Test (LFT)"),
        # 4. Lipid Profile Test
        ("Total Cholesterol", "Total Cholesterol", "2093-3", 178.0, "mg/dL", 125.0, 200.0, "< 200.0 mg/dL", False, "Lipid Profile Test"),
        ("Triglycerides", "Triglycerides", "2571-8", 135.0, "mg/dL", 50.0, 150.0, "< 150.0 mg/dL", False, "Lipid Profile Test"),
        ("LDL Cholesterol", "Low-Density Lipoprotein (LDL)", "2089-1", 105.0, "mg/dL", 60.0, 100.0, "< 100.0 mg/dL", True, "Lipid Profile Test"),
        ("HDL Cholesterol", "High-Density Lipoprotein (HDL)", "2085-9", 46.0, "mg/dL", 40.0, 60.0, "> 40.0 mg/dL", False, "Lipid Profile Test"),
        # 5. Kidney Function Test (KFT)
        ("Serum Creatinine", "Serum Creatinine", "2160-0", 0.95, "mg/dL", 0.70, 1.30, "0.70 - 1.30 mg/dL", False, "Kidney Function Test (KFT)"),
        ("Blood Urea Nitrogen (BUN)", "Blood Urea Nitrogen (BUN)", "3094-0", 14.0, "mg/dL", 7.0, 20.0, "7.0 - 20.0 mg/dL", False, "Kidney Function Test (KFT)"),
        ("Serum Uric Acid", "Serum Uric Acid", "3084-1", 5.8, "mg/dL", 3.5, 7.2, "3.5 - 7.2 mg/dL", False, "Kidney Function Test (KFT)"),
        # 6. Iron Test
        ("Serum Iron", "Serum Iron", "2498-4", 95.0, "µg/dL", 65.0, 175.0, "65 - 175 µg/dL", False, "Iron Test"),
        ("Serum Ferritin", "Serum Ferritin", "2276-4", 140.0, "ng/mL", 30.0, 400.0, "30 - 400 ng/mL", False, "Iron Test"),
        # 7. HBA1C Test
        ("HbA1c", "Glycated Hemoglobin (HbA1c)", "4548-4", 5.6, "%", 4.0, 5.6, "< 5.7 % (Normal)", False, "HBA1C Test"),
        # 8. Blood Sugar Fasting
        ("Fasting Blood Sugar", "Fasting Blood Glucose", "1558-6", 94.0, "mg/dL", 70.0, 99.0, "70 - 99 mg/dL", False, "Blood Sugar Fasting"),
        # 9. ESR Test
        ("ESR", "Erythrocyte Sedimentation Rate", "4537-7", 8.0, "mm/hr", 0.0, 15.0, "0 - 15 mm/hr", False, "ESR Test"),
        # 10. Urine Routine & Microscopic Examination Test
        ("Specific Gravity", "Urine Specific Gravity", "2965-2", 1.018, "", 1.005, 1.030, "1.005 - 1.030", False, "Urine Routine & Microscopic Examination Test"),
        ("Urine pH", "Urine pH", "2756-5", 6.2, "pH", 4.5, 8.0, "4.5 - 8.0", False, "Urine Routine & Microscopic Examination Test"),
        ("Urine Albumin (Protein)", "Urine Albumin", "1753-3", 0.0, "", 0.0, 0.0, "Negative / Nil", False, "Urine Routine & Microscopic Examination Test"),
    ]

    for idx, (tname, cname, loinc, val, unit, low, high, raw, abn, cat) in enumerate(vijay_full_results):
        db.add(
            TestResult(
                id=f"res-vijay-{idx+1:02d}",
                report_id=r_vijay.id,
                patient_id=p0.id,
                test_name=tname,
                canonical_name=cname,
                loinc_code=loinc,
                value=val,
                unit=unit,
                ref_low=low,
                ref_high=high,
                ref_raw=raw,
                is_abnormal=abn,
                category=cat,
                confidence_tier="high",
                legibility_flag=0.98,
                bbox_x=0.08,
                bbox_y=0.15 + (idx % 10) * 0.07,
                bbox_w=0.84,
                bbox_h=0.038,
                is_grounded=True,
                source="Extracted from report",
            )
        )

    # Patient 1: Arjun Sharma
    p1 = Patient(
        id="pat-arjun-sharma",
        name="Arjun Sharma",
        age=42,
        sex="Male",
        phone="+91 98765 43210",
        email="arjun.sharma@example.com",
    )
    db.add(p1)

    # Consent for Arjun
    c1 = Consent(
        id="cst-arjun-01",
        patient_id=p1.id,
        consented_at=datetime(2025, 9, 10, 8, 30, tzinfo=timezone.utc),
        purpose="Clinical laboratory report analysis and temporal intelligence",
    )
    db.add(c1)

    # Patient Reported Intake for Arjun
    intake1 = PatientReportedData(
        id="intk-arjun-01",
        patient_id=p1.id,
        age=42,
        sex="Male",
        symptoms="Mild sluggishness, occasional fatigue after work, slight weight gain",
        conditions="No known diabetes, family history of elevated cholesterol",
        allergies="Penicillin",
        medications="Occasional Vitamin D3 supplement",
        source="Patient-reported",
    )
    db.add(intake1)

    # Arjun Report 1: 2025-09-10 (Baseline)
    r1 = Report(
        id="rep-arjun-01",
        patient_id=p1.id,
        lab_name="Metropolis Healthcare Labs, Mumbai",
        report_date="2025-09-10",
        doctor_name="Dr. V. K. Malhotra, MD",
        file_name="arjun_lab_sept_2025.pdf",
        file_url="/samples/sample_report_1.png",
    )
    db.add(r1)
    db.add(
        ReportHash(
            id="hsh-01", report_id=r1.id, sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        )
    )

    r1_results = [
        {
            "test_name": "TSH",
            "loinc": "3016-3",
            "canon": "Thyroid Stimulating Hormone",
            "val": 3.2,
            "unit": "uIU/mL",
            "low": 0.4,
            "high": 4.5,
            "abn": False,
            "conf": "high",
            "leg": 0.98,
            "bbox": {"x": 0.08, "y": 0.28, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Total Cholesterol",
            "loinc": "2093-3",
            "canon": "Total Cholesterol",
            "val": 190.0,
            "unit": "mg/dL",
            "low": 125.0,
            "high": 200.0,
            "abn": False,
            "conf": "high",
            "leg": 0.96,
            "bbox": {"x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Triglycerides",
            "loinc": "2571-8",
            "canon": "Triglycerides",
            "val": 140.0,
            "unit": "mg/dL",
            "low": 50.0,
            "high": 150.0,
            "abn": False,
            "conf": "high",
            "leg": 0.95,
            "bbox": {"x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "HDL Cholesterol",
            "loinc": "2085-9",
            "canon": "HDL Cholesterol",
            "val": 45.0,
            "unit": "mg/dL",
            "low": 40.0,
            "high": 60.0,
            "abn": False,
            "conf": "high",
            "leg": 0.94,
            "bbox": {"x": 0.08, "y": 0.49, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Fasting Blood Glucose",
            "loinc": "1558-6",
            "canon": "Fasting Glucose",
            "val": 88.0,
            "unit": "mg/dL",
            "low": 70.0,
            "high": 99.0,
            "abn": False,
            "conf": "high",
            "leg": 0.97,
            "bbox": {"x": 0.08, "y": 0.63, "w": 0.84, "h": 0.038},
        },
    ]
    for res in r1_results:
        db.add(
            TestResult(
                id=f"res-{uuid.uuid4().hex[:8]}",
                report_id=r1.id,
                patient_id=p1.id,
                test_name=res["test_name"],
                loinc_code=res["loinc"],
                canonical_name=res["canon"],
                value=res["val"],
                unit=res["unit"],
                ref_low=res["low"],
                ref_high=res["high"],
                is_abnormal=res["abn"],
                confidence_tier=res["conf"],
                legibility_flag=res["leg"],
                bbox_x=res["bbox"]["x"],
                bbox_y=res["bbox"]["y"],
                bbox_w=res["bbox"]["w"],
                bbox_h=res["bbox"]["h"],
                is_grounded=True,
                source="Extracted from report",
            )
        )

    # Arjun Report 2: 2025-12-15 (Midpoint)
    r2 = Report(
        id="rep-arjun-02",
        patient_id=p1.id,
        lab_name="Metropolis Healthcare Labs, Mumbai",
        report_date="2025-12-15",
        doctor_name="Dr. V. K. Malhotra, MD",
        file_name="arjun_lab_dec_2025.pdf",
        file_url="/samples/sample_report_1.png",
    )
    db.add(r2)
    db.add(
        ReportHash(
            id="hsh-02", report_id=r2.id, sha256_hash="f4c0a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abc"
        )
    )

    r2_results = [
        {
            "test_name": "TSH",
            "loinc": "3016-3",
            "canon": "Thyroid Stimulating Hormone",
            "val": 4.8,
            "unit": "uIU/mL",
            "low": 0.4,
            "high": 4.5,
            "abn": True,
            "conf": "medium",
            "leg": 0.97,
            "bbox": {"x": 0.08, "y": 0.28, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Total Cholesterol",
            "loinc": "2093-3",
            "canon": "Total Cholesterol",
            "val": 215.0,
            "unit": "mg/dL",
            "low": 125.0,
            "high": 200.0,
            "abn": True,
            "conf": "medium",
            "leg": 0.95,
            "bbox": {"x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Triglycerides",
            "loinc": "2571-8",
            "canon": "Triglycerides",
            "val": 170.0,
            "unit": "mg/dL",
            "low": 50.0,
            "high": 150.0,
            "abn": True,
            "conf": "medium",
            "leg": 0.93,
            "bbox": {"x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "HDL Cholesterol",
            "loinc": "2085-9",
            "canon": "HDL Cholesterol",
            "val": 41.0,
            "unit": "mg/dL",
            "low": 40.0,
            "high": 60.0,
            "abn": False,
            "conf": "high",
            "leg": 0.93,
            "bbox": {"x": 0.08, "y": 0.49, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Fasting Blood Glucose",
            "loinc": "1558-6",
            "canon": "Fasting Glucose",
            "val": 91.0,
            "unit": "mg/dL",
            "low": 70.0,
            "high": 99.0,
            "abn": False,
            "conf": "high",
            "leg": 0.98,
            "bbox": {"x": 0.08, "y": 0.63, "w": 0.84, "h": 0.038},
        },
    ]
    for res in r2_results:
        db.add(
            TestResult(
                id=f"res-{uuid.uuid4().hex[:8]}",
                report_id=r2.id,
                patient_id=p1.id,
                test_name=res["test_name"],
                loinc_code=res["loinc"],
                canonical_name=res["canon"],
                value=res["val"],
                unit=res["unit"],
                ref_low=res["low"],
                ref_high=res["high"],
                is_abnormal=res["abn"],
                confidence_tier=res["conf"],
                legibility_flag=res["leg"],
                bbox_x=res["bbox"]["x"],
                bbox_y=res["bbox"]["y"],
                bbox_w=res["bbox"]["w"],
                bbox_h=res["bbox"]["h"],
                is_grounded=True,
                source="Extracted from report",
            )
        )

    # Arjun Report 3: 2026-03-01 (Latest)
    r3 = Report(
        id="rep-arjun-03",
        patient_id=p1.id,
        lab_name="Metropolis Healthcare Labs, Mumbai",
        report_date="2026-03-01",
        doctor_name="Dr. V. K. Malhotra, MD",
        file_name="arjun_lab_march_2026.pdf",
        file_url="/samples/sample_report_1.png",
    )
    db.add(r3)
    db.add(
        ReportHash(
            id="hsh-03", report_id=r3.id, sha256_hash="a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0"
        )
    )

    r3_results = [
        {
            "test_name": "TSH",
            "loinc": "3016-3",
            "canon": "Thyroid Stimulating Hormone",
            "val": 6.8,
            "unit": "uIU/mL",
            "low": 0.4,
            "high": 4.5,
            "abn": True,
            "conf": "medium",
            "leg": 0.96,
            "bbox": {"x": 0.08, "y": 0.28, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Total Cholesterol",
            "loinc": "2093-3",
            "canon": "Total Cholesterol",
            "val": 242.0,
            "unit": "mg/dL",
            "low": 125.0,
            "high": 200.0,
            "abn": True,
            "conf": "medium",
            "leg": 0.94,
            "bbox": {"x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Triglycerides",
            "loinc": "2571-8",
            "canon": "Triglycerides",
            "val": 195.0,
            "unit": "mg/dL",
            "low": 50.0,
            "high": 150.0,
            "abn": True,
            "conf": "medium",
            "leg": 0.92,
            "bbox": {"x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "HDL Cholesterol",
            "loinc": "2085-9",
            "canon": "HDL Cholesterol",
            "val": 38.0,
            "unit": "mg/dL",
            "low": 40.0,
            "high": 60.0,
            "abn": True,
            "conf": "medium",
            "leg": 0.91,
            "bbox": {"x": 0.08, "y": 0.49, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "LDL Cholesterol",
            "loinc": "13457-7",
            "canon": "LDL Cholesterol",
            "val": 165.0,
            "unit": "mg/dL",
            "low": 50.0,
            "high": 100.0,
            "abn": True,
            "conf": "medium",
            "leg": 0.93,
            "bbox": {"x": 0.08, "y": 0.56, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Fasting Blood Glucose",
            "loinc": "1558-6",
            "canon": "Fasting Glucose",
            "val": 94.0,
            "unit": "mg/dL",
            "low": 70.0,
            "high": 99.0,
            "abn": False,
            "conf": "high",
            "leg": 0.98,
            "bbox": {"x": 0.08, "y": 0.63, "w": 0.84, "h": 0.038},
        },
        {
            "test_name": "Serum Creatinine",
            "loinc": "2160-0",
            "canon": "Serum Creatinine",
            "val": 0.9,
            "unit": "mg/dL",
            "low": 0.6,
            "high": 1.2,
            "abn": False,
            "conf": "high",
            "leg": 0.97,
            "bbox": {"x": 0.08, "y": 0.70, "w": 0.84, "h": 0.038},
        },
    ]
    for res in r3_results:
        db.add(
            TestResult(
                id=f"res-{uuid.uuid4().hex[:8]}",
                report_id=r3.id,
                patient_id=p1.id,
                test_name=res["test_name"],
                loinc_code=res["loinc"],
                canonical_name=res["canon"],
                value=res["val"],
                unit=res["unit"],
                ref_low=res["low"],
                ref_high=res["high"],
                is_abnormal=res["abn"],
                confidence_tier=res["conf"],
                legibility_flag=res["leg"],
                bbox_x=res["bbox"]["x"],
                bbox_y=res["bbox"]["y"],
                bbox_w=res["bbox"]["w"],
                bbox_h=res["bbox"]["h"],
                is_grounded=True,
                source="Extracted from report",
            )
        )

    # Patient 2: Kavita Patel (Missing reference range demonstration)
    p2 = Patient(
        id="pat-kavita-patel",
        name="Kavita Patel",
        age=36,
        sex="Female",
        phone="+91 99887 76655",
        email="kavita.patel@example.com",
    )
    db.add(p2)
    db.add(
        Consent(
            id="cst-kavita-01",
            patient_id=p2.id,
            consented_at=datetime.now(timezone.utc),
            purpose="Clinical report analysis",
        )
    )
    db.add(
        PatientReportedData(
            id="intk-kavita-01",
            patient_id=p2.id,
            age=36,
            sex="Female",
            symptoms="Increased thirst, mild frequent urination",
            conditions="No diagnosed diabetes",
            medications="None",
            source="Patient-reported",
        )
    )
    r_kavita = Report(
        id="rep-kavita-01",
        patient_id=p2.id,
        lab_name="Lifeline Diagnostic Centre, Ahmedabad",
        report_date="2026-02-20",
        doctor_name="Dr. R. C. Shah",
        file_name="kavita_glycemic_report.pdf",
        file_url="/samples/sample_report_missing_range.png",
    )
    db.add(r_kavita)
    db.add(
        ReportHash(
            id="hsh-kavita-01",
            report_id=r_kavita.id,
            sha256_hash="c5d6e7f8a9b0123456789abcdef0123456789abcdef0123456789abcdef01234",
        )
    )

    kavita_results = [
        {
            "test_name": "Blood Glucose Fasting",
            "loinc": "1558-6",
            "canon": "Fasting Glucose",
            "val": 138.0,
            "unit": "mg/dL",
            "low": None,
            "high": None,
            "abn": True,
            "conf": "medium",
            "leg": 0.95,
            "is_grounded": True,
        },
        {
            "test_name": "HbA1c",
            "loinc": "4548-4",
            "canon": "HbA1c Glycated Hemoglobin",
            "val": 6.9,
            "unit": "%",
            "low": None,
            "high": None,
            "abn": True,
            "conf": "medium",
            "leg": 0.96,
            "is_grounded": True,
        },
        {
            "test_name": "Total Protein",
            "loinc": "2885-2",
            "canon": "Total Protein",
            "val": 7.1,
            "unit": "g/dL",
            "low": None,
            "high": None,
            "abn": False,
            "conf": "medium",
            "leg": 0.94,
            "is_grounded": False,
        },
    ]
    for res in kavita_results:
        db.add(
            TestResult(
                id=f"res-{uuid.uuid4().hex[:8]}",
                report_id=r_kavita.id,
                patient_id=p2.id,
                test_name=res["test_name"],
                loinc_code=res["loinc"],
                canonical_name=res["canon"],
                value=res["val"],
                unit=res["unit"],
                ref_low=res["low"],
                ref_high=res["high"],
                is_abnormal=res["abn"],
                confidence_tier=res["conf"],
                legibility_flag=res["leg"],
                bbox_x=0.1 if res["is_grounded"] else None,
                bbox_y=0.3 if res["is_grounded"] else None,
                bbox_w=0.8 if res["is_grounded"] else None,
                bbox_h=0.04 if res["is_grounded"] else None,
                is_grounded=res["is_grounded"],
                source="Extracted from report",
            )
        )

    db.commit()
    logger.info("[SampleData] Demo seed completed successfully.")
