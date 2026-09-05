import os
import json
from typing import Dict, Any, Optional
from difflib import SequenceMatcher

class LoincNormalizer:
    """
    Normalizes extracted laboratory test names against the LOINC database (top 50+ tests).
    Ensures unrecognized tests are routed to human review rather than discarded.
    """

    def __init__(self, map_path: Optional[str] = None):
        if not map_path:
            map_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "loinc_map.json")
        self.map_path = map_path
        self.loinc_db = self._load_loinc_db()

    def _load_loinc_db(self) -> Dict[str, Any]:
        if os.path.exists(self.map_path):
            try:
                with open(self.map_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[LoincNormalizer] Error loading LOINC map: {e}")
        return {}

    def normalize(self, raw_test_name: str) -> Dict[str, Any]:
        if not raw_test_name:
            return {
                "loinc_code": None,
                "canonical_name": "Unrecognized Test (Flagged for Human Review)",
                "category": "Unclassified",
                "is_recognized": False
            }

        cleaned_query = raw_test_name.lower().strip()
        
        # Direct exact match check
        if cleaned_query in self.loinc_db:
            entry = self.loinc_db[cleaned_query]
            return {
                "loinc_code": entry.get("loinc"),
                "canonical_name": entry.get("short_name", entry.get("name")),
                "full_name": entry.get("name"),
                "category": entry.get("category", "General"),
                "standard_unit": entry.get("unit"),
                "is_recognized": True
            }

        # Fuzzy match over dictionary keys
        best_match_key = None
        best_score = 0.0

        for key, entry in self.loinc_db.items():
            # Check ratio with key name or canonical name
            s1 = SequenceMatcher(None, cleaned_query, key.lower()).ratio() * 100.0
            s2 = SequenceMatcher(None, cleaned_query, entry.get("short_name", "").lower()).ratio() * 100.0
            max_s = max(s1, s2)
            if max_s > best_score:
                best_score = max_s
                best_match_key = key

        if best_score >= 70.0 and best_match_key:
            entry = self.loinc_db[best_match_key]
            return {
                "loinc_code": entry.get("loinc"),
                "canonical_name": entry.get("short_name", entry.get("name")),
                "full_name": entry.get("name"),
                "category": entry.get("category", "General"),
                "standard_unit": entry.get("unit"),
                "is_recognized": True,
                "match_confidence": round(best_score, 1)
            }

        # Unmatched fallback: route to review, never drop
        return {
            "loinc_code": None,
            "canonical_name": f"{raw_test_name} (Unrecognized - Flagged for Review)",
            "category": "Unclassified",
            "is_recognized": False,
            "match_confidence": round(best_score, 1) if best_match_key else 0.0
        }
