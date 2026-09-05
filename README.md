# 🩺 MedLens — Clinical Laboratory Intelligence & Temporal Patient Memory

[![MedLens CI Pipeline](https://github.com/pnikhilchandra595-bot/MEDLENS/actions/workflows/ci.yml/badge.svg)](https://github.com/pnikhilchandra595-bot/MEDLENS/actions/workflows/ci.yml)
[![HL7 FHIR R4](https://img.shields.io/badge/HL7-FHIR%20R4%20Valid-emerald.svg)](https://validator.fhir.org/)
[![ABDM India NRCeS](https://img.shields.io/badge/ABDM-NRCeS%20Ready-blue.svg)](https://abdm.gov.in/)
[![DPDP Act 2023](https://img.shields.io/badge/DPDP%20Act%202023-Compliant-teal.svg)](https://meity.gov.in/)
[![Vitest Frontend Tests](https://img.shields.io/badge/Vitest-Passing-success.svg)](https://vitest.dev/)
[![Backend Tests](https://img.shields.io/badge/PyTest%20Unit%20%2B%20Integration-100%25%20Passing-success.svg)]()

> *"Every other tool built a simple OCR reader. We built a clinical patient memory that shows its sources, refuses to guess what it doesn't know, enforces strict non-diagnostic safety invariants, and hands clinicians and patients something structured, grounded, and reviewable."*

---

## 📑 Table of Contents
1. [Core Safety Guarantees & Intentional Design](#-core-safety-guarantees--intentional-design)
2. [Clinical Grounding & Real SVG Provenance](#-clinical-grounding--real-svg-provenance)
3. [Security Architecture & DPDP Act 2023](#-security-architecture--dpdp-act-2023)
4. [High-Performance Caching & Efficiency](#-high-performance-caching--efficiency)
5. [Human-in-the-Loop (HITL) Workflow](#-human-in-the-loop-hitl-workflow)
6. [Standards: HL7 FHIR R4 & ABDM India NRCeS](#-standards-hl7-fhir-r4--abdm-india-nrces)
7. [Comprehensive Test Suite & CI/CD](#-comprehensive-test-suite--cicd)
8. [Accessibility (WCAG AA AA-Compliant)](#-accessibility-wcag-aa-compliant)
9. [Architecture & System Layout](#-architecture--system-layout)
10. [Quickstart Guide](#-quickstart-guide)

---

## 🛡️ Core Safety Guarantees & Intentional Design

### 1. The Non-Diagnostic Philosophy
MedLens was engineered with strict clinical safety bounds:
- **No Hallucinated Diagnoses**: MedLens **never** diagnoses diseases or conditions (e.g., will never output `"Patient has hypothyroidism"` or `"Diagnosis: Type 2 Diabetes"`). Instead, it outputs purely observational summaries describing numerical biomarker shifts relative to established reference intervals.
- **No Arbitrary AI Triage Scores**: Many AI demos fabricate arbitrary 0–10 risk ratings or alarmist red urgency levels. MedLens strictly uses **Deterministic Source-Flag Counts** (e.g., *"3 values flagged outside standard laboratory reference range"*), reflecting only what the certified physical laboratory report flagged.
- **Gated Adversarial Counter-Arguments**: Every AI summary includes mandatory inline alternative physiological explanations (such as dehydration, diurnal rhythm, fasting duration, recent physical stress, or assay calibration differences) to prevent premature patient anxiety before consulting a physician.
- **Output-Side Safety Interceptor (`validate_and_sanitize_output`)**: All generated LLM text passes through a multi-pass regex and condition blocklist. If any prohibited disease label or diagnostic phrasing is detected, the LLM response is instantly discarded and replaced with a deterministic, verified template.

### 2. Reference-Range Honesty & Baseline Citations
- **Textbook Physiological Baselines**: MedLens's biological sanity checker (`backend/data/bio_ranges.json`) cites verified reference manuals:
  - *Tietz Clinical Guide to Laboratory Tests (4th Edition)*
  - *Harrison's Principles of Internal Medicine (21st Edition)*
- **Refusal to Guess**: If a lab report omits a reference interval, MedLens transparently marks the range as `"Unspecified"` and labels the result confidence as `"Missing Reference Range"` rather than inventing numbers.
- **Routing of Unknown Biomarkers**: Unrecognized tests are never silently dropped; they are preserved with their raw extracted names and routed for human verification.

---

## 🔍 Clinical Grounding & Real SVG Provenance

```
Uploaded Document (PDF / Scan)
       │
       ├──► SHA-256 Cryptographic Hash Computed (Tamper-Evident Seal)
       ├──► Pass 1: Independent Document Layout & Text Layer Line Extraction
       ├──► Pass 2: Gemini Vision 1.5 Multimodal Extraction + Self-Reported OCR
       │
       ▼
Grounded Coordinate Matching (Normalized numeric matching + Token Set Ratio)
       │
       ▼
Interactive SVG Bounding Box Overlays rendered in ReportViewer.jsx (<rect>, <svg>)
```

- **Independent Grounding (Patch A)**: Extracted test values and investigation names are reconciled against the document's independent text lines using fuzzy token matching and normalized numeric representations (e.g., `"6.80"` correctly matches `"6.8"`).
- **Interactive SVG Overlays (`ReportViewer.jsx`)**: Renders high-fidelity `<svg viewBox="0 0 1000 1000">` vector overlays directly over the real report image. Selecting a lab test row dynamically highlights its physical document coordinates, and clicking an SVG bounding box focuses the corresponding clinical finding in the table.
- **4-Tier Provenance Tracking**:
  - 🔵 `Patient-reported` (Self-declared medications/conditions via intake)
  - 🟢 `Extracted from report` (OCR / Vision extracted directly from file)
  - 🟣 `AI-generated` (Descriptive pattern analysis & counter-prompts)
  - 🟠 `Human-corrected` (Clinician-verified overrides with audit log)

---

## 🔒 Security Architecture & DPDP Act 2023

Detailed documentation is available in [SECURITY.md](file:///c:/Users/Nikhil%20Chandra/AIMERS/SECURITY.md).

| Security Layer | Implementation Details |
|---|---|
| **Session Authentication** | Stateless HMAC-SHA256 session tokens issued at upload and verified across subsequent reads and modifications (`Bearer <token>`). |
| **Protected Deletion & RBAC** | `DELETE /api/delete-my-data/{patient_id}` validates that the caller's session token matches the target patient ID, returning `403 Forbidden` on mismatch. |
| **CORS Policy** | Explicit origin allowlist (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`) instead of insecure wildcard origins. |
| **Upload Sanitization** | Magic-byte inspection (verifying `%PDF`, `\x89PNG`, `\xff\xd8\xff`, `RIFF...WEBP`) blocking disguised executables, 15MB file cap, and storage with server-generated UUIDs outside the web root. |
| **Rate Limiting** | Sliding-window IP rate limiter restricting uploads and AI inference endpoints to 30 requests/minute. |
| **DPDP Compliance** | Explicit pre-processing consent gating and one-click cascading right to erasure (`/api/delete-my-data/{patient_id}`). |

---

## ⚡ High-Performance Caching & Efficiency

- **Persistent AI Summary Cache (`AiSummaryCache`)**: Generated AI summaries are cached in SQLite keyed by report ID and content hash. Repeated reads (`GET /api/reports/{id}`) serve cached responses instantly with zero LLM API latency.
- **Persistent LOINC & RxNorm Lookup Cache (`LoincCache`, `RxNormCache`)**: Caches external NLM API responses locally in SQLite, surviving server restarts and eliminating redundant network round-trips.
- **Image Optimization & Profiling**: Oversized uploaded images are downsampled to a maximum 2048px dimension with Lanczos filtering before transmission to multimodal vision APIs, drastically reducing token usage and network payload latency.
- **Paginated Endpoints**: All list endpoints (`/api/patients`, `/api/patients/{id}/reports`, `/api/reports/search`) support `limit` and `offset` pagination to prevent unbounded memory growth.

---

## ✍️ Human-in-the-Loop (HITL) Workflow

Clinicians and patients can review, edit, and correct any extracted value via the interactive editor:
1. Click the edit icon (`Edit3`) on any test investigation row.
2. Enter the corrected numeric or textual value along with an audit reason (e.g. *"Verified against physical paper report"*).
3. `POST /api/reports/{report_id}/correct-result` records an immutable entry in `ResultAuditTrail`, updates the result source to `"Human-corrected"`, and invalidates the cached AI summary so subsequent summaries reflect verified data.

---

## 🏥 Standards: HL7 FHIR R4 & ABDM India NRCeS

MedLens exports valid, standards-compliant electronic health records:
- **HL7 FHIR R4 Collection Bundle**: Produces validated `Patient`, `Observation`, and `DiagnosticReport` resources conforming to international profiles testable on `validator.fhir.org`.
- **ABDM India NRCeS Profile**: Generates Ayushman Bharat Digital Mission compliant bundles using the `https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab` and `https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient` profiles with SNOMED CT and LOINC codings.

---

## 🧪 Comprehensive Test Suite & CI/CD

The platform includes exhaustive testing across backend unit logic, adversarial safety boundaries, end-to-end integration flows, and frontend React components:

```bash
# 1. Run Backend Core Unit Tests (14/14 Passing)
python backend/test_medlens.py

# 2. Run End-to-End Integration & Security Tests (8/8 Passing)
python backend/test_integration_pipeline.py

# 3. Run Frontend Vitest Component Suite (10/10 Passing)
npm --prefix frontend test
```

### GitHub Actions CI Pipeline (`.github/workflows/ci.yml`)
Automated on every push and pull request:
- Python 3.11: Unit test suite, integration test pipeline, security authentication tests, parametrized blocklist checks.
- Node.js 20: Vitest unit testing, `@testing-library/react` component testing, and Vite production bundle compilation.

---

## ♿ Accessibility (WCAG AA Compliant)

- **Interactive SVG Keyboard Navigation**: Bounding box vector overlays support `tabIndex={0}`, keyboard triggering via `Enter` / `Space`, and high-contrast `:focus-visible` styling rings.
- **Dynamic Alt Attributes**: All rendered clinical scans include contextual dynamic alt text (e.g., `alt="Clinical laboratory diagnostic report scan for Arjun Sharma"`).
- **Semantic ARIA Landmarks**: Full `<main id="main-content">`, `<header>`, `<nav>`, `role="region"`, `role="alert"`, and explicit `<label htmlFor>` bindings.
- **Skip to Content**: Built-in keyboard skip link for instant navigation bypass.

---

## 📁 Architecture & System Layout

```
├── backend/
│   ├── adversarial/         # Non-diagnostic Summaries & Output Safety Sanitizer
│   ├── consent/             # DPDP Act Consent Lifecycle & Erasure Manager
│   ├── data/                # bio_ranges.json, correlation_map.json, glossary.json, loinc_map.json
│   ├── extractors/          # SHA-256 Hasher, Vision Extractor & Independent Text Grounding
│   ├── fhir/                # HL7 FHIR R4 & ABDM India Bundle Builder
│   ├── intake/              # Patient Intake & Provenance Tagging
│   ├── messaging/           # WhatsApp Delivery & Simulation Engine
│   ├── normalizers/         # LOINC Normalizer, RxNorm Service & Sanity Checker
│   ├── samples/             # Sample Patient & Report Seeder
│   ├── trends/              # Longitudinal Temporal Intelligence & Correlation Engine
│   ├── database.py          # SQLAlchemy Models & Caching Tables
│   ├── main.py              # FastAPI Application & Security Endpoints
│   ├── test_medlens.py      # Core Unit Test Suite
│   └── test_integration_pipeline.py # End-to-End Integration Suite
├── frontend/
│   ├── src/
│   │   ├── __tests__/       # Vitest Component & API Client Tests
│   │   ├── api/             # Centralized Client Interceptor & Token Manager
│   │   ├── components/      # ReportViewer (SVG Overlays), Navbar, ProvenanceBadge, Modals
│   │   ├── pages/           # UploadPage, ResultsPage (HITL), TimelinePage, SettingsPage
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .github/workflows/ci.yml # Automated CI Pipeline
├── pyproject.toml           # Backend Tooling Config
├── SECURITY.md              # Threat Model & Security Scope
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 1. Clone & Install
```bash
git clone https://github.com/pnikhilchandra595-bot/MEDLENS.git
cd MEDLENS

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
npm --prefix frontend install
```

### 2. Configure Environment (Optional)
```bash
cp .env.example .env
# Add GEMINI_API_KEY if testing live vision inference
```

### 3. Run Dev Servers
```bash
# Start backend (Port 8000)
python backend/main.py

# Start frontend (Port 5173) in a separate terminal
npm --prefix frontend run dev
```

Visit **`http://localhost:5173`** in your browser. API interactive documentation is available at **`http://localhost:8000/docs`**.
