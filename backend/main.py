import os
import io
import re
import uuid
import hmac
import hashlib
import json
import time
import secrets
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from collections import defaultdict

# Load .env file into os.environ if present
env_paths = [
    os.path.join(os.path.dirname(__file__), ".env"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
]
for ep in env_paths:
    if os.path.exists(ep):
        with open(ep, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Query, Header, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import (
    init_db, get_db, Patient, Report, TestResult,
    PatientReportedData, Consent, ReportHash,
    AiSummaryCache, LoincCache, RxNormCache, ResultAuditTrail
)
from extractors.vision_extractor import VisionExtractionEngine, check_patient_match, calculate_sha256
from normalizers.loinc_normalizer import LoincNormalizer
from normalizers.sanity_checker import BiologicalSanityChecker
from normalizers.rxnorm_service import RxNormService
from intake.provenance import detect_inconsistencies, PROVENANCE_TAGS
from trends.temporal_engine import TemporalIntelligenceEngine
from adversarial.interpreter import AdversarialInterpreter
from fhir.fhir_builder import FhirBundleBuilder
from consent.consent_manager import ConsentManager
from messaging.whatsapp_service import WhatsAppService
from samples.sample_data import seed_sample_database

# Authentication Secret: Generate cryptographically secure ephemeral 256-bit secret if not configured in env
raw_auth_secret = os.environ.get("MEDLENS_AUTH_SECRET")
if not raw_auth_secret:
    raw_auth_secret = secrets.token_hex(32)
MEDLENS_AUTH_SECRET = raw_auth_secret.encode()

def generate_session_token(patient_id: str) -> str:
    """Generates an HMAC-SHA256 session token tied to patient_id."""
    ts = int(time.time())
    msg = f"{patient_id}:{ts}".encode()
    sig = hmac.new(MEDLENS_AUTH_SECRET, msg, hashlib.sha256).hexdigest()
    return f"{patient_id}.{ts}.{sig}"

def verify_session_token(token: Optional[str], expected_patient_id: str) -> bool:
    """Verifies HMAC session token validity and patient ownership."""
    if not token:
        return False
    # Strip 'Bearer ' if present
    clean_token = token.replace("Bearer ", "").strip()
    parts = clean_token.split(".")
    if len(parts) != 3:
        return False
    pat_id, ts_str, sig = parts
    if pat_id != expected_patient_id:
        return False
    msg = f"{pat_id}:{ts_str}".encode()
    expected_sig = hmac.new(MEDLENS_AUTH_SECRET, msg, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected_sig)

# In-Memory Rate Limiter (Max 60 requests/minute per client IP)
client_request_history = defaultdict(list)
def check_rate_limit(client_ip: str, max_requests: int = 60, window_seconds: int = 60):
    now = time.time()
    history = client_request_history[client_ip]
    # Filter timestamps within window
    client_request_history[client_ip] = [t for t in history if now - t < window_seconds]
    if len(client_request_history[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Maximum 60 requests per minute allowed."
        )
    client_request_history[client_ip].append(now)

# Magic Bytes File Verification
def validate_magic_bytes(file_bytes: bytes, filename: str) -> str:
    """Verifies file type using magic bytes to block disguised executables."""
    if len(file_bytes) < 4:
        raise HTTPException(status_code=400, detail="Uploaded file is empty or corrupted.")
    
    # PDF magic bytes: %PDF-
    if file_bytes.startswith(b"%PDF"):
        return "pdf"
    # JPEG magic bytes: \xff\xd8\xff
    elif file_bytes.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    # PNG magic bytes: \x89PNG\r\n\x1a\n
    elif file_bytes.startswith(b"\x89PNG"):
        return "png"
    # WEBP magic bytes
    elif file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[:16]:
        return "webp"
    
    raise HTTPException(
        status_code=400,
        detail="Invalid file format. MedLens only accepts verified PDF, PNG, and JPEG clinical laboratory documents."
    )

# Initialize FastAPI application
app = FastAPI(
    title="MedLens API",
    description="Clinical Laboratory Report Intelligence, Provenance, Temporal Tracking & Patient Communication Platform",
    version="1.2.0"
)

# CORS: Explicit allowlist replacing wildcard
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
rxnorm_service = RxNormService()
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

class CorrectionRequest(BaseModel):
    result_id: str
    corrected_value: float
    correction_reason: Optional[str] = "Clinical manual verification"


# ---------------------- API Endpoints ----------------------

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "MedLens Clinical Intelligence Platform",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_vision_enabled": bool(os.environ.get("GEMINI_API_KEY")),
        "twilio_whatsapp_enabled": bool(os.environ.get("TWILIO_ACCOUNT_SID")),
        "security_features": ["HMAC Session Tokens", "CORS Allowlist", "Magic-Byte Verification", "Rate-Limiting"],
        "standards": ["HL7 FHIR R4", "ABDM M3 India", "LOINC (NLM API)", "RxNorm", "DPDP Act 2023"]
    }

@app.get("/api/glossary")
def get_glossary():
    glossary_path = os.path.join(os.path.dirname(__file__), "data", "glossary.json")
    if os.path.exists(glossary_path):
        with open(glossary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.get("/api/loinc/search")
def search_loinc(query: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """Live search across official NLM LOINC Clinical Tables API with persistent SQLite caching."""
    clean_q = query.strip().lower()
    cached = db.query(LoincCache).filter(LoincCache.query_term == clean_q).first()
    if cached:
        return {
            "loinc_code": cached.loinc_code,
            "canonical_name": cached.canonical_name,
            "standard_unit": cached.standard_unit,
            "is_recognized": cached.is_recognized,
            "source": "persistent_cache"
        }
    
    result = loinc_normalizer.normalize(query)
    # Save to persistent cache
    try:
        entry = LoincCache(
            query_term=clean_q,
            loinc_code=result.get("loinc_code"),
            canonical_name=result.get("canonical_name"),
            standard_unit=result.get("standard_unit"),
            is_recognized=result.get("is_recognized", True)
        )
        db.merge(entry)
        db.commit()
    except Exception:
        db.rollback()
    
    return result

@app.get("/api/drugs/search")
def search_drug(query: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    """Live NLM RxNorm drug normalization with persistent SQLite caching."""
    clean_q = query.strip().lower()
    cached = db.query(RxNormCache).filter(RxNormCache.brand_name == clean_q).first()
    if cached:
        return {
            "brand_name": cached.brand_name,
            "active_ingredient": cached.active_ingredient,
            "rxcui": cached.rxcui,
            "is_recognized": cached.is_recognized,
            "source": "persistent_cache"
        }
    
    result = rxnorm_service.normalize_drug(query)
    try:
        entry = RxNormCache(
            brand_name=clean_q,
            active_ingredient=result.get("active_ingredient", ""),
            rxcui=result.get("rxcui", ""),
            is_recognized=result.get("is_recognized", True)
        )
        db.merge(entry)
        db.commit()
    except Exception:
        db.rollback()

    return result

@app.get("/api/patients")
def list_patients(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    patients = db.query(Patient).offset(offset).limit(limit).all()
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

    session_token = generate_session_token(patient_id)

    return {
        "status": "success",
        "intake_id": intake.id,
        "source": intake.source,
        "session_token": session_token,
        "message": "Patient-reported intake recorded with provenance tag."
    }

@app.get("/api/patients/{patient_id}/reports")
def get_patient_reports(
    patient_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    reports = db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.report_date.asc()).offset(offset).limit(limit).all()
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
            "extraction_mode": getattr(r, "extraction_mode", "gemini_live"),
            "sha256_hash": hash_entry.sha256_hash if hash_entry else None,
            "tests_count": len(r.test_results),
            "flagged_count": sum(1 for t in r.test_results if t.is_abnormal)
        })
    return res

@app.get("/api/reports/search")
def search_reports(
    query: Optional[str] = Query(None),
    is_abnormal: Optional[bool] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Multi-factor search across clinical laboratory reports and biomarkers."""
    q = db.query(Report).join(Patient)
    if start_date:
        q = q.filter(Report.report_date >= start_date)
    if end_date:
        q = q.filter(Report.report_date <= end_date)
    
    reports = q.order_by(Report.report_date.desc()).offset(offset).limit(limit).all()
    results = []
    for r in reports:
        matching_tests = r.test_results
        if query:
            matching_tests = [t for t in matching_tests if query.lower() in t.test_name.lower() or (t.canonical_name and query.lower() in t.canonical_name.lower())]
        if is_abnormal is not None:
            matching_tests = [t for t in matching_tests if t.is_abnormal == is_abnormal]
        
        if matching_tests or not query:
            results.append({
                "report_id": r.id,
                "patient_name": r.patient.name if r.patient else "Unknown",
                "lab_name": r.lab_name,
                "report_date": r.report_date,
                "matched_tests_count": len(matching_tests),
                "total_flagged": sum(1 for t in r.test_results if t.is_abnormal)
            })
    return results

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

    results_list = []
    for tr in report.test_results:
        results_list.append({
            "id": tr.id,
            "test_name": tr.test_name,
            "loinc_code": tr.loinc_code,
            "canonical_name": tr.canonical_name,
            "value": tr.value,
            "unit": tr.unit,
            "ref_low": tr.ref_low,
            "ref_high": tr.ref_high,
            "ref_raw": tr.ref_raw,
            "is_abnormal": tr.is_abnormal,
            "confidence_tier": tr.confidence_tier,
            "legibility_flag": tr.legibility_flag,
            "bbox": {
                "x": tr.bbox_x if tr.bbox_x is not None else 0.08,
                "y": tr.bbox_y if tr.bbox_y is not None else 0.3,
                "w": tr.bbox_w if tr.bbox_w is not None else 0.84,
                "h": tr.bbox_h if tr.bbox_h is not None else 0.04
            },
            "is_grounded": tr.is_grounded,
            "grounding_type": getattr(tr, "grounding_type", "independent_ocr_line_match"),
            "source": tr.source
        })

    # Historical timeline aggregation for temporal engine
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

    # Inconsistency checks
    intake_dict = {
        "conditions": intake.conditions if intake else "",
        "symptoms": intake.symptoms if intake else "",
        "medications": intake.medications if intake else ""
    } if intake else None
    inconsistencies = detect_inconsistencies(intake_dict, results_list)

    # Cached Adversarial AI Summary
    results_hash = hashlib.sha256(json.dumps(results_list, sort_keys=True, default=str).encode()).hexdigest()
    cached_ai = db.query(AiSummaryCache).filter(
        AiSummaryCache.report_id == report_id,
        AiSummaryCache.results_hash == results_hash,
        AiSummaryCache.language == lang
    ).first()

    if cached_ai:
        ai_intelligence = json.loads(cached_ai.payload_json)
    else:
        ai_intelligence = adversarial_interpreter.generate_clinical_intelligence(
            extracted_results=results_list,
            temporal_analysis=temporal_data,
            language=lang
        )
        try:
            cache_entry = AiSummaryCache(
                id=f"aic-{uuid.uuid4().hex[:8]}",
                report_id=report_id,
                results_hash=results_hash,
                language=lang,
                payload_json=json.dumps(ai_intelligence)
            )
            db.add(cache_entry)
            db.commit()
        except Exception:
            db.rollback()

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
            "extraction_mode": getattr(report, "extraction_mode", "gemini_live"),
            "sha256_hash": hash_entry.sha256_hash if hash_entry else None,
            "provenance_tag": "Extracted from report"
        },
        "results": results_list,
        "inconsistencies": inconsistencies,
        "temporal_summary": temporal_data,
        "clinical_intelligence": ai_intelligence
    }

@app.post("/api/reports/{report_id}/correct-result")
def correct_test_result(
    report_id: str,
    req: CorrectionRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Human-in-the-Loop (HITL) Correction Endpoint.
    Enables clinicians/patients to update an extracted value with full audit logging,
    setting provenance to 'Human-corrected' while archiving original values.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required for this operation. Please provide Authorization: Bearer <token> header."
        )

    if not verify_session_token(authorization, report.patient_id):
        raise HTTPException(status_code=403, detail="Forbidden: Authentication token does not own this report record.")

    test_result = db.query(TestResult).filter(TestResult.id == req.result_id, TestResult.report_id == report_id).first()
    if not test_result:
        raise HTTPException(status_code=404, detail="Test result not found in report")

    # Audit Trail Entry
    audit = ResultAuditTrail(
        id=f"adt-{uuid.uuid4().hex[:8]}",
        result_id=test_result.id,
        previous_value=test_result.value,
        corrected_value=req.corrected_value,
        reason=req.correction_reason or "Manual clinical verification"
    )
    db.add(audit)

    # Re-evaluate sanity checks on corrected value
    sanity = sanity_checker.validate_result(
        loinc_code=test_result.loinc_code,
        value=req.corrected_value,
        ref_low=test_result.ref_low,
        ref_high=test_result.ref_high
    )

    test_result.raw_value = str(test_result.value) # Archive previous value
    test_result.value = req.corrected_value
    test_result.is_abnormal = sanity.get("is_abnormal", False)
    test_result.confidence_tier = "high"
    test_result.source = "Human-corrected"

    # Invalidate AI Summary cache for this report
    db.query(AiSummaryCache).filter(AiSummaryCache.report_id == report_id).delete()
    db.commit()

    return {
        "status": "success",
        "result_id": test_result.id,
        "corrected_value": test_result.value,
        "is_abnormal": test_result.is_abnormal,
        "source": test_result.source,
        "message": "Result updated with 'Human-corrected' provenance tag and audit trail."
    }

@app.post("/api/upload")
async def upload_report(
    request: Request,
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    patient_name: Optional[str] = Form(None),
    consent_confirmed: bool = Form(...),
    db: Session = Depends(get_db)
):
    # Rate limiting check
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip, max_requests=30, window_seconds=60)

    # Phase 4.5: Strict DPDP Consent Gating
    if not consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="DPDP Consent must be explicitly confirmed before uploading and processing medical records."
        )

    file_bytes = await file.read()
    
    # Security: File size check (Max 15MB)
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum file size is 15MB.")

    # Security: Magic-byte inspection
    file_type = validate_magic_bytes(file_bytes, file.filename or "")

    # Security: Sanitized server-side UUID filename
    file_id = uuid.uuid4().hex[:8]
    ext = "pdf" if file_type == "pdf" else "jpg" if file_type in ["jpeg", "jpg"] else "png"
    safe_filename = f"{uuid.uuid4().hex}.{ext}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # Step 1.1: SHA-256 Tamper Evidence
    sha256_hash = calculate_sha256(file_bytes)

    # Step 1.2: Multi-modal Vision Extraction + Grounding
    raw_extraction = vision_engine.process_document(
        file_bytes=file_bytes,
        file_name=file.filename or f"report.{ext}",
        active_patient_name=patient_name
    )

    resolved_patient_name = patient_name or raw_extraction.get("patient_name") or "Unknown Patient"

    # Find or create patient
    if not patient_id:
        patient = db.query(Patient).filter(Patient.name == resolved_patient_name).first()
        if not patient:
            patient = Patient(
                id=f"pat-{uuid.uuid4().hex[:8]}",
                name=resolved_patient_name,
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
            patient = Patient(id=patient_id, name=resolved_patient_name)
            db.add(patient)
            db.commit()
            db.refresh(patient)

    # Record consent log
    ConsentManager.record_consent(db, patient_id=patient.id)

    report_id = f"rep-{file_id}"
    report = Report(
        id=report_id,
        patient_id=patient.id,
        lab_name=raw_extraction.get("lab_name", "Diagnostic Laboratory"),
        report_date=raw_extraction.get("report_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        doctor_name=raw_extraction.get("doctor_name"),
        file_path=saved_path,
        file_name=file.filename or safe_filename,
        file_url=f"/uploads/{safe_filename}",
        extraction_mode=raw_extraction.get("extraction_mode", "gemini_live")
    )
    db.add(report)

    # Add hash
    db.add(ReportHash(
        id=f"hsh-{uuid.uuid4().hex[:8]}",
        report_id=report_id,
        sha256_hash=sha256_hash
    ))

    # Process results
    processed_results = []
    for item in raw_extraction.get("results", []):
        raw_name = item.get("test_name", "")
        norm = loinc_normalizer.normalize(raw_name)
        val = item.get("value")
        ref_low = item.get("ref_low")
        ref_high = item.get("ref_high")
        sanity = sanity_checker.validate_result(loinc_code=norm.get("loinc_code"), value=val, ref_low=ref_low, ref_high=ref_high)
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
            is_abnormal=sanity.get("is_abnormal", False),
            confidence_tier=sanity.get("confidence_tier", "high"),
            legibility_flag=item.get("legibility_flag", 0.95),
            bbox_x=bbox.get("x"), bbox_y=bbox.get("y"), bbox_w=bbox.get("w"), bbox_h=bbox.get("h"),
            is_grounded=item.get("is_grounded", False),
            grounding_type=item.get("grounding_type", "independent_ocr_line_match"),
            source="Extracted from report"
        )
        db.add(test_result)
        processed_results.append(test_result)

    db.commit()

    # Issue cryptographic session token
    session_token = generate_session_token(patient.id)

    return {
        "status": "success",
        "report_id": report_id,
        "patient_id": patient.id,
        "patient_name": resolved_patient_name,
        "session_token": session_token,
        "patient_match": raw_extraction.get("patient_match"),
        "sha256_hash": sha256_hash,
        "results_count": len(processed_results),
        "extraction_mode": raw_extraction.get("extraction_mode", "gemini_live"),
        "extraction_warning": raw_extraction.get("extraction_warning"),
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
        test_results=results_data,
        is_abdm_profile=False
    )
    return bundle

@app.get("/api/reports/{report_id}/abdm")
def export_abdm_fhir(report_id: str, db: Session = Depends(get_db)):
    """Exports ABDM (Ayushman Bharat Digital Mission) India NRCeS profile FHIR Bundle."""
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
        patient_data={"id": patient.id, "name": patient.name, "sex": patient.sex, "phone": patient.phone, "abha_id": f"91-8765-4321-{patient.id[:4]}"},
        report_data={"id": report.id, "lab_name": report.lab_name, "report_date": report.report_date},
        test_results=results_data,
        is_abdm_profile=True
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
def delete_patient_data(
    patient_id: str,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    DPDP Act Right to Erasure with mandatory cryptographic token verification.
    Requires caller's Bearer token to match target patient_id.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required for this operation. Please provide Authorization: Bearer <token> header."
        )

    if not verify_session_token(authorization, patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Caller does not have authorization to delete this patient record."
        )

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
    db.query(ResultAuditTrail).delete()
    db.query(AiSummaryCache).delete()
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
