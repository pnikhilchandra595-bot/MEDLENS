import json
import logging
import os
from difflib import SequenceMatcher
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


class LoincNormalizer:
    """
    Normalizes laboratory test names using:
    1. Live public NLM (U.S. National Library of Medicine) Clinical Tables LOINC API
       (https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search)
    2. High-speed in-memory LRU cache for zero latency
    3. Robust local LOINC database fallback for offline resilience
    """

    NLM_API_URL = "https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search"

    def __init__(self, map_path: Optional[str] = None):
        if not map_path:
            map_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "loinc_map.json")
        self.map_path = map_path
        self.loinc_db = self._load_loinc_db()
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _load_loinc_db(self) -> Dict[str, Any]:
        if os.path.exists(self.map_path):
            try:
                with open(self.map_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error("[LoincNormalizer] Error loading local LOINC map: %s", e)
        return {}

    def normalize(self, raw_test_name: str) -> Dict[str, Any]:
        """
        Normalizes test name via local database first, then live NLM LOINC API if unmapped,
        ensuring comprehensive coverage across the entire official LOINC standard.
        """
        if not raw_test_name:
            return {
                "loinc_code": None,
                "canonical_name": "Unrecognized Test (Flagged for Human Review)",
                "category": "Unclassified",
                "is_recognized": False,
                "source": "None",
            }

        cleaned_query = raw_test_name.lower().strip()

        # Check in-memory cache
        if cleaned_query in self._cache:
            return self._cache[cleaned_query]

        # 1. Check local top-50+ curated dictionary first for instant zero-ms response
        local_result = self._lookup_local(cleaned_query)
        if local_result.get("is_recognized"):
            self._cache[cleaned_query] = local_result
            return local_result

        # 2. Live NLM Clinical Tables API search (full LOINC database)
        nlm_result = self.search_nlm_loinc(raw_test_name)
        if nlm_result and nlm_result.get("is_recognized"):
            self._cache[cleaned_query] = nlm_result
            return nlm_result

        # 3. Unmatched fallback: flag for human review, never drop
        fallback_result = {
            "loinc_code": None,
            "canonical_name": f"{raw_test_name} (Unrecognized - Flagged for Review)",
            "category": "Unclassified",
            "is_recognized": False,
            "match_confidence": 0.0,
            "source": "Unrecognized",
        }
        self._cache[cleaned_query] = fallback_result
        return fallback_result

    def _lookup_local(self, cleaned_query: str) -> Dict[str, Any]:
        if cleaned_query in self.loinc_db:
            entry = self.loinc_db[cleaned_query]
            return {
                "loinc_code": entry.get("loinc"),
                "canonical_name": entry.get("short_name", entry.get("name")),
                "full_name": entry.get("name"),
                "category": entry.get("category", "General"),
                "standard_unit": entry.get("unit"),
                "is_recognized": True,
                "source": "Local Certified Dictionary",
            }

        best_match_key = None
        best_score = 0.0

        for key, entry in self.loinc_db.items():
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
                "match_confidence": round(best_score, 1),
                "source": "Local Fuzzy Match",
            }

        return {"is_recognized": False}

    def search_nlm_loinc(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Queries the official U.S. NLM Clinical Tables API for live LOINC code resolution.
        """
        try:
            params = {"terms": query, "df": "LOINC_NUM,COMPONENT,LONG_COMMON_NAME,SYSTEM,EXAMPLE_UNITS", "maxList": 5}
            resp = requests.get(self.NLM_API_URL, params=params, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                # data[3] contains rows: [[code, component, long_name, system, units], ...]
                if len(data) >= 4 and data[3] and len(data[3]) > 0:
                    top_row = data[3][0]
                    loinc_num = top_row[0] if len(top_row) > 0 else None
                    component = top_row[1] if len(top_row) > 1 else query
                    long_name = top_row[2] if len(top_row) > 2 else component
                    unit = top_row[4] if len(top_row) > 4 else None

                    if loinc_num:
                        return {
                            "loinc_code": loinc_num,
                            "canonical_name": component or long_name,
                            "full_name": long_name,
                            "category": "NLM Clinical Pathology",
                            "standard_unit": unit,
                            "is_recognized": True,
                            "source": "NLM Clinical Tables API (Live)",
                        }
        except Exception as e:
            logger.debug("[LoincNormalizer] NLM API call skipped/failed (%s), using local fallback.", e)
        return None
