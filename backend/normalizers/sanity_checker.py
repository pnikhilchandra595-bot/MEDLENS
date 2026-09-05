import os
import json
from typing import Dict, Any, Optional, Tuple

class BiologicalSanityChecker:
    """
    Biological sanity checker for laboratory test values.
    Validates values against absolute physiological boundaries to detect OCR errors / hallucinations,
    and assigns honest confidence tiers ('high', 'medium', 'low').
    """

    def __init__(self, bio_ranges_path: Optional[str] = None):
        if not bio_ranges_path:
            bio_ranges_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "bio_ranges.json")
        self.bio_ranges_path = bio_ranges_path
        self.bio_ranges = self._load_bio_ranges()

    def _load_bio_ranges(self) -> Dict[str, Any]:
        if os.path.exists(self.bio_ranges_path):
            try:
                with open(self.bio_ranges_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[SanityChecker] Error loading bio ranges: {e}")
        return {}

    def validate_result(
        self,
        loinc_code: Optional[str],
        value: Optional[float],
        ref_low: Optional[float],
        ref_high: Optional[float],
        is_abnormal_extracted: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Validates value and reference ranges:
        - Out of biological limit -> hard_flagged -> confidence_tier = 'low' (probable OCR failure)
        - Out of lab reference range -> soft_flagged -> confidence_tier = 'medium' (abnormal clinical value)
        - Inside reference range -> confirmed -> confidence_tier = 'high'
        - Missing reference range -> safely preserved without fabricating numbers -> confidence_tier = 'medium'
        """
        if value is None:
            return {
                "confidence_tier": "low",
                "is_abnormal": False,
                "sanity_status": "missing_value",
                "message": "Numeric test value could not be extracted."
            }

        bio_entry = self.bio_ranges.get(loinc_code) if loinc_code else None

        # 1. Biological feasibility check
        if bio_entry:
            min_bio = bio_entry.get("min_bio")
            max_bio = bio_entry.get("max_bio")
            if min_bio is not None and value < min_bio:
                return {
                    "confidence_tier": "low",
                    "is_abnormal": True,
                    "sanity_status": "below_biological_limit",
                    "message": f"Value {value} is below plausible human biological threshold ({min_bio}). Possible OCR error."
                }
            if max_bio is not None and value > max_bio:
                return {
                    "confidence_tier": "low",
                    "is_abnormal": True,
                    "sanity_status": "above_biological_limit",
                    "message": f"Value {value} exceeds plausible human biological threshold ({max_bio}). Possible OCR error."
                }

        # 2. Reference Range abnormality check
        if ref_low is not None and ref_high is not None:
            is_abnormal = (value < ref_low) or (value > ref_high)
            tier = "medium" if is_abnormal else "high"
            return {
                "confidence_tier": tier,
                "is_abnormal": is_abnormal,
                "sanity_status": "abnormal_range" if is_abnormal else "within_range",
                "message": f"Value {value} is {'outside' if is_abnormal else 'within'} normal reference bounds ({ref_low} - {ref_high})."
            }
        elif ref_low is not None:
            is_abnormal = (value < ref_low)
            tier = "medium" if is_abnormal else "high"
            return {
                "confidence_tier": tier,
                "is_abnormal": is_abnormal,
                "sanity_status": "abnormal_range" if is_abnormal else "within_range",
                "message": f"Value {value} is {'below' if is_abnormal else 'above'} threshold ({ref_low})."
            }
        elif ref_high is not None:
            is_abnormal = (value > ref_high)
            tier = "medium" if is_abnormal else "high"
            return {
                "confidence_tier": tier,
                "is_abnormal": is_abnormal,
                "sanity_status": "abnormal_range" if is_abnormal else "within_range",
                "message": f"Value {value} is {'above' if is_abnormal else 'below'} threshold ({ref_high})."
            }
        else:
            # Report missing reference range safely - DO NOT GUESS OR FABRICATE
            is_abnormal = bool(is_abnormal_extracted)
            return {
                "confidence_tier": "medium",
                "is_abnormal": is_abnormal,
                "sanity_status": "missing_reference_range",
                "message": "Report does not specify reference interval; evaluated based on extracted flag without guessing."
            }
