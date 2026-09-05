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
