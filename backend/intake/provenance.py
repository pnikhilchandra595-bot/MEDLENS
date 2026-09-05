from typing import Any, Dict, List, Optional

from normalizers.rxnorm_service import RxNormService

PROVENANCE_TAGS = {"PATIENT": "Patient-reported", "EXTRACTED": "Extracted from report", "AI": "AI-generated"}

rxnorm_service = RxNormService()


def detect_inconsistencies(
    patient_reported: Optional[Dict[str, Any]], extracted_results: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Phase 1.5 & Phase 1.6: Inconsistency detection between patient-reported history and extracted laboratory findings.
    Uses RxNorm active-ingredient resolution for brand-agnostic medication reconciliation.
    Never auto-resolves conflicts; surfaces structured alerts for doctor/patient reconciliation.
    """
    if not patient_reported or not extracted_results:
        return []

    flags = []
    conditions = (patient_reported.get("conditions") or "").lower()
    raw_meds = patient_reported.get("medications") or ""

    # Normalize medications using RxNorm
    med_entries = [m.strip() for m in raw_meds.replace(";", ",").split(",") if m.strip()]
    normalized_meds = [rxnorm_service.normalize_drug(m) for m in med_entries]
    active_ingredients = [m.get("active_ingredient", "") for m in normalized_meds]

    # Map extracted results by LOINC for quick lookup
    results_by_loinc = {r.get("loinc_code"): r for r in extracted_results if r.get("loinc_code")}
    results_by_name = {r.get("test_name", "").lower(): r for r in extracted_results}

    # 1. Diabetes conflict check
    glucose_res = results_by_loinc.get("2345-7") or results_by_loinc.get("1558-6") or results_by_name.get("glucose")
    hba1c_res = results_by_loinc.get("4548-4") or results_by_name.get("hba1c")

    if ("no diabetes" in conditions or "none" in conditions) and (
        (glucose_res and glucose_res.get("is_abnormal")) or (hba1c_res and hba1c_res.get("is_abnormal"))
    ):
        flags.append(
            {
                "category": "Condition Discrepancy",
                "title": "Patient-Reported History vs Glucose/HbA1c Findings",
                "message": "Patient reported no history of diabetes, but blood glucose / HbA1c is flagged abnormal on the laboratory report. Flagged for clinician reconciliation.",
                "severity": "attention",
                "source": PROVENANCE_TAGS["AI"],
            }
        )

    # 1b. Diabetic medication check (Metformin / Glycomet / Glucophage)
    has_metformin = any("metformin" in ing or "glucophage" in ing for ing in active_ingredients)
    if has_metformin and (glucose_res or hba1c_res):
        val = (hba1c_res or glucose_res).get("value")
        flags.append(
            {
                "category": "RxNorm Medication Monitoring",
                "title": "Metformin Therapy Logged (RxCUI 6809)",
                "message": f"Patient is on Biguanide antidiabetic therapy. Current glycemic level ({val}) noted for physician evaluation.",
                "severity": "info",
                "source": PROVENANCE_TAGS["AI"],
            }
        )

    # 2. Thyroid medication vs TSH abnormality (Thyronorm, Eltroxin, Levothyroxine)
    tsh_res = results_by_loinc.get("3016-3") or results_by_name.get("tsh")
    has_levothyroxine = any("levothyroxine" in ing or "thyroxine" in ing for ing in active_ingredients)

    if tsh_res and tsh_res.get("is_abnormal"):
        if (
            has_levothyroxine
            or "thyroxine" in raw_meds.lower()
            or "thyronorm" in raw_meds.lower()
            or "eltroxin" in raw_meds.lower()
        ):
            flags.append(
                {
                    "category": "RxNorm Medication Reconciliation",
                    "title": "Levothyroxine Therapy (RxCUI 617314) with Abnormal TSH",
                    "message": f"Patient is currently taking thyroid medication, and laboratory TSH level is {tsh_res.get('value')} {tsh_res.get('unit', '')}. Recommended for dosage titration review by physician.",
                    "severity": "info",
                    "source": PROVENANCE_TAGS["AI"],
                }
            )
        elif "no thyroid" in conditions:
            flags.append(
                {
                    "category": "Condition Discrepancy",
                    "title": "Unreported Thyroid History vs Elevated TSH",
                    "message": "Patient reported no prior thyroid issues, but TSH is outside normal reference intervals.",
                    "severity": "attention",
                    "source": PROVENANCE_TAGS["AI"],
                }
            )

    # 3. Lipid / Statin check (Atorva, Lipitor, Atorvastatin, Rosuvastatin)
    chol_res = results_by_loinc.get("2093-3") or results_by_name.get("total cholesterol")
    has_statin = any("atorvastatin" in ing or "rosuvastatin" in ing or "statin" in ing for ing in active_ingredients)

    if chol_res and chol_res.get("is_abnormal"):
        if (
            has_statin
            or "atorvastatin" in raw_meds.lower()
            or "statin" in raw_meds.lower()
            or "atorva" in raw_meds.lower()
        ):
            flags.append(
                {
                    "category": "RxNorm Medication Monitoring",
                    "title": "Statin Therapy (RxCUI 83367) with Elevated Lipid Panel",
                    "message": f"Patient reports taking lipid-lowering medication while Total Cholesterol is {chol_res.get('value')} mg/dL. Longitudinal retest timeline noted for doctor review.",
                    "severity": "info",
                    "source": PROVENANCE_TAGS["AI"],
                }
            )

    # 4. Kidney Function / Creatinine vs NSAIDs (Brufen, Combiflam, Ibuprofen)
    creat_res = (
        results_by_loinc.get("2160-0") or results_by_name.get("creatinine") or results_by_name.get("serum creatinine")
    )
    has_nsaid = any("ibuprofen" in ing or "aspirin" in ing or "nsaid" in ing for ing in active_ingredients)

    if (
        creat_res
        and creat_res.get("is_abnormal")
        and (
            has_nsaid or "nsaid" in raw_meds.lower() or "brufen" in raw_meds.lower() or "combiflam" in raw_meds.lower()
        )
    ):
        flags.append(
            {
                "category": "Medication Safety Alert",
                "title": "NSAID Use with Elevated Serum Creatinine",
                "message": "Patient reported NSAID painkiller usage alongside elevated serum creatinine. Flagged for review regarding renal workload.",
                "severity": "attention",
                "source": PROVENANCE_TAGS["AI"],
            }
        )

    return flags
