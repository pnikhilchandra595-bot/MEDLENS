"""
Laboratory Reports & Clinical Extraction Router for MedLens API.
Provides document ingestion, multi-modal Vision extraction, LOINC & RxNorm normalization,
HITL (Human-in-the-Loop) audit-trailed corrections, multi-factor search, and glossary lookup.
"""

import hashlib
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from adversarial.interpreter import AdversarialInterpreter
from consent.consent_manager import ConsentManager
from database import (
    AiSummaryCache,
    LoincCache,
    Patient,
    PatientReportedData,
    Report,
    ReportHash,
    ResultAuditTrail,
    RxNormCache,
    TestResult,
    get_db,
)
from extractors.vision_extractor import VisionExtractionEngine, calculate_sha256
from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, Query, Request, UploadFile, status
from intake.provenance import detect_inconsistencies
from normalizers.loinc_normalizer import LoincNormalizer
from normalizers.rxnorm_service import RxNormService
from normalizers.sanity_checker import BiologicalSanityChecker
from pydantic import BaseModel, Field
from security import check_rate_limit, generate_session_token, validate_magic_bytes, verify_session_token
from sqlalchemy.orm import Session
from trends.temporal_engine import TemporalIntelligenceEngine

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Reports & Extraction"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

vision_engine = VisionExtractionEngine()
loinc_normalizer = LoincNormalizer()
sanity_checker = BiologicalSanityChecker()
rxnorm_service = RxNormService()
temporal_engine = TemporalIntelligenceEngine()
adversarial_interpreter = AdversarialInterpreter()


class CorrectionRequest(BaseModel):
    """Schema for Human-in-the-Loop (HITL) test result corrections."""

    result_id: str = Field(..., description="Unique test result identifier")
    corrected_value: float = Field(..., description="Clinically verified corrected numeric value")
    correction_reason: Optional[str] = Field("Clinical manual verification", description="Audit reason for correction")


@router.get("/api/glossary", response_model=Dict[str, Any])
def get_glossary() -> Dict[str, Any]:
    """
    Retrieves the clinical terminology glossary mapping medical terms to layman explanations.

    Returns:
        Dict[str, Any]: Dictionary of term definitions, normal ranges, and clinical significance.
    """
    glossary_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "glossary.json")
    if os.path.exists(glossary_path):
        with open(glossary_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


@router.get("/api/loinc/search", response_model=Dict[str, Any])
def search_loinc(
    query: str = Query(..., min_length=2, description="Lab test name or query string"), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Live search across official NLM LOINC Clinical Tables API with persistent database caching.

    Args:
        query: Biomarker or laboratory test query string.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Standardized LOINC code, canonical name, and standard unit.
    """
    clean_q = query.strip().lower()
    cached = db.query(LoincCache).filter(LoincCache.query_term == clean_q).first()
    if cached:
        return {
            "loinc_code": cached.loinc_code,
            "canonical_name": cached.canonical_name,
            "standard_unit": cached.standard_unit,
            "is_recognized": cached.is_recognized,
            "source": "persistent_cache",
        }

    result = loinc_normalizer.normalize(query)
    try:
        entry = LoincCache(
            query_term=clean_q,
            loinc_code=result.get("loinc_code"),
            canonical_name=result.get("canonical_name"),
            standard_unit=result.get("standard_unit"),
            is_recognized=result.get("is_recognized", True),
        )
        db.merge(entry)
        db.commit()
    except Exception as e:
        logger.warning("Failed to commit LOINC cache entry: %s", e)
        db.rollback()

    return result


@router.get("/api/drugs/search", response_model=Dict[str, Any])
def search_drug(
    query: str = Query(..., min_length=2, description="Drug brand name or active ingredient"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Live NLM RxNorm drug normalization with persistent database caching.

    Args:
        query: Medication brand or ingredient name.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Normalized active ingredient, RxCUI identifier, and recognition status.
    """
    clean_q = query.strip().lower()
    cached = db.query(RxNormCache).filter(RxNormCache.brand_name == clean_q).first()
    if cached:
        return {
            "brand_name": cached.brand_name,
            "active_ingredient": cached.active_ingredient,
            "rxcui": cached.rxcui,
            "is_recognized": cached.is_recognized,
            "source": "persistent_cache",
        }

    result = rxnorm_service.normalize_drug(query)
    try:
        entry = RxNormCache(
            brand_name=clean_q,
            active_ingredient=result.get("active_ingredient", ""),
            rxcui=result.get("rxcui", ""),
            is_recognized=result.get("is_recognized", True),
        )
        db.merge(entry)
        db.commit()
    except Exception as e:
        logger.warning("Failed to commit RxNorm cache entry: %s", e)
        db.rollback()

    return result


@router.get("/api/reports/search", response_model=Dict[str, Any])
def search_reports(
    query: Optional[str] = Query(None, description="Biomarker or test name query"),
    is_abnormal: Optional[bool] = Query(None, description="Filter by abnormality status"),
    start_date: Optional[str] = Query(None, description="ISO start date filter"),
    end_date: Optional[str] = Query(None, description="ISO end date filter"),
    limit: int = Query(20, ge=1, le=100, description="Max reports to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Multi-factor search across clinical laboratory reports and extracted biomarkers
    with deterministic limit/offset pagination and total_count metadata.

    Args:
        query: Optional test name or canonical biomarker substring.
        is_abnormal: Optional boolean to filter only flagged abnormal tests.
        start_date: Optional lower date bound.
        end_date: Optional upper date bound.
        limit: Max results count per page (default 20).
        offset: Pagination offset (default 0).
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Object containing total_count, limit, offset, and matching results list.
    """
    q = db.query(Report).join(Patient)
    if start_date:
        q = q.filter(Report.report_date >= start_date)
    if end_date:
        q = q.filter(Report.report_date <= end_date)

    all_reports = q.order_by(Report.report_date.desc()).all()
    matched_results = []
    for r in all_reports:
        matching_tests = r.test_results
        if query:
            matching_tests = [
                t
                for t in matching_tests
                if query.lower() in t.test_name.lower()
                or (t.canonical_name and query.lower() in t.canonical_name.lower())
            ]
        if is_abnormal is not None:
            matching_tests = [t for t in matching_tests if t.is_abnormal == is_abnormal]

        if matching_tests or not query:
            matched_results.append(
                {
                    "report_id": r.id,
                    "patient_name": r.patient.name if r.patient else "Unknown",
                    "lab_name": r.lab_name,
                    "report_date": r.report_date,
                    "matched_tests_count": len(matching_tests),
                    "total_flagged": sum(1 for t in r.test_results if t.is_abnormal),
                }
            )

    total_count = len(matched_results)
    paginated = matched_results[offset : offset + limit]

    return {
        "total_count": total_count,
        "limit": limit,
        "offset": offset,
        "results": paginated,
    }


@router.get("/api/reports/{report_id}", response_model=Dict[str, Any])
def get_report_details(
    report_id: str, lang: str = Query("en", description="Language code: en, hi, te"), db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Retrieves comprehensive laboratory report details including pixel-grounded bounding boxes,
    LOINC normalized parameters, biological reference ranges, longitudinal history,
    inconsistency flags, and adversarial AI non-diagnostic summaries.

    Args:
        report_id: Unique laboratory report identifier.
        lang: Language for clinical intelligence summary ('en' | 'hi' | 'te').
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Full report payload with metadata, tests, intelligence, and inconsistencies.

    Raises:
        HTTPException: HTTP 404 if the report is not found.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    patient = db.query(Patient).filter(Patient.id == report.patient_id).first()
    hash_entry = db.query(ReportHash).filter(ReportHash.report_id == report_id).first()
    intake = (
        db.query(PatientReportedData)
        .filter(PatientReportedData.patient_id == report.patient_id)
        .order_by(PatientReportedData.reported_at.desc())
        .first()
    )

    # Historical timeline aggregation for temporal engine & history graph
    all_reports = (
        db.query(Report).filter(Report.patient_id == report.patient_id).order_by(Report.report_date.asc()).all()
    )

    results_list = []
    for tr in report.test_results:
        # Collect chronological history for this analyte
        history_points = []
        for r in all_reports:
            for other_tr in r.test_results:
                if other_tr.canonical_name == tr.canonical_name or other_tr.test_name == tr.test_name:
                    history_points.append(
                        {
                            "date": r.report_date,
                            "value": other_tr.value,
                            "ref_raw": other_tr.ref_raw,
                            "is_abnormal": other_tr.is_abnormal,
                            "is_borderline": getattr(other_tr, "is_borderline", False),
                        }
                    )

        # Query audit trails for this test result
        audit_records = (
            db.query(ResultAuditTrail)
            .filter(ResultAuditTrail.result_id == tr.id)
            .order_by(ResultAuditTrail.created_at.desc())
            .all()
        )
        audit_trail = [
            {
                "id": a.id,
                "previous_value": a.previous_value,
                "corrected_value": a.corrected_value,
                "reason": a.reason,
                "corrected_by": a.corrected_by,
                "created_at": a.created_at.isoformat() if a.created_at else None,
            }
            for a in audit_records
        ]

        results_list.append(
            {
                "id": tr.id,
                "category": getattr(tr, "category", "General Laboratory Panel") or "General Laboratory Panel",
                "test_name": tr.test_name,
                "loinc_code": tr.loinc_code,
                "canonical_name": tr.canonical_name,
                "value": tr.value,
                "unit": tr.unit,
                "ref_low": tr.ref_low,
                "ref_high": tr.ref_high,
                "ref_raw": tr.ref_raw,
                "is_abnormal": tr.is_abnormal,
                "is_borderline": getattr(tr, "is_borderline", False),
                "confidence_tier": tr.confidence_tier,
                "legibility_flag": tr.legibility_flag,
                "bbox": {
                    "x": tr.bbox_x if tr.bbox_x is not None else 0.08,
                    "y": tr.bbox_y if tr.bbox_y is not None else 0.3,
                    "w": tr.bbox_w if tr.bbox_w is not None else 0.84,
                    "h": tr.bbox_h if tr.bbox_h is not None else 0.04,
                },
                "is_grounded": tr.is_grounded,
                "grounding_type": getattr(tr, "grounding_type", "independent_ocr_line_match"),
                "source": tr.source,
                "history": history_points,
                "audit_trail": audit_trail,
            }
        )

    historical_payload = []
    for r in all_reports:
        historical_payload.append(
            {
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
                        "confidence_tier": tr.confidence_tier,
                    }
                    for tr in r.test_results
                ],
            }
        )

    temporal_data = temporal_engine.analyze_patient_timeline(historical_payload)

    # Inconsistency checks
    intake_dict = (
        {
            "conditions": intake.conditions if intake else "",
            "symptoms": intake.symptoms if intake else "",
            "medications": intake.medications if intake else "",
        }
        if intake
        else None
    )
    inconsistencies = detect_inconsistencies(intake_dict, results_list)

    # Cached Adversarial AI Summary
    results_hash = hashlib.sha256(json.dumps(results_list, sort_keys=True, default=str).encode()).hexdigest()
    cached_ai = (
        db.query(AiSummaryCache)
        .filter(
            AiSummaryCache.report_id == report_id,
            AiSummaryCache.results_hash == results_hash,
            AiSummaryCache.language == lang,
        )
        .first()
    )

    if cached_ai:
        ai_intelligence = json.loads(cached_ai.payload_json)
    else:
        ai_intelligence = adversarial_interpreter.generate_clinical_intelligence(
            extracted_results=results_list, temporal_analysis=temporal_data, language=lang
        )
        try:
            cache_entry = AiSummaryCache(
                id=f"aic-{uuid.uuid4().hex[:8]}",
                report_id=report_id,
                results_hash=results_hash,
                language=lang,
                payload_json=json.dumps(ai_intelligence),
            )
            db.add(cache_entry)
            db.commit()
        except Exception as e:
            logger.warning("Failed to commit AI summary cache entry: %s", e)
            db.rollback()

    return {
        "id": report.id,
        "patient": {
            "id": patient.id if patient else "",
            "name": patient.name if patient else "Unknown",
            "age": patient.age if patient else None,
            "sex": patient.sex if patient else None,
            "phone": patient.phone if patient else None,
        },
        "report_metadata": {
            "lab_name": report.lab_name,
            "report_date": report.report_date,
            "doctor_name": report.doctor_name,
            "file_name": report.file_name,
            "file_url": report.file_url,
            "extraction_mode": getattr(report, "extraction_mode", "gemini_live"),
            "sha256_hash": hash_entry.sha256_hash if hash_entry else None,
            "provenance_tag": "Extracted from report",
        },
        "results": results_list,
        "inconsistencies": inconsistencies,
        "temporal_summary": temporal_data,
        "clinical_intelligence": ai_intelligence,
    }


@router.post("/api/reports/{report_id}/correct-result", response_model=Dict[str, Any])
def correct_test_result(
    request: Request,
    report_id: str,
    req: CorrectionRequest,
    authorization: Optional[str] = Header(None, description="Bearer HMAC session token"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Human-in-the-Loop (HITL) Correction Endpoint.
    Enables clinicians and patients to correct an extracted value with full immutable audit logging,
    updating provenance to 'Human-corrected' while archiving original values.

    Security: Requires caller's Bearer HMAC token to match the owning patient ID.

    Args:
        request: FastAPI HTTP request object for rate limiting.
        report_id: Unique report identifier.
        req: Correction payload with result ID, new value, and reason.
        authorization: Bearer session token header.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Status confirmation, updated result details, and audit confirmation.

    Raises:
        HTTPException: HTTP 401 if token is missing, HTTP 403 if unauthorized, HTTP 404 if not found.
    """
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip, max_requests=30, window_seconds=60)

    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required for this operation. Please provide Authorization: Bearer <token> header.",
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
        reason=req.correction_reason or "Manual clinical verification",
    )
    db.add(audit)

    # Re-evaluate sanity checks on corrected value
    sanity = sanity_checker.validate_result(
        loinc_code=test_result.loinc_code,
        value=req.corrected_value,
        ref_low=test_result.ref_low,
        ref_high=test_result.ref_high,
    )

    test_result.raw_value = str(test_result.value)  # Archive previous value
    test_result.value = req.corrected_value
    test_result.is_abnormal = sanity.get("is_abnormal", False)
    test_result.confidence_tier = "high"
    test_result.source = "Human-corrected"

    # Invalidate AI Summary cache for this report
    db.query(AiSummaryCache).filter(AiSummaryCache.report_id == report_id).delete()
    db.commit()

    logger.info("HITL Correction recorded for test_result %s (new val: %s)", test_result.id, req.corrected_value)

    return {
        "status": "success",
        "result_id": test_result.id,
        "corrected_value": test_result.value,
        "is_abnormal": test_result.is_abnormal,
        "source": test_result.source,
        "audit_trail": {
            "id": audit.id,
            "previous_value": audit.previous_value,
            "corrected_value": audit.corrected_value,
            "reason": audit.reason,
            "corrected_by": audit.corrected_by,
            "created_at": audit.created_at.isoformat() if audit.created_at else None,
        },
        "message": "Result updated with 'Human-corrected' provenance tag and audit trail.",
    }


@router.post("/api/upload", response_model=Dict[str, Any])
async def upload_report(
    request: Request,
    file: UploadFile = File(..., description="PDF, PNG, or JPEG clinical report file"),
    patient_id: Optional[str] = Form(None, description="Optional existing patient identifier"),
    patient_name: Optional[str] = Form(None, description="Optional patient name"),
    consent_confirmed: bool = Form(..., description="Explicit DPDP consent confirmation"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Ingests and processes a clinical laboratory report (PDF/Image).
    Executes multi-modal Gemini extraction, magic-bytes inspection, SHA-256 tamper hashing,
    LOINC normalization, biological sanity validation, and issues a cryptographic session token.

    Args:
        request: FastAPI HTTP request object (for IP rate limiting).
        file: Uploaded laboratory document file.
        patient_id: Optional patient ID string.
        patient_name: Optional patient name string.
        consent_confirmed: Boolean indicating explicit DPDP consent.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Extraction results, report metadata, SHA-256 hash, and session token.

    Raises:
        HTTPException: HTTP 400 on missing consent or invalid magic bytes, HTTP 413 on oversized file.
    """
    # Rate limiting check
    client_ip = request.client.host if request.client else "127.0.0.1"
    check_rate_limit(client_ip, max_requests=30, window_seconds=60)

    # DPDP Consent Gating
    if not consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="DPDP Consent must be explicitly confirmed before uploading and processing medical records.",
        )

    file_bytes = await file.read()

    # File size check (Max 15MB)
    if len(file_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large. Maximum file size is 15MB.")

    # Magic-byte inspection
    file_type = validate_magic_bytes(file_bytes, file.filename or "")

    # Sanitized server-side UUID filename
    file_id = uuid.uuid4().hex[:8]
    ext = "pdf" if file_type == "pdf" else "jpg" if file_type in ["jpeg", "jpg"] else "png"
    safe_filename = f"{uuid.uuid4().hex}.{ext}"
    saved_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as f:
        f.write(file_bytes)

    # SHA-256 Tamper Evidence
    sha256_hash = calculate_sha256(file_bytes)

    # Multi-modal Vision Extraction + Grounding
    raw_extraction = vision_engine.process_document(
        file_bytes=file_bytes, file_name=file.filename or f"report.{ext}", active_patient_name=patient_name
    )

    resolved_patient_name = patient_name or raw_extraction.get("patient_name") or "Unknown Patient"

    # Find or create patient
    if not patient_id:
        patient = db.query(Patient).filter(Patient.name == resolved_patient_name).first()
        if not patient:
            patient = Patient(id=f"pat-{uuid.uuid4().hex[:8]}", name=resolved_patient_name, age=40, sex="Unspecified")
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
        extraction_mode=raw_extraction.get("extraction_mode", "gemini_live"),
    )
    db.add(report)

    # Add hash
    db.add(ReportHash(id=f"hsh-{uuid.uuid4().hex[:8]}", report_id=report_id, sha256_hash=sha256_hash))

    # Process results
    processed_results = []
    for item in raw_extraction.get("results", []):
        raw_name = item.get("test_name", "")
        norm = loinc_normalizer.normalize(raw_name)
        val = item.get("value")
        ref_low = item.get("ref_low")
        ref_high = item.get("ref_high")
        sanity = sanity_checker.validate_result(
            loinc_code=norm.get("loinc_code"), value=val, ref_low=ref_low, ref_high=ref_high
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
            is_abnormal=sanity.get("is_abnormal", False),
            confidence_tier=sanity.get("confidence_tier", "high"),
            legibility_flag=item.get("legibility_flag", 0.95),
            bbox_x=bbox.get("x"),
            bbox_y=bbox.get("y"),
            bbox_w=bbox.get("w"),
            bbox_h=bbox.get("h"),
            is_grounded=item.get("is_grounded", False),
            grounding_type=item.get("grounding_type", "independent_ocr_line_match"),
            source="Extracted from report",
        )
        db.add(test_result)
        processed_results.append(test_result)

    db.commit()

    # Issue cryptographic session token
    session_token = generate_session_token(patient.id)
    logger.info("Uploaded and processed report %s for patient %s", report_id, patient.id)

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
        "message": "Lab report successfully processed with grounded bboxes and LOINC normalization.",
    }
