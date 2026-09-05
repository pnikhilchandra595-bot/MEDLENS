# MedLens Security Policy & Threat Model

## 1. Overview
MedLens is engineered with defense-in-depth healthcare data protection principles, adhering to the **India Digital Personal Data Protection (DPDP) Act 2023** and **HL7 FHIR R4 security guidelines**.

---

## 2. In-Scope Security Controls

### A. Authentication & Session Ownership
* **Cryptographic Session Tokens**: All intake and upload transactions issue HMAC-SHA256 authenticated tokens ({patient_id}.{timestamp}.{signature}) tied to the specific patient_id.
* **Resource Ownership Guardrails**: Data modification and erasure endpoints (DELETE /api/delete-my-data/{patient_id}, POST /api/reports/{report_id}/correct-result) require the caller's Bearer token to match the resource owner; unauthorized requests return 403 Forbidden.

### B. File Upload Hardening
* **Magic-Byte Inspection**: Uploaded files undergo magic-byte signature validation (%PDF-, \xff\xd8\xff, \x89PNG) to block disguised binaries and shell scripts.
* **Server-Side Filename Sanitization**: Files are saved with cryptographically random UUID filenames ({uuid4}.pdf), never exposing or executing client-supplied filenames.
* **Size Quotas**: Strict 15MB file size cap enforced on all multipart upload handlers.

### C. Network & API Protection
* **CORS Allowlist**: Explicit origin allowlist restricting access to trusted frontend hosts (http://localhost:5173, http://127.0.0.1:5173, http://localhost:3000), rejecting invalid wildcard configurations with credentials.
* **Sliding-Window Rate Limiting**: In-memory rate limiting restricting upload and AI interpretation endpoints to 30 requests/minute per client IP to protect against quota exhaustion and denial-of-service.

### D. Cryptographic Provenance & Tamper-Evidence
* **SHA-256 Document Hashing**: Every ingested document is hashed on intake; the hash is displayed on the UI and embedded into generated FHIR R4 DiagnosticReports.
* **Immutable Audit Trail**: All human-in-the-loop (HITL) value corrections are recorded in esult_audit_trails with timestamp, previous value, corrected value, and rationale.

### E. DPDP Act 2023 Compliance
* **Explicit Consent Gating**: Processing is blocked unless affirmative consent is confirmed.
* **Cascading Permanent Erasure (/api/delete-my-data/{patient_id})**: Irreversibly purges all database records (consents, reports, test findings, audit trails) and unlinks disk storage.

---

## 3. Threat Model & Deferred Scope (Demo Notice)
* **Synthetic Demo Data**: The pre-seeded patient scenarios (Arjun Sharma, Anita Desai, Rajesh Verma) use synthetic medical test records for demonstration purposes.
* **Data at Rest**: Production deployments should configure SQLite/PostgreSQL volume encryption (LUKS / AWS EBS KMS / GCP CMEK) and HTTPS / TLS 1.3 termination via reverse proxy (Nginx / Cloudflare).

---

## 4. Reporting Vulnerabilities
If you discover any security issue or vulnerability within this repository, please disclose responsibly by contacting: security@medlens.health or opening a private security advisory on GitHub.
