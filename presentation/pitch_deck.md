# MedLens — 12-Slide Pitch Deck & Presentation Guide

> **Theme**: *"Every other team built a report reader. We built a patient memory that shows its sources, refuses to guess what it doesn't know, and hands your doctor something real — structured, understandable, and reviewable."*

---

## 📽️ Slide 1 — The Clinical Problem
**Headline**: Patients Have Reports, Not Understanding  
**Subtext**: The fragmentation of modern pathology and clinical diagnostic records.

- **01. Isolated Snapshots**: Every diagnostic visit generates a separate paper slip. Patients collect dozens of reports across labs that are never connected into a continuous timeline.
- **02. Unchecked AI Hallucinations**: Generic LLM wrappers invent medical reference intervals, hallucinate disease diagnoses, and output arbitrary triage scores without clinical grounding.
- **03. Zero Provenance**: Doctors cannot distinguish between extracted laboratory findings, patient-reported symptoms, and AI-generated inferences.

*Speaker Note*: "Good morning. In India alone, over 100 million lab tests are run every month. But patients don't have understanding — they have a folder full of PDFs that no one connects."

---

## 📽️ Slide 2 — The Industry Gap
**Headline**: Every Tool Reads One Report; No One Reads Across Time  
**Subtext**: Why existing OCR and health chatbots fail clinical reality.

| Dimension | Typical AI / OCR Readers | MedLens Platform |
|---|---|---|
| **Scope** | Single document in isolation | Longitudinal timeline across multi-lab visits |
| **Confidence** | Fake self-reported model scores | Real biological sanity checks cited from Tietz/Harrison |
| **Grounding** | Unverified bounding boxes | Grounded OCR token-set alignment or honest unconfirmed status |
| **Clinical Safety** | Premature disease labeling | Strictly non-diagnostic phrasing with gated counter-arguments |

*Speaker Note*: "Every existing tool looks at a single report. But a single elevated TSH means nothing without knowing where it was 6 months ago."

---

## 📽️ Slide 3 — Our Core Insight
**Headline**: “Reports are memories. We read all of them — and we show you exactly where every number came from.”

- **Structured**: Conforming to HL7 FHIR R4 and LOINC standards.
- **Understandable**: Plain-English glossary tooltips and native Indian language speech narration (Hindi, Telugu, English).
- **Reviewable**: 3-tier provenance badges and printable clinician handover sheets.

*Speaker Note*: "Our breakthrough is treating reports as longitudinal memories, not static text."

---

## 📽️ Slide 4 — Architecture & Pipeline
**Headline**: Multi-layered Validation from Ingestion to ABDM

```
[ Upload (DPDP Gated) ]
         ↓
[ SHA-256 Tamper-Evidence ]
         ↓
[ Token-Set OCR Grounding + Profile Verification ]
         ↓
[ Live NLM LOINC API + NLM RxNorm Drug Normalizer ]
         ↓
[ Biological Sanity Checking (Tietz/Harrison Bounds) ]
         ↓
[ Longitudinal Temporal Engine + Non-Diagnostic Correlations ]
         ↓
[ Adversarial AI Layer (Primary Summary + Gated Counter-Prompt) ]
         ↓
[ HL7 FHIR R4 Bundle + ABDM India NRCeS + WhatsApp Dispatch ]
```

*Speaker Note*: "Notice that every step is deterministically validated before the generative layer ever sees it."

---

## 📽️ Slide 5 — Live Demo Script
**Headline**: 5-Step Patient Journey on Stage

1. **DPDP Upload & Intake**: Explicit consent gating + live RxNorm medication normalization (*Thyronorm 50mcg*).
2. **Grounded Bounding Boxes**: Interactive side-by-side document highlighting verified OCR positions.
3. **Provenance Badging**: 3-tier badges + inconsistency alert between intake ("no diabetes") and lab data (elevated glucose).
4. **Adversarial AI Layer**: Non-diagnostic pattern summary + gated alternative physiological explanations.
5. **Multilingual & Export**: Voice narration in Hindi/Telugu, 1-click Clinician PDF, and WhatsApp preview.

---

## 📽️ Slide 6 — Live Safety Moment
**Headline**: The Safety Benchmark: Refusing to Guess

- **Test Case**: *Kavita Patel* — Report with missing reference intervals.
- **Standard AI Fail**: Fabricates 70–99 mg/dL without knowing fasting state or assay calibration.
- **MedLens Response**: Safely preserves raw data, assigns `unconfirmed_range`, refuses to hallucinate, and flags for clinician review.

*Speaker Note*: "Watch this — when a report is missing a reference range, MedLens refuses to invent one. This is what clinical safety looks like in code."

---

## 📽️ Slide 7 — Interoperability & Standards
**Headline**: HL7 FHIR R4 & India ABDM M3 Milestone Ready

- **International**: 100% compliant with `validator.fhir.org` (`Patient`, `Observation`, `DiagnosticReport`).
- **India National Grid**: Conforms to ABDM (Ayushman Bharat Digital Mission) NRCeS profiles with ABHA ID integration.

*Speaker Note*: "We don't create proprietary silos. Our FHIR export passes live validation on official international and Indian health authority sandboxes."

---

## 📽️ Slide 8 — Competitive Matrix
**Headline**: 5-Column Head-to-Head Comparison

*Speaker Note*: "Against legacy OCR, generic ChatGPT wrappers, and hospital portals, MedLens is the only solution that bridges longitudinal tracking with cryptographic provenance."

---

## 📽️ Slide 9 — Clinical Safety & Legal Matrix
**Headline**: Built for Zero-Liability Clinical Deployment

1. **Strictly Non-Diagnostic**: Zero disease naming in generated text.
2. **Deterministic Flag Count**: Exact laboratory abnormal count (no AI triage scores).
3. **DPDP Act 2023**: Right to erasure via cascading one-click data purge.
4. **Literature Bounds**: Reference limits cited from published medical textbooks.

---

## 📽️ Slide 10 — Traction & Unit Economics
**Headline**: Near-Zero Variable Cost at Massive Scale

- **Cost Per Report**: ₹0.20 (Gemini Vision + Free NLM Public APIs).
- **Monthly Cost @ 10,000 Reports**: ₹2,000/month.
- **India Diagnostic TAM**: ₹85,000 Cr+ growing at 12% CAGR.

*Speaker Note*: "Because our LOINC and RxNorm layers use free, authoritative public NLM APIs, our variable cost is 20 paise per report."

---

## 📽️ Slide 11 — Known Limitations & Technical Roadmap
**Headline**: Honest Boundaries & Future Milestones

- **Current Bounds**: Handwritten doctor prescriptions route to human review rather than guessing; rare genetic panels require manual clinical mapping.
- **Roadmap**: Dual-path fine-tuned on-device vision models for zero-connectivity primary health centres; direct ABDM Health Information Exchange (HIE) connector.

---

## 📽️ Slide 12 — The Closing Line
**Headline**: Structured. Understandable. Reviewable.

> *"Every other team built a report reader. We built a patient memory that shows its sources, refuses to guess what it doesn't know, and hands your doctor something real — structured, understandable, and reviewable, exactly as asked."*
