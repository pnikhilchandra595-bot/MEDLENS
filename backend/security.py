"""
Security & Cryptographic Session Module for MedLens.
Provides HMAC-SHA256 session token generation and verification,
in-memory IP rate limiting, and magic-bytes file validation.
"""

import hashlib
import hmac
import os
import secrets
import time
from collections import defaultdict
from typing import Dict, List, Optional

from fastapi import HTTPException, status

# Cryptographically secure 256-bit secret (ephemeral if not configured)
raw_auth_secret = os.environ.get("MEDLENS_AUTH_SECRET")
if not raw_auth_secret:
    raw_auth_secret = secrets.token_hex(32)
MEDLENS_AUTH_SECRET: bytes = raw_auth_secret.encode()

# In-Memory Rate Limiter Tracking (client_ip -> list of epoch timestamps)
client_request_history: Dict[str, List[float]] = defaultdict(list)


def generate_session_token(patient_id: str) -> str:
    """
    Generates an HMAC-SHA256 cryptographic session token tied to a patient ID.

    Args:
        patient_id: The unique identifier of the patient.

    Returns:
        str: Token formatted as '<patient_id>.<timestamp>.<hmac_signature>'.
    """
    ts = int(time.time())
    msg = f"{patient_id}:{ts}".encode()
    sig = hmac.new(MEDLENS_AUTH_SECRET, msg, hashlib.sha256).hexdigest()
    return f"{patient_id}.{ts}.{sig}"


def verify_session_token(token: Optional[str], expected_patient_id: str) -> bool:
    """
    Verifies the cryptographic validity and patient ownership of an HMAC session token.

    Args:
        token: Bearer authorization string or raw token.
        expected_patient_id: Patient ID that the token must match.

    Returns:
        bool: True if the token signature is valid and owns expected_patient_id, False otherwise.
    """
    if not token:
        return False
    # Strip 'Bearer ' prefix if present
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


def check_rate_limit(client_ip: str, max_requests: int = 60, window_seconds: int = 60) -> None:
    """
    Enforces sliding-window IP rate limiting.

    Args:
        client_ip: Client IP address string.
        max_requests: Maximum allowed requests within the time window.
        window_seconds: Window length in seconds.

    Raises:
        HTTPException: HTTP 429 if the request threshold is exceeded.
    """
    now = time.time()
    history = client_request_history[client_ip]
    # Prune timestamps older than window
    client_request_history[client_ip] = [t for t in history if now - t < window_seconds]
    if len(client_request_history[client_ip]) >= max_requests:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Maximum {max_requests} requests per minute allowed.",
        )
    client_request_history[client_ip].append(now)


def validate_magic_bytes(file_bytes: bytes, filename: str) -> str:
    """
    Validates file format using byte signature headers (magic bytes)
    to prevent disguised executable or malicious uploads.

    Args:
        file_bytes: Raw binary content of the uploaded file.
        filename: Original file name string.

    Returns:
        str: Detected file format ('pdf' | 'jpeg' | 'png' | 'webp').

    Raises:
        HTTPException: HTTP 400 if the format is invalid or file is corrupted.
    """
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
    # WEBP magic bytes: RIFF....WEBP
    elif file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[:16]:
        return "webp"

    raise HTTPException(
        status_code=400,
        detail="Invalid file format. MedLens only accepts verified PDF, PNG, and JPEG clinical laboratory documents.",
    )
