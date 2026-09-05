import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime

class TemporalIntelligenceEngine:
    """
    Longitudinal temporal trend and multi-marker correlation engine.
    Analyzes lab tests across historical reports for a patient using descriptive, non-diagnostic phrasing.
    """

    def __init__(self, correlation_map_path: Optional[str] = None):
        if not correlation_map_path:
            correlation_map_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), "data", "correlation_map.json"
            )
        self.correlation_map_path = correlation_map_path
        self.correlation_map = self._load_correlation_map()

    def _load_correlation_map(self) -> Dict[str, Any]:
        if os.path.exists(self.correlation_map_path):
            try:
                with open(self.correlation_map_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[TemporalEngine] Error loading correlation map: {e}")
        return {}

    def analyze_patient_timeline(
        self,
        historical_reports: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Accepts a list of historical reports (ordered chronologically), each containing a list of test results.
        Returns:
        - analyte_trends: time-series data per analyte with deltas, directions, and threshold crossings.
        - correlation_flags: detected multi-marker concordant shifts using non-diagnostic phrasing.
        - timeline_summary: structured summary of temporal observations.
        """
        if not historical_reports:
            return {
                "analyte_trends": {},
                "correlation_flags": [],
                "timeline_summary": "No historical lab reports found for temporal comparison."
            }

        # Group results by LOINC code (or fallback canonical/test name)
        series_by_marker: Dict[str, List[Dict[str, Any]]] = {}

        for rep in historical_reports:
            rep_date = rep.get("report_date") or rep.get("created_at") or "Unknown Date"
            rep_id = rep.get("id")
            for res in rep.get("results", []):
                key = res.get("loinc_code") or res.get("test_name", "").lower()
                if not key or res.get("value") is None:
                    continue

                if key not in series_by_marker:
                    series_by_marker[key] = []

                series_by_marker[key].append({
                    "report_id": rep_id,
                    "report_date": rep_date,
                    "test_name": res.get("canonical_name") or res.get("test_name"),
                    "loinc_code": res.get("loinc_code"),
                    "value": res.get("value"),
                    "unit": res.get("unit"),
                    "ref_low": res.get("ref_low"),
                    "ref_high": res.get("ref_high"),
                    "is_abnormal": res.get("is_abnormal", False),
                    "confidence_tier": res.get("confidence_tier", "high")
                })

        analyte_trends = {}
        for key, points in series_by_marker.items():
            if not points:
                continue
            
            # Sort chronologically by date
            points.sort(key=lambda x: str(x.get("report_date", "")))

            # Calculate metrics
            first_val = points[0]["value"]
            latest_val = points[-1]["value"]
            delta = round(latest_val - first_val, 2)
            pct_change = round(((latest_val - first_val) / first_val) * 100.0, 1) if first_val else 0.0

            if delta > 0.05 * (first_val or 1.0):
                direction = "increasing"
            elif delta < -0.05 * (first_val or 1.0):
                direction = "decreasing"
            else:
                direction = "stable"

            # Threshold crossings check
            threshold_event = None
            if len(points) >= 2:
                prev = points[-2]
                curr = points[-1]
                if not prev.get("is_abnormal") and curr.get("is_abnormal"):
                    threshold_event = "Exceeded normal laboratory reference range on latest report"
                elif prev.get("is_abnormal") and not curr.get("is_abnormal"):
                    threshold_event = "Returned to within normal reference range on latest report"

            analyte_trends[key] = {
                "marker_name": points[-1]["test_name"],
                "loinc_code": points[-1].get("loinc_code"),
                "unit": points[-1].get("unit"),
                "history": points,
                "first_value": first_val,
                "latest_value": latest_val,
                "delta": delta,
                "pct_change": pct_change,
                "direction": direction,
                "threshold_event": threshold_event
            }

        # Multi-marker correlation analysis
        correlation_flags = []
        for pair_key, template in self.correlation_map.items():
            codes = pair_key.split("+")
            if len(codes) == 2:
                c1, c2 = codes[0], codes[1]
                t1 = analyte_trends.get(c1)
                t2 = analyte_trends.get(c2)
                if t1 and t2 and len(t1["history"]) >= 2 and len(t2["history"]) >= 2:
                    # Check if both have shifted in the correlated direction
                    if t1["direction"] == "increasing" and t2["direction"] == "increasing":
                        correlation_flags.append({
                            "pair_key": pair_key,
                            "pair_name": template.get("pair_name"),
                            "markers": [t1["marker_name"], t2["marker_name"]],
                            "observation": template.get("description"),
                            "directions": f"{t1['marker_name']} ({t1['direction']}) + {t2['marker_name']} ({t2['direction']})",
                            "source": "AI-generated"
                        })
                    elif t1["direction"] == "decreasing" and t2["direction"] == "decreasing":
                        correlation_flags.append({
                            "pair_key": pair_key,
                            "pair_name": template.get("pair_name"),
                            "markers": [t1["marker_name"], t2["marker_name"]],
                            "observation": template.get("description"),
                            "directions": f"{t1['marker_name']} ({t1['direction']}) + {t2['marker_name']} ({t2['direction']})",
                            "source": "AI-generated"
                        })

        return {
            "analyte_trends": analyte_trends,
            "correlation_flags": correlation_flags,
            "reports_analyzed_count": len(historical_reports)
        }
