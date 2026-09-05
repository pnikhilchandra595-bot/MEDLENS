import logging
from typing import Any, Dict, Optional

import requests

logger = logging.getLogger(__name__)


class RxNormService:
    """
    NLM RxNorm Drug Normalization & Interaction Service.
    Resolves commercial and international brand names (e.g. Crocin, Thyronorm, Eltroxin, Atorva, Glycomet)
    to canonical active ingredients and RxCUIs for brand-agnostic medication reconciliation.
    """

    RXNORM_API_URL = "https://rxnav.nlm.nih.gov/REST/drugs.json"

    # Fast offline fallback and common brand-to-ingredient map for instant resolution
    COMMON_DRUG_MAP = {
        "crocin": {
            "name": "Acetaminophen / Paracetamol",
            "rxcui": "161",
            "category": "Analgesic / Antipyretic",
            "ingredient": "acetaminophen",
        },
        "calpol": {
            "name": "Acetaminophen / Paracetamol",
            "rxcui": "161",
            "category": "Analgesic / Antipyretic",
            "ingredient": "acetaminophen",
        },
        "paracetamol": {
            "name": "Acetaminophen",
            "rxcui": "161",
            "category": "Analgesic / Antipyretic",
            "ingredient": "acetaminophen",
        },
        "dolo": {
            "name": "Acetaminophen (Paracetamol 650mg)",
            "rxcui": "161",
            "category": "Analgesic / Antipyretic",
            "ingredient": "acetaminophen",
        },
        "thyronorm": {
            "name": "Levothyroxine Sodium",
            "rxcui": "617314",
            "category": "Thyroid Hormone",
            "ingredient": "levothyroxine",
        },
        "eltroxin": {
            "name": "Levothyroxine Sodium",
            "rxcui": "617314",
            "category": "Thyroid Hormone",
            "ingredient": "levothyroxine",
        },
        "thyroxine": {
            "name": "Levothyroxine Sodium",
            "rxcui": "617314",
            "category": "Thyroid Hormone",
            "ingredient": "levothyroxine",
        },
        "atorva": {
            "name": "Atorvastatin Calcium",
            "rxcui": "83367",
            "category": "HMG-CoA Reductase Inhibitor (Statin)",
            "ingredient": "atorvastatin",
        },
        "atorvastatin": {"name": "Atorvastatin", "rxcui": "83367", "category": "Statin", "ingredient": "atorvastatin"},
        "lipitor": {
            "name": "Atorvastatin Calcium",
            "rxcui": "83367",
            "category": "Statin",
            "ingredient": "atorvastatin",
        },
        "glycomet": {
            "name": "Metformin Hydrochloride",
            "rxcui": "6809",
            "category": "Biguanide Antidiabetic",
            "ingredient": "metformin",
        },
        "metformin": {
            "name": "Metformin",
            "rxcui": "6809",
            "category": "Biguanide Antidiabetic",
            "ingredient": "metformin",
        },
        "glucophage": {
            "name": "Metformin Hydrochloride",
            "rxcui": "6809",
            "category": "Biguanide Antidiabetic",
            "ingredient": "metformin",
        },
        "brufen": {"name": "Ibuprofen", "rxcui": "5640", "category": "NSAID", "ingredient": "ibuprofen"},
        "combiflam": {
            "name": "Ibuprofen + Paracetamol",
            "rxcui": "5640",
            "category": "NSAID Combination",
            "ingredient": "ibuprofen",
        },
        "aspirin": {
            "name": "Aspirin",
            "rxcui": "1191",
            "category": "Antiplatelet / Salicylate",
            "ingredient": "aspirin",
        },
        "ecosprin": {"name": "Aspirin Low Dose", "rxcui": "1191", "category": "Antiplatelet", "ingredient": "aspirin"},
        "telma": {
            "name": "Telmisartan",
            "rxcui": "73032",
            "category": "Angiotensin II Receptor Blocker",
            "ingredient": "telmisartan",
        },
        "telmisartan": {
            "name": "Telmisartan",
            "rxcui": "73032",
            "category": "Antihypertensive",
            "ingredient": "telmisartan",
        },
        "amlong": {
            "name": "Amlodipine Besylate",
            "rxcui": "17767",
            "category": "Calcium Channel Blocker",
            "ingredient": "amlodipine",
        },
        "amlodipine": {
            "name": "Amlodipine",
            "rxcui": "17767",
            "category": "Antihypertensive",
            "ingredient": "amlodipine",
        },
        "pantocid": {
            "name": "Pantoprazole",
            "rxcui": "40790",
            "category": "Proton Pump Inhibitor",
            "ingredient": "pantoprazole",
        },
        "pan": {
            "name": "Pantoprazole",
            "rxcui": "40790",
            "category": "Proton Pump Inhibitor",
            "ingredient": "pantoprazole",
        },
    }

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def normalize_drug(self, drug_query: str) -> Dict[str, Any]:
        """
        Resolves brand or generic drug name to RxNorm concept and active ingredient.
        """
        if not drug_query:
            return {"is_recognized": False, "raw_name": drug_query}

        cleaned = drug_query.lower().strip()

        # Check in-memory cache
        if cleaned in self._cache:
            return self._cache[cleaned]

        # 1. Check local fast dictionary
        for brand, entry in self.COMMON_DRUG_MAP.items():
            if brand in cleaned or cleaned in brand:
                result = {
                    "raw_name": drug_query,
                    "canonical_name": entry["name"],
                    "rxcui": entry["rxcui"],
                    "category": entry["category"],
                    "active_ingredient": entry["ingredient"],
                    "is_recognized": True,
                    "source": "RxNorm Verified",
                }
                self._cache[cleaned] = result
                return result

        # 2. Query Live NLM RxNorm API
        live_result = self._lookup_live_rxnorm(drug_query)
        if live_result and live_result.get("is_recognized"):
            self._cache[cleaned] = live_result
            return live_result

        # Fallback
        fallback = {
            "raw_name": drug_query,
            "canonical_name": drug_query,
            "rxcui": None,
            "category": "Unclassified Medication",
            "active_ingredient": drug_query.lower(),
            "is_recognized": False,
            "source": "Patient-reported (Unmapped)",
        }
        self._cache[cleaned] = fallback
        return fallback

    def _lookup_live_rxnorm(self, drug_name: str) -> Optional[Dict[str, Any]]:
        try:
            resp = requests.get(self.RXNORM_API_URL, params={"name": drug_name}, timeout=2.5)
            if resp.status_code == 200:
                data = resp.json()
                concept_groups = data.get("drugGroup", {}).get("conceptGroup", [])
                for group in concept_groups:
                    concepts = group.get("conceptProperties", [])
                    if concepts and len(concepts) > 0:
                        top = concepts[0]
                        return {
                            "raw_name": drug_name,
                            "canonical_name": top.get("name", drug_name),
                            "rxcui": top.get("rxcui"),
                            "category": top.get("tty", "RxNorm Drug"),
                            "active_ingredient": top.get("name", "").split(" ")[0].lower(),
                            "is_recognized": True,
                            "source": "NLM RxNorm API (Live)",
                        }
        except Exception as e:
            logger.debug("[RxNorm] Live lookup skipped (%s).", e)
        return None
