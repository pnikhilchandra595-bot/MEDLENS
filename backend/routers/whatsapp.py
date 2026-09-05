"""
WhatsApp Communication Router for MedLens API.
Provides patient lab summary delivery over WhatsApp via official Twilio API
with deterministic non-diagnostic phrasing, multilingual support, and simulated fallbacks.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from messaging.whatsapp_service import WhatsAppService
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/whatsapp", tags=["WhatsApp Delivery"])
whatsapp_service = WhatsAppService()


class WhatsAppRequest(BaseModel):
    """Schema for requesting WhatsApp lab summary delivery."""

    phone: str = Field(..., description="E.164 formatted recipient phone number")
    patient_name: str = Field(..., description="Recipient patient full name")
    flag_count: int = Field(0, description="Total count of flagged/abnormal parameters")
    flagged_tests: List[str] = Field(default_factory=list, description="Names of flagged test parameters")
    doctor_questions: List[str] = Field(
        default_factory=list, description="Suggested questions for physician consultation"
    )
    language: Optional[str] = Field("en", description="Target language: 'en', 'hi', 'te'")


@router.post("/send", response_model=Dict[str, Any])
def send_whatsapp(req: WhatsAppRequest) -> Dict[str, Any]:
    """
    Dispatches a structured, non-diagnostic laboratory summary to the patient's WhatsApp.
    Uses official Twilio WhatsApp API when configured, or returns an honest simulated payload.

    Args:
        req: WhatsApp delivery request payload.

    Returns:
        Dict[str, Any]: Dispatch status, message SID/simulation identifier, and delivery timestamp.
    """
    logger.info("Dispatching WhatsApp summary for patient %s to %s", req.patient_name, req.phone)
    return whatsapp_service.send_message(
        phone_number=req.phone,
        patient_name=req.patient_name,
        flag_count=req.flag_count,
        flagged_tests=req.flagged_tests,
        doctor_questions=req.doctor_questions,
        language=req.language or "en",
    )
