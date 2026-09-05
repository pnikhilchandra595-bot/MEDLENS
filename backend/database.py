import os
from datetime import datetime, timezone

# Load .env file if present
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
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, create_engine
from sqlalchemy import text as db_text
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    DB_PATH = os.environ.get("MEDLENS_DB_PATH", os.path.join(os.path.dirname(__file__), "medlens.db"))
    DATABASE_URL = f"sqlite:///{DB_PATH}"

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=10, max_overflow=20)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_utc_now():
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    created_at = Column(DateTime, default=get_utc_now)

    reports = relationship("Report", back_populates="patient", cascade="all, delete-orphan")
    intakes = relationship("PatientReportedData", back_populates="patient", cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="patient", cascade="all, delete-orphan")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    lab_name = Column(String, nullable=True)
    report_date = Column(String, nullable=True)
    doctor_name = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    file_url = Column(String, nullable=True)
    extraction_mode = Column(String, default="gemini_live")  # "gemini_live" | "demo_fallback"
    created_at = Column(DateTime, default=get_utc_now)

    patient = relationship("Patient", back_populates="reports")
    test_results = relationship("TestResult", back_populates="report", cascade="all, delete-orphan")
    hashes = relationship("ReportHash", back_populates="report", cascade="all, delete-orphan")


class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False, index=True)
    patient_id = Column(String, nullable=False, index=True)
    test_name = Column(String, nullable=False)
    loinc_code = Column(String, nullable=True, index=True)
    canonical_name = Column(String, nullable=True)
    value = Column(Float, nullable=True)
    raw_value = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    ref_low = Column(Float, nullable=True)
    ref_high = Column(Float, nullable=True)
    ref_raw = Column(String, nullable=True)
    is_abnormal = Column(Boolean, default=False)
    confidence_tier = Column(String, default="high")  # "high", "medium", "low"
    legibility_flag = Column(Float, default=0.95)  # model's own self-reported readability
    # Grounded bounding box in percentage coordinates (0.0 to 1.0)
    bbox_x = Column(Float, nullable=True)
    bbox_y = Column(Float, nullable=True)
    bbox_w = Column(Float, nullable=True)
    bbox_h = Column(Float, nullable=True)
    is_grounded = Column(Boolean, default=False)
    grounding_type = Column(
        String, default="independent_ocr_line_match"
    )  # "independent_ocr_line_match" | "model_self_consistency"
    category = Column(String, default="General Laboratory Panel")
    # Provenance tag: "Patient-reported" | "Extracted from report" | "AI-generated"
    source = Column(String, default="Extracted from report")
    created_at = Column(DateTime, default=get_utc_now)

    report = relationship("Report", back_populates="test_results")


class PatientReportedData(Base):
    __tablename__ = "patient_reported_data"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    age = Column(Integer, nullable=True)
    sex = Column(String, nullable=True)
    symptoms = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    source = Column(String, default="Patient-reported")
    reported_at = Column(DateTime, default=get_utc_now)

    patient = relationship("Patient", back_populates="intakes")


class Consent(Base):
    __tablename__ = "consents"

    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False, index=True)
    consented_at = Column(DateTime, default=get_utc_now)
    revoked_at = Column(DateTime, nullable=True)
    purpose = Column(String, default="Clinical report extraction and temporal intelligence")
    consent_ip = Column(String, nullable=True)

    patient = relationship("Patient", back_populates="consents")


class ReportHash(Base):
    __tablename__ = "report_hashes"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False, index=True)
    sha256_hash = Column(String, nullable=False)
    computed_at = Column(DateTime, default=get_utc_now)

    report = relationship("Report", back_populates="hashes")


class AiSummaryCache(Base):
    __tablename__ = "ai_summary_cache"

    id = Column(String, primary_key=True, index=True)
    report_id = Column(String, index=True, nullable=False)
    results_hash = Column(String, index=True, nullable=False)
    language = Column(String, default="en", index=True)
    payload_json = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now)


class LoincCache(Base):
    __tablename__ = "loinc_cache"

    query_term = Column(String, primary_key=True, index=True)
    loinc_code = Column(String, index=True)
    canonical_name = Column(String)
    standard_unit = Column(String, nullable=True)
    is_recognized = Column(Boolean, default=True)
    cached_at = Column(DateTime, default=get_utc_now)


class RxNormCache(Base):
    __tablename__ = "rxnorm_cache"

    brand_name = Column(String, primary_key=True, index=True)
    active_ingredient = Column(String)
    rxcui = Column(String)
    is_recognized = Column(Boolean, default=True)
    cached_at = Column(DateTime, default=get_utc_now)


class ResultAuditTrail(Base):
    __tablename__ = "result_audit_trails"

    id = Column(String, primary_key=True, index=True)
    result_id = Column(String, ForeignKey("test_results.id"), nullable=False, index=True)
    previous_value = Column(Float, nullable=True)
    corrected_value = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    corrected_by = Column(String, default="Patient/Clinician")
    created_at = Column(DateTime, default=get_utc_now)


def init_db():
    Base.metadata.create_all(bind=engine)
    # Automatic column additions for existing SQLite databases
    with engine.connect() as conn:
        try:
            conn.execute(db_text("ALTER TABLE reports ADD COLUMN extraction_mode VARCHAR DEFAULT 'gemini_live'"))
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(
                db_text(
                    "ALTER TABLE test_results ADD COLUMN grounding_type VARCHAR DEFAULT 'independent_ocr_line_match'"
                )
            )
            conn.commit()
        except Exception:
            pass
        try:
            conn.execute(
                db_text(
                    "ALTER TABLE test_results ADD COLUMN category VARCHAR DEFAULT 'General Laboratory Panel'"
                )
            )
            conn.commit()
        except Exception:
            pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
