"""
MedLens API Main Application Entry Point.
Clinical Laboratory Report Intelligence, Provenance, Temporal Tracking & Patient Communication Platform.
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict

# Load .env file into os.environ if present
env_paths = [
    os.path.join(os.path.dirname(__file__), ".env"),
    os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
]
for ep in env_paths:
    if os.path.exists(ep):
        with open(ep, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    if k.strip() not in os.environ:
                        os.environ[k.strip()] = v.strip()

from database import (
    AiSummaryCache,
    Consent,
    Patient,
    PatientReportedData,
    Report,
    ReportHash,
    ResultAuditTrail,
    TestResult,
    get_db,
    init_db,
)
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import consent as consent_router
from routers import fhir as fhir_router
from routers import patients as patients_router
from routers import reports as reports_router
from routers import whatsapp as whatsapp_router
from samples.sample_data import seed_sample_database
from security import check_rate_limit, generate_session_token, validate_magic_bytes, verify_session_token
from sqlalchemy.orm import Session

# Configure Root Logger
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("medlens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and demo data seeding."""
    logger.info("Initializing MedLens database schema...")
    init_db()
    db = next(get_db())
    try:
        seed_sample_database(db)
    finally:
        db.close()
    logger.info("MedLens backend initialization complete.")
    yield


app = FastAPI(
    title="MedLens API",
    description="Clinical Laboratory Report Intelligence, Provenance, Temporal Tracking & Patient Communication Platform",
    version="1.3.0",
    lifespan=lifespan,
)

# CORS: Explicit allowlist
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directories
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "storage", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount Modular Routers
app.include_router(patients_router.router)
app.include_router(reports_router.router)
app.include_router(consent_router.router)
app.include_router(fhir_router.router)
app.include_router(whatsapp_router.router)


@app.get("/api/health", response_model=Dict[str, Any], tags=["System"])
def health_check() -> Dict[str, Any]:
    """
    Returns platform health, feature flags, and standard compliance verification status.

    Returns:
        Dict[str, Any]: Health status, timestamp, active integrations, and security features.
    """
    return {
        "status": "healthy",
        "service": "MedLens Clinical Intelligence Platform",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_vision_enabled": bool(os.environ.get("GEMINI_API_KEY")),
        "twilio_whatsapp_enabled": bool(os.environ.get("TWILIO_ACCOUNT_SID")),
        "database": "Neon PostgreSQL" if os.environ.get("DATABASE_URL") else "SQLite",
        "security_features": ["HMAC Session Tokens", "CORS Allowlist", "Magic-Byte Verification", "Rate-Limiting"],
        "standards": ["HL7 FHIR R4", "ABDM M3 India", "LOINC (NLM API)", "RxNorm", "DPDP Act 2023"],
    }


@app.post("/api/seed", response_model=Dict[str, Any], tags=["System"])
def reseed_database(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Reseeds the database with clean demo patients, longitudinal reports, and reference intervals.

    Args:
        db: Active SQLAlchemy database session.

    Returns:
        Dict[str, Any]: Reseed confirmation message.
    """
    logger.info("Reseeding database with clean demo datasets...")
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
