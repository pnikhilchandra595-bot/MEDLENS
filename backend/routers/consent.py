"""
Consent & Data Privacy Router for MedLens API.
Enforces Indian DPDP Act 2023 compliance, consent recording,
consent status queries, and cryptographic token-guarded Right to Erasure.
"""

import logging
from typing import Any, Dict, Optional

from consent.consent_manager import ConsentManager
from database import get_db
from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field
from security import verify_session_token
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Consent & Privacy"])


class ConsentRequest(BaseModel):
    """Schema for registering DPDP patient consent."""

    patient_id: str = Field(..., description="Unique patient identifier")
    purpose: Optional[str] = Field(
        "Clinical report analysis and temporal intelligence",
        description="Explicit specified purpose of clinical data processing",
    )


@router.post("/api/consent", response_model=Dict[str, Any])
def record_consent(req: ConsentRequest, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Records an active clinical data processing consent entry under DPDP Act 2023.

    Args:
        req: Consent request containing patient ID and explicit purpose.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Confirmation status, generated consent record ID, and timestamp.
    """
    c = ConsentManager.record_consent(db, patient_id=req.patient_id, purpose=req.purpose or "")
    logger.info("Recorded consent %s for patient %s", c.id, req.patient_id)
    return {"status": "success", "consent_id": c.id, "consented_at": c.consented_at.isoformat()}


@router.get("/api/consent/{patient_id}", response_model=Dict[str, Any])
def check_consent(patient_id: str, db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Retrieves the current DPDP consent status and audit history for a patient.

    Args:
        patient_id: Unique patient identifier.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Active consent status, revocation timestamp (if revoked), and purpose.
    """
    return ConsentManager.get_consent_status(db, patient_id)


@router.delete("/api/delete-my-data/{patient_id}", response_model=Dict[str, Any])
def delete_patient_data(
    patient_id: str,
    authorization: Optional[str] = Header(None, description="Bearer HMAC session token"),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Executes Right to Erasure under the Digital Personal Data Protection (DPDP) Act 2023.
    Permanently erases all patient demographics, clinical reports, test results,
    uploaded files, hashes, and audit entries.

    Security: Requires caller's cryptographic Bearer session token to match the target patient.

    Args:
        patient_id: Unique patient identifier.
        authorization: HTTP Authorization header containing Bearer HMAC session token.
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Deletion confirmation and erased record metrics.

    Raises:
        HTTPException: HTTP 401 if token is missing, HTTP 403 if token is invalid or unauthorized.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is required for this operation. Please provide Authorization: Bearer <token> header.",
        )

    if not verify_session_token(authorization, patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Caller does not have authorization to delete this patient record.",
        )

    logger.warning("Executing complete DPDP erasure for patient %s", patient_id)
    return ConsentManager.delete_patient_data(db, patient_id)
