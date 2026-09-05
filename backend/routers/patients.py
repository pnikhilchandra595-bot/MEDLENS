"""
Patients Router for MedLens API.
Provides patient listing, individual patient metadata retrieval,
patient-reported intake logging, and longitudinal timeline retrieval.
"""

import logging
import uuid
from typing import Any, Dict, List, Optional

from consent.consent_manager import ConsentManager
from database import Patient, PatientReportedData, Report, ReportHash, get_db
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from security import generate_session_token
from sqlalchemy.orm import Session
from trends.temporal_engine import TemporalIntelligenceEngine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/patients", tags=["Patients"])
temporal_engine = TemporalIntelligenceEngine()


class IntakeRequest(BaseModel):
    """Schema for recording patient-reported intake data."""

    patient_id: str = Field(..., description="Unique patient identifier")
    age: Optional[int] = Field(None, description="Patient age in years")
    sex: Optional[str] = Field(None, description="Patient biological sex")
    symptoms: Optional[str] = Field(None, description="Reported clinical symptoms")
    conditions: Optional[str] = Field(None, description="Known pre-existing medical conditions")
    allergies: Optional[str] = Field(None, description="Known drug and food allergies")
    medications: Optional[str] = Field(None, description="Active prescribed or OTC medications")


@router.get("", response_model=List[Dict[str, Any]])
def list_patients(
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Retrieves a paginated list of all registered patients in the MedLens repository.

    Args:
        limit: Number of records to return.
        offset: Record offset for pagination.
        db: Active SQLAlchemy database session.

    Returns:
        List[Dict[str, Any]]: Summary objects containing patient IDs, demographics, and report counts.
    """
    patients = db.query(Patient).offset(offset).limit(limit).all()
    res = []
    for p in patients:
        res.append(
            {
                "id": p.id,
                "name": p.name,
                "age": p.age,
                "sex": p.sex,
                "phone": p.phone,
                "reports_count": len(p.reports),
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
        )
    return res


@router.get("/{patient_id}", response_model=Dict[str, Any])
def get_patient(patient_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Retrieves detailed clinical profile and active consent status for a specific patient.

    Args:
        patient_id: Unique patient identifier.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Patient demographic data, latest reported intake, and DPDP consent status.

    Raises:
        HTTPException: HTTP 404 if the patient record is not found.
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    latest_intake = (
        db.query(PatientReportedData)
        .filter(PatientReportedData.patient_id == patient_id)
        .order_by(PatientReportedData.reported_at.desc())
        .first()
    )

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
            "reported_at": latest_intake.reported_at.isoformat() if latest_intake.reported_at else None,
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
        "consent": consent_status,
    }


@router.post("/{patient_id}/intake", response_model=Dict[str, Any])
def save_patient_intake(patient_id: str, req: IntakeRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Records patient-reported intake data with explicit 'Patient-reported' provenance tagging.
    Issues a cryptographic HMAC session token for subsequent authenticated operations.

    Args:
        patient_id: Unique patient identifier.
        req: Intake payload with symptoms, conditions, and medications.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Status confirmation, intake ID, provenance tag, and session token.
    """
    intake = PatientReportedData(
        id=f"intk-{uuid.uuid4().hex[:8]}",
        patient_id=patient_id,
        age=req.age,
        sex=req.sex,
        symptoms=req.symptoms,
        conditions=req.conditions,
        allergies=req.allergies,
        medications=req.medications,
        source="Patient-reported",
    )
    db.add(intake)
    db.commit()
    db.refresh(intake)

    session_token = generate_session_token(patient_id)
    logger.info("Saved intake %s for patient %s", intake.id, patient_id)

    return {
        "status": "success",
        "intake_id": intake.id,
        "source": intake.source,
        "session_token": session_token,
        "message": "Patient-reported intake recorded with provenance tag.",
    }


@router.get("/{patient_id}/reports", response_model=List[Dict[str, Any]])
def get_patient_reports(
    patient_id: str,
    limit: int = Query(50, ge=1, le=200, description="Max reports to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
) -> List[Dict[str, Any]]:
    """
    Retrieves chronological summary list of all laboratory reports for a patient.

    Args:
        patient_id: Unique patient identifier.
        limit: Max records to return.
        offset: Pagination offset.
        db: Active SQLAlchemy database session.

    Returns:
        List[Dict[str, Any]]: List of report summaries with SHA-256 hashes and test counts.
    """
    reports = (
        db.query(Report)
        .filter(Report.patient_id == patient_id)
        .order_by(Report.report_date.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    res = []
    for r in reports:
        hash_entry = db.query(ReportHash).filter(ReportHash.report_id == r.id).first()
        res.append(
            {
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
                "flagged_count": sum(1 for t in r.test_results if t.is_abnormal),
            }
        )
    return res


@router.get("/{patient_id}/timeline", response_model=Dict[str, Any])
def get_patient_timeline(patient_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Computes longitudinal trajectory trends, biological cross-correlations,
    and velocity shifts across all historical laboratory reports for a patient.

    Args:
        patient_id: Unique patient identifier.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Temporal intelligence structure with chronologies, trend flags, and velocity metrics.
    """
    reports = db.query(Report).filter(Report.patient_id == patient_id).order_by(Report.report_date.asc()).all()

    payload = []
    for r in reports:
        payload.append(
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
    return temporal_engine.analyze_patient_timeline(payload)
