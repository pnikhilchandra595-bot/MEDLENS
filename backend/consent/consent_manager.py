import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from database import Consent, Patient, PatientReportedData, Report, ReportHash, TestResult
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class ConsentManager:
    """
    DPDP (Digital Personal Data Protection) Act compliant consent and data lifecycle manager.
    Enforces explicit patient consent gating and right to erasure (delete-my-data).
    """

    @staticmethod
    def record_consent(
        db: Session,
        patient_id: str,
        purpose: str = "Clinical report extraction and temporal intelligence",
        ip_address: Optional[str] = None,
    ) -> Consent:
        consent_id = f"cst-{uuid.uuid4().hex[:8]}"
        consent = Consent(
            id=consent_id,
            patient_id=patient_id,
            consented_at=datetime.now(timezone.utc),
            purpose=purpose,
            consent_ip=ip_address,
        )
        db.add(consent)
        db.commit()
        db.refresh(consent)
        return consent

    @staticmethod
    def get_consent_status(db: Session, patient_id: str) -> Dict[str, Any]:
        consents = (
            db.query(Consent).filter(Consent.patient_id == patient_id).order_by(Consent.consented_at.desc()).all()
        )
        if not consents:
            return {"has_consented": False, "status": "no_consent_record", "consents": []}

        latest = consents[0]
        is_active = latest.revoked_at is None
        return {
            "has_consented": is_active,
            "status": "active" if is_active else "revoked",
            "latest_consent_date": latest.consented_at.isoformat() if latest.consented_at else None,
            "purpose": latest.purpose,
            "total_records": len(consents),
        }

    @staticmethod
    def delete_patient_data(db: Session, patient_id: str) -> Dict[str, Any]:
        """
        DPDP Act Right to Erasure:
        Irreversibly deletes all records across all tables and purges uploaded files.
        """
        # Find reports to clean files
        reports = db.query(Report).filter(Report.patient_id == patient_id).all()
        files_deleted = 0
        for r in reports:
            if r.file_path and os.path.exists(r.file_path):
                try:
                    os.remove(r.file_path)
                    files_deleted += 1
                except Exception as e:
                    logger.warning("[ConsentManager] Error removing file %s: %s", r.file_path, e)

        # Cascade delete across all tables
        db.query(ReportHash).filter(ReportHash.report_id.in_([r.id for r in reports])).delete(synchronize_session=False)
        db.query(TestResult).filter(TestResult.patient_id == patient_id).delete(synchronize_session=False)
        db.query(Report).filter(Report.patient_id == patient_id).delete(synchronize_session=False)
        db.query(PatientReportedData).filter(PatientReportedData.patient_id == patient_id).delete(
            synchronize_session=False
        )
        db.query(Consent).filter(Consent.patient_id == patient_id).delete(synchronize_session=False)
        db.query(Patient).filter(Patient.id == patient_id).delete(synchronize_session=False)

        db.commit()

        return {
            "status": "success",
            "message": "All patient personal data, test records, biometric trends, and consent logs permanently erased in compliance with DPDP regulations.",
            "patient_id": patient_id,
            "purged_files_count": files_deleted,
        }
