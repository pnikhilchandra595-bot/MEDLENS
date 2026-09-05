from typing import List, Dict, Any, Optional

PROVENANCE_TAGS = {
    "PATIENT": "Patient-reported",
    "EXTRACTED": "Extracted from report",
    "AI": "AI-generated"
}

def detect_inconsistencies(
    patient_reported: Optional[Dict[str, Any]],
    extracted_results: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Phase 1.5: Inconsistency detection between patient-reported history and extracted laboratory findings.
    Never auto-resolves conflicts; surfaces structured alerts for doctor/patient reconciliation.
    """
    if not patient_reported or not extracted_results:
        return []

    flags = []
    conditions = (patient_reported.get("conditions") or "").lower()
    symptoms = (patient_reported.get("symptoms") or "").lower()
    medications = (patient_reported.get("medications") or "").lower()

    # Map extracted results by LOINC for quick lookup
    results_by_loinc = {r.get("loinc_code"): r for r in extracted_results if r.get("loinc_code")}
    results_by_name = {r.get("test_name", "").lower(): r for r in extracted_results}

    # 1. Diabetes conflict check
    glucose_res = results_by_loinc.get("2345-7") or results_by_loinc.get("1558-6") or results_by_name.get("glucose")
    hba1c_res = results_by_loinc.get("4548-4") or results_by_name.get("hba1c")

    if ("no diabetes" in conditions or "none" in conditions) and (
        (glucose_res and glucose_res.get("is_abnormal")) or (hba1c_res and hba1c_res.get("is_abnormal"))
    ):
        flags.append({
            "category": "Condition Discrepancy",
            "title": "Patient-Reported History vs Glucose/HbA1c Findings",
            "message": "Patient reported no history of diabetes, but blood glucose / HbA1c is flagged abnormal on the laboratory report. Flagged for clinician reconciliation.",
            "severity": "attention",
            "source": PROVENANCE_TAGS["AI"]
        })

    # 2. Thyroid medication vs TSH abnormality
    tsh_res = results_by_loinc.get("3016-3") or results_by_name.get("tsh")
    if tsh_res and tsh_res.get("is_abnormal"):
        if "thyroxine" in medications or "levothyroxine" in medications or "eltroxin" in medications or "thyronorm" in medications:
            flags.append({
                "category": "Medication Reconciliation",
                "title": "Thyroid Medication Logged with Abnormal TSH",
                "message": f"Patient is currently taking thyroid medication, and laboratory TSH level is {tsh_res.get('value')} {tsh_res.get('unit', '')}. Recommended for dosage review by physician.",
                "severity": "info",
                "source": PROVENANCE_TAGS["AI"]
            })
        elif "no thyroid" in conditions:
            flags.append({
                "category": "Condition Discrepancy",
                "title": "Unreported Thyroid History vs Elevated TSH",
                "message": "Patient reported no prior thyroid issues, but TSH is outside normal reference intervals.",
                "severity": "attention",
                "source": PROVENANCE_TAGS["AI"]
            })

    # 3. Lipid / Statin check
    chol_res = results_by_loinc.get("2093-3") or results_by_name.get("total cholesterol")
    if chol_res and chol_res.get("is_abnormal"):
        if "atorvastatin" in medications or "rosuvastatin" in medications or "statin" in medications:
            flags.append({
                "category": "Medication Monitoring",
                "title": "Statin Therapy with Elevated Lipid Panel",
                "message": f"Patient reports taking lipid-lowering medication while Total Cholesterol is {chol_res.get('value')} mg/dL. Retest timeline noted for doctor review.",
                "severity": "info",
                "source": PROVENANCE_TAGS["AI"]
            })

    # 4. Kidney Function / Creatinine
    creat_res = results_by_loinc.get("2160-0") or results_by_name.get("creatinine") or results_by_name.get("serum creatinine")
    if creat_res and creat_res.get("is_abnormal") and "nsaid" in medications:
        flags.append({
            "category": "Medication Alert",
            "title": "NSAID Use with Elevated Serum Creatinine",
            "message": "Patient reported NSAID painkiller usage alongside elevated serum creatinine. Flagged for review regarding renal workload.",
            "severity": "attention",
            "source": PROVENANCE_TAGS["AI"]
        })

    return flags
