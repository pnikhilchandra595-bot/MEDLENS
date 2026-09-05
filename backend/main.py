import os
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import (
    init_db, get_db, Patient, Report, TestResult,
    PatientReportedData, Consent, ReportHash
)
from extractors.vision_extractor import VisionExtractionEngine, check_patient_match, calculate_sha256
from normalizers.loinc_normalizer import LoincNormalizer
from normalizers.sanity_checker import BiologicalSanityChecker
from intake.provenance import detect_inconsistencies, PROVENANCE_TAGS
from trends.temporal_engine import TemporalIntelligenceEngine
from adversarial.interpreter import AdversarialInterpreter
from fhir.fhir_builder import FhirBundleBuilder
from consent.consent_manager import ConsentManager
from messaging.whatsapp_service import WhatsAppService
from samples.sample_data import seed_sample_database

# Initialize FastAPI application
app = FastAPI(
    title="MedLens API",
    description="Clinical Laboratory Report Intelligence, Provenance, Temporal Tracking & Patient Communication Platform",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure storage directories exist
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static storage
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Initialize helper engines
vision_engine = VisionExtractionEngine()
loinc_normalizer = LoincNormalizer()
sanity_checker = BiologicalSanityChecker()
temporal_engine = TemporalIntelligenceEngine()
adversarial_interpreter = AdversarialInterpreter()
whatsapp_service = WhatsAppService()

# Startup Event
@app.on_event("startup")
def startup_event():
    init_db()
    db = next(get_db())
    try:
        seed_sample_database(db)
    finally:
        db.close()

# Schemas
class IntakeRequest(BaseModel):
    patient_id: str
    age: Optional[int] = None
    sex: Optional[str] = None
    symptoms: Optional[str] = None
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    medications: Optional[str] = None

class ConsentRequest(BaseModel):
    patient_id: str
    purpose: Optional[str] = "Clinical report analysis and temporal intelligence"

class WhatsAppRequest(BaseModel):
    phone: str
    patient_name: str
    flag_count: int
    flagged_tests: List[str]
    doctor_questions: List[str]
    language: Optional[str] = "en"


# ---------------------- API Endpoints ----------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MedLens Clinical Intelligence Platform",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_vision_enabled": bool(os.environ.get("GEMINI_API_KEY")),
        "twilio_whatsapp_enabled": bool(os.environ.get("TWILIO_ACCOUNT_SID")),
        "standards": ["FHIR R4", "LOINC", "DPDP Act 2023"]
    }

@app.get("/api/glossary")
def get_glossary():
    import json
    glossary_path = os.path.join(os.path.dirname(__file__), "data", "glossary.json")
    if os.path.exists(glossary_path):
        with open(glossary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.get("/api/patients")
def list_patients(db: Session = Depends(get_db)):
    patients = db.query(Patient).all()
    res = []
    for p in patients:
        res.append({
            "id": p.id,
            "name": p.name,
            "age": p.age,
            "sex": p.sex,
            "phone": p.phone,
            "reports_count": len(p.reports),
            "created_at": p.created_at.isoformat() if p.created_at else None
        })
    return res

@app.get("/api/patients/{patient_id}")
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_intake = db.query(PatientReportedData).filter(
        PatientReportedData.patient_id == patient_id
    ).order_by(PatientReportedData.reported_at.desc()).first()

    intake_data = None
    if latest_intake:
        intake_data = {
            "id": latest_intake.id,
            "age": latest_intake.age,
            "sex": latest_intake.sex,
            "symptoms": latest_intake.symptoms,
            "conditions": latest_intake.conditions,
            "allergies": latest_intake.allergies,
            "medications": latest_intake.medications,
            "source": latest_intake.source,
            "reported_at": latest_intake.reported_at.isoformat() if latest_intake.reported_at else None
        }

    consent_status = ConsentManager.get_consent_status(db, patient_id)

    return {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "sex": patient.sex,
        "phone": patient.phone,
        "email": patient.email,
        "intake": intake_data,
        "consent": consent_status
    }

@app.post("/api/patients/{patient_id}/intake")
def save_patient_intake(patient_id: str, req: IntakeRequest, db: Session = Depends(get_db)):
    intake = PatientReportedData(
        id=f"intk-{uuid.uuid4().hex[:8]}",
        patient_id=patient_id,
        age=req.age,
        sex=req.sex,
        symptoms=req.symptoms,
        conditions=req.conditions,
        allergies=req.allergies,
        medications=req.medications,
        source="Patient-reported"
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)
    return {
        "status": "success",
        "intake_id": intake.id,
        "source": intake.source,
        "message": "Patient-reported intake recorded with provenance tag."
    }

@app.get("/api/patients/{patient_id}/reports")
def get_patient_reports(patient_id: str, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.report_date.asc()).all()
    res = []
    for r in reports:
        hash_entry = db.query(ReportHash).filter(ReportHash.report_id == r.id).first()
        res.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "lab_name": r.lab_name,
            "report_date": r.report_date,
            "doctor_name": r.doctor_name,
            "file_name": r.file_name,
            "file_url": r.file_url,
            "sha256_hash": hash_entry.sha256_hash if hash_entry else None,
            "tests_count": len(r.test_results),
            "flagged_count": sum(1 for t in r.test_results if t.is_abnormal)
        })
    return res

@app.get("/api/reports/{report_id}")
def get_report_details(
    report_id: str,
    lang: str = Query("en", description="Language code: en, hi, te"),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    patient = db.query(Patient).filter(Patient.id == report.patient_id).first()
    hash_entry = db.query(ReportHash).filter(ReportHash.report_id == report_id).first()
    intake = db.query(PatientReportedData).filter(
        PatientReportedData.patient_id == report.patient_id
    ).order_by(PatientReportedData.reported_at.desc()).first()

    # Formatted test results
    results_list = []
    for t in report.test_results:
        results_list.append({
            "id": t.id,
            "test_name": t.test_name,
            "canonical_name": t.canonical_name or t.test_name,
            "loinc_code": t.loinc_code,
            "value": t.value,
            "unit": t.unit,
            "ref_low": t.ref_low,
            "ref_high": t.ref_high,
            "ref_raw": t.ref_raw,
            "is_abnormal": t.is_abnormal,
            "confidence_tier": t.confidence_tier,
            "legibility_flag": t.legibility_flag,
            "is_grounded": t.is_grounded,
            "bbox": {
                "x": t.bbox_x, "y": t.bbox_y, "w": t.bbox_w, "h": t.bbox_h
            } if (t.bbox_x is not None and t.is_grounded) else None,
            "source": t.source or "Extracted from report"
        })

    # Historical timeline context for longitudinal trends
    all_reports = db.query(Report).filter(Report.patient_id == report.patient_id).order_by(Report.report_date.asc()).all()
    historical_payload = []
    for r in all_reports:
        historical_payload.append({
            "id": r.id,
            "report_date": r.report_date,
            "results": [
                {
                    "test_name": tr.test_name,
                    "canonical_name": tr.canonical_name,
                    "loinc_code": tr.loinc_code,
                    "value": tr.value,
                    "unit": tr.unit,
                    "ref_low": tr.ref_low,
                    "ref_high": tr.ref_high,
                    "is_abnormal": tr.is_abnormal,
                    "confidence_tier": tr.confidence_tier
                } for tr in r.test_results
            ]
        })

    temporal_data = temporal_engine.analyze_patient_timeline(historical_payload)

    # Inconsistency checks (Phase 1.5)
    intake_dict = {
        "conditions": intake.conditions if intake else "",
        "symptoms": intake.symptoms if intake else "",
        "medications": intake.medications if intake else ""
    } if intake else None
    inconsistencies = detect_inconsistencies(intake_dict, results_list)

    # Adversarial AI Layer (Phase 3 & 7)
    ai_intelligence = adversarial_interpreter.generate_clinical_intelligence(
        extracted_results=results_list,
        temporal_analysis=temporal_data,
        language=lang
    )

    return {
        "id": report.id,
        "patient": {
            "id": patient.id if patient else "",
            "name": patient.name if patient else "Unknown",
            "age": patient.age if patient else None,
            "sex": patient.sex if patient else None,
            "phone": patient.phone if patient else None
        },
        "report_metadata": {
            "lab_name": report.lab_name,
            "report_date": report.report_date,
            "doctor_name": report.doctor_name,
            "file_name": report.file_name,
            "file_url": report.file_url,
            "sha256_hash": hash_entry.sha256_hash if hash_entry else None,
            "provenance_tag": "Extracted from report"
        },
        "results": results_list,
        "inconsistencies": inconsistencies,
        "temporal_summary": temporal_data,
        "clinical_intelligence": ai_intelligence
    }

@app.post("/api/upload")
async def upload_report(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form("Arjun Sharma"),
    consent_confirmed: bool = Form(...),
    db: Session = Depends(get_db)
):
    # Phase 4.5: Strict Consent Gating
    if not consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="DPDP Consent must be explicitly confirmed before uploading and processing medical records."
        )

    file_bytes = await file.read()
    file_id = uuid.uuid4().hex[:8]
    safe_filename = f"{file_id}_{file.filename}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Step 1.1: SHA-256 Tamper Evidence
    sha256_hash = calculate_sha256(file_bytes)

    # Find or create patient
    if not patient_id:
        patient = db.query(Patient).filter(Patient.name == patient_name).first()
        if not patient:
            patient = Patient(
                id=f"pat-{uuid.uuid4().hex[:8]}",
                name=patient_name or "New Patient",
                age=40,
                sex="Unspecified"
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
        patient_id = patient.id
    else:
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            patient = Patient(id=patient_id, name=patient_name or "Patient")
            db.add(patient)
            db.commit()
            db.refresh(patient)

    # Record consent log
    ConsentManager.record_consent(db, patient_id=patient.id)

    # Step 1.2: Multi-modal Vision Extraction + Grounding
    raw_extraction = vision_engine.process_document(
        file_bytes=file_bytes,
        file_name=file.filename,
        active_patient_name=patient.name
    )

    report_id = f"rep-{file_id}"
    report = Report(
        id=report_id,
        patient_id=patient.id,
        lab_name=raw_extraction.get("lab_name", "Diagnostic Laboratory"),
        report_date=raw_extraction.get("report_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        doctor_name=raw_extraction.get("doctor_name"),
        file_path=saved_path,
        file_name=file.filename,
        file_url=f"/uploads/{safe_filename}"
    )
    db.add(report)

    # Add hash
    db.add(ReportHash(
        id=f"hsh-{uuid.uuid4().hex[:8]}",
        report_id=report_id,
        sha256_hash=sha256_hash
    ))

    # Process and normalize results
    processed_results = []
    for item in raw_extraction.get("results", []):
        raw_name = item.get("test_name", "")
        norm = loinc_normalizer.normalize(raw_name)
        val = item.get("value")
        ref_low = item.get("ref_low")
        ref_high = item.get("ref_high")

        # Sanity check & 2-tier confidence ranking
        sanity = sanity_checker.validate_result(
            loinc_code=norm.get("loinc_code"),
            value=val,
            ref_low=ref_low,
            ref_high=ref_high,
            is_abnormal_extracted=item.get("is_abnormal")
        )

        bbox = item.get("bbox") or {}

        test_result = TestResult(
            id=f"res-{uuid.uuid4().hex[:8]}",
            report_id=report_id,
            patient_id=patient.id,
            test_name=raw_name,
            loinc_code=norm.get("loinc_code"),
            canonical_name=norm.get("canonical_name"),
            value=val,
            unit=item.get("unit") or norm.get("standard_unit"),
            ref_low=ref_low,
            ref_high=ref_high,
            ref_raw=item.get("ref_raw"),
            is_abnormal=sanity.get("is_abnormal", False),
            confidence_tier=sanity.get("confidence_tier", "high"),
            legibility_flag=item.get("legibility_flag", 0.95),
            bbox_x=bbox.get("x"),
            bbox_y=bbox.get("y"),
            bbox_w=bbox.get("w"),
            bbox_h=bbox.get("h"),
            is_grounded=item.get("is_grounded", False),
            source="Extracted from report"
        )
        db.add(test_result)
        processed_results.append(test_result)

    db.commit()

    return {
        "status": "success",
        "report_id": report_id,
        "patient_id": patient.id,
        "patient_match": raw_extraction.get("patient_match"),
        "sha256_hash": sha256_hash,
        "results_count": len(processed_results),
        "message": "Lab report successfully processed with grounded bboxes and LOINC normalization."
    }

@app.get("/api/patients/{patient_id}/timeline")
def get_patient_timeline(patient_id: str, db: Session = Depends(get_db)):
    reports = db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.report_date.asc()).all()
    payload = []
    for r in reports:
        payload.append({
            "id": r.id,
            "report_date": r.report_date,
            "results": [
                {
                    "test_name": tr.test_name,
                    "canonical_name": tr.canonical_name,
                    "loinc_code": tr.loinc_code,
                    "value": tr.value,
                    "unit": tr.unit,
                    "ref_low": tr.ref_low,
                    "ref_high": tr.ref_high,
                    "is_abnormal": tr.is_abnormal,
                    "confidence_tier": tr.confidence_tier
                } for tr in r.test_results
            ]
        })
    return temporal_engine.analyze_patient_timeline(payload)

@app.get("/api/reports/{report_id}/fhir")
def export_fhir(report_id: str, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    patient = db.query(Patient).filter(Patient.id == report.patient_id).first()

    results_data = [
        {
            "test_name": tr.test_name,
            "canonical_name": tr.canonical_name,
            "loinc_code": tr.loinc_code,
            "value": tr.value,
            "unit": tr.unit,
            "ref_low": tr.ref_low,
            "ref_high": tr.ref_high,
            "is_abnormal": tr.is_abnormal,
            "confidence_tier": tr.confidence_tier,
            "source": tr.source
        } for tr in report.test_results
    ]

    bundle = FhirBundleBuilder.build_fhir_bundle(
        patient_data={"id": patient.id, "name": patient.name, "sex": patient.sex, "phone": patient.phone},
        report_data={"id": report.id, "lab_name": report.lab_name, "report_date": report.report_date},
        test_results=results_data
    )
    return bundle

@app.post("/api/consent")
def record_consent(req: ConsentRequest, db: Session = Depends(get_db)):
    c = ConsentManager.record_consent(db, patient_id=req.patient_id, purpose=req.purpose or "")
    return {
        "status": "success",
        "consent_id": c.id,
        "consented_at": c.consented_at.isoformat()
    }

@app.get("/api/consent/{patient_id}")
def check_consent(patient_id: str, db: Session = Depends(get_db)):
    return ConsentManager.get_consent_status(db, patient_id)

@app.delete("/api/delete-my-data/{patient_id}")
def delete_patient_data(patient_id: str, db: Session = Depends(get_db)):
    return ConsentManager.delete_patient_data(db, patient_id)

@app.post("/api/whatsapp/send")
def send_whatsapp(req: WhatsAppRequest):
    return whatsapp_service.send_message(
        phone_number=req.phone,
        patient_name=req.patient_name,
        flag_count=req.flag_count,
        flagged_tests=req.flagged_tests,
        doctor_questions=req.doctor_questions,
        language=req.language or "en"
    )

@app.post("/api/seed")
def reseed_database(db: Session = Depends(get_db)):
    # Clear and reseed demo data
    db.query(ReportHash).delete()
    db.query(TestResult).delete()
    db.query(Report).delete()
    db.query(PatientReportedData).delete()
    db.query(Consent).delete()
    db.query(Patient).delete()
    db.commit()
    seed_sample_database(db)
    return {"status": "success", "message": "Demo data successfully reseeded."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
