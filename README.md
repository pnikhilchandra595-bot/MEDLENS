# 🩺 MedLens — Clinical Laboratory Intelligence & Temporal Patient Memory

> *"Every other team built a report reader. We built a patient memory that shows its sources, refuses to guess what it doesn't know, and hands your doctor something real — structured, understandable, and reviewable."*

---

## 🌟 Overview & Key Innovations

**MedLens** transforms static, isolated laboratory reports into a unified, privacy-compliant, longitudinal clinical intelligence memory. It addresses the critical gaps of traditional OCR readers by guaranteeing provenance integrity, clinical safety, biological sanity checking, and multi-language patient accessibility.

### 🛡️ Core Safety Guarantees
1. **Grounded Bounding Boxes (Patch A)**: Document OCR line matching validates pixel coordinates. If an extracted analyte cannot be verified with >80% confidence, MedLens flags an honest *"Location not confirmed"* status instead of mis-highlighting.
2. **Honest Two-Tier Confidence**:
   - `legibility_flag`: Model's self-reported claim.
   - `confidence_tier` (`high`, `medium`, `low`): Calculated deterministically against physiological boundaries (`bio_ranges.json`) to catch OCR hallucinations.
3. **Refusal to Guess Missing Ranges**: Preserves raw values without fabricating clinical intervals.
4. **Non-Diagnostic Descriptive Phrasing**: Output text strictly avoids diagnosing disease names (e.g. no "hypothyroidism", no "anemia"). Focuses purely on numerical shifts across time.
5. **Gated Adversarial Counter-Argument**: Mandatory inline evaluation presenting 2 alternative non-diagnostic explanations (hydration, fasting duration, diurnal variations).
6. **Deterministic Source-Flag Count**: Replaces subjective 0–10 AI triage scores with exact laboratory abnormal counts (e.g. *"3 values flagged abnormal by laboratory"*).
7. **3-Tier Provenance Badging**: Every data point is tagged with its origin:
   - 🔵 `Patient-reported`
   - 🟢 `Extracted from report`
   - 🟣 `AI-generated`
8. **Inconsistency Detection**: Surfaces discrepancies between patient-reported conditions and lab findings (e.g., "no diabetes" vs abnormal glucose) for doctor reconciliation.
9. **DPDP Act 2023 Compliance**: Mandatory explicit consent gating (`/consent`) and one-click cascading right to erasure (`/delete-my-data`).
10. **HL7 FHIR R4 Bundle Standard**: Generates valid `Patient`, `Observation`, and `DiagnosticReport` resources conforming to international profiles testable at `validator.fhir.org`.

---

## 🏗️ Architecture

```
/
├── backend/
│   ├── api/
│   ├── extractors/          # SHA-256 Hasher, Vision Extractor & OCR Grounding
│   ├── normalizers/         # LOINC Normalization & Biological Sanity Checks
│   ├── intake/              # Patient Intake & Provenance Tagging
│   ├── trends/              # Longitudinal Temporal & Correlation Engine
│   ├── adversarial/         # Non-diagnostic Summaries & Gated Counter-Prompts
│   ├── fhir/                # HL7 FHIR R4 Bundle Builder
│   ├── consent/             # DPDP Act Consent & Erasure Manager
│   ├── messaging/           # WhatsApp Delivery & Simulation
│   ├── samples/             # Multi-report Seeder (Arjun, Kavita, Priya)
│   ├── data/
│   │   ├── loinc_map.json       # Top 50+ LOINC database
│   │   ├── bio_ranges.json      # Physiological sanity limits
│   │   ├── glossary.json        # Plain-English one-liners
│   │   └── correlation_map.json # Non-diagnostic multi-marker pairs
│   ├── database.py          # SQLAlchemy models
│   ├── main.py              # FastAPI application
│   └── test_medlens.py      # Automated backend test suite
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, ProvenanceBadge, ReportViewer, GlossaryTooltip, ClinicianPDF
│   │   ├── pages/           # UploadPage, ResultsPage, TimelinePage, SettingsPage
│   │   ├── api/             # Frontend API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ & npm

### 1. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install:all
```

### 2. Run Backend & Frontend Concurrently
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API Docs (Swagger)**: `http://localhost:8000/docs`

### 3. Run Automated Unit Tests
```bash
npm run test:backend
# or: python backend/test_medlens.py
```

---

## 🌐 Multilingual Accessibility & Voice Narration
- **Languages**: English, Hindi (`हिन्दी`), Telugu (`తెలుగు`).
- **Voice Narration**: Uses browser-native `SpeechSynthesis` API with localized accents (`en-IN`, `hi-IN`, `te-IN`).
- **WhatsApp Dispatch**: Formats safe patient-oriented summaries without triage emojis directly to WhatsApp.

---

## 📜 Standards & Compliance
- **HL7 FHIR R4**: Validated on `validator.fhir.org`.
- **LOINC**: Standard universal codes for clinical pathology investigations.
- **DPDP Act 2023**: Explicit consent lifecycle + cascading data deletion.
