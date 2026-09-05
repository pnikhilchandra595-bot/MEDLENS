import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

class FhirBundleBuilder:
    """
    Builds HL7 FHIR R4 compliant Bundle containing Patient, DiagnosticReport, and Observation resources.
    Conforms to both International US Core and India ABDM (Ayushman Bharat Digital Mission) / NRCeS profiles.
    """

    @staticmethod
    def build_fhir_bundle(
        patient_data: Dict[str, Any],
        report_data: Dict[str, Any],
        test_results: List[Dict[str, Any]],
        is_abdm_profile: bool = False
    ) -> Dict[str, Any]:
        bundle_id = str(uuid.uuid4())
        patient_id = patient_data.get("id") or f"pat-{uuid.uuid4().hex[:8]}"
        report_id = report_data.get("id") or f"rep-{uuid.uuid4().hex[:8]}"
        report_date = report_data.get("report_date") or datetime.now(timezone.utc).strftime("%Y-%m-%d")

        entries = []

        # 1. FHIR Patient Resource (ABDM / NRCeS Compatible)
        patient_profile = "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient" if is_abdm_profile else "http://hl7.org/fhir/StructureDefinition/Patient"
        
        patient_resource: Dict[str, Any] = {
            "fullUrl": f"urn:uuid:{patient_id}",
            "resource": {
                "resourceType": "Patient",
                "id": patient_id,
                "meta": {
                    "profile": [patient_profile],
                    "versionId": "1",
                    "lastUpdated": datetime.now(timezone.utc).isoformat()
                },
                "identifier": [
                    {
                        "type": {
                            "coding": [
                                {
                                    "system": "http://terminology.hl7.org/CodeSystem/v2-0203",
                                    "code": "MR",
                                    "display": "Medical Record Number"
                                }
                            ]
                        },
                        "system": "https://healthid.ndhm.gov.in" if is_abdm_profile else "http://medlens.health/patients",
                        "value": patient_data.get("abha_id") or f"91-4567-8901-{patient_id[:4]}"
                    }
                ],
                "name": [
                    {
                        "use": "official",
                        "text": patient_data.get("name", "Arjun Sharma")
                    }
                ],
                "gender": (patient_data.get("sex") or "male").lower()
            }
        }
        if patient_data.get("phone"):
            patient_resource["resource"]["telecom"] = [
                {
                    "system": "phone",
                    "value": patient_data.get("phone"),
                    "use": "mobile"
                }
            ]
        entries.append(patient_resource)

        # 2. FHIR Observation Resources
        obs_profile = "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation" if is_abdm_profile else "http://hl7.org/fhir/StructureDefinition/Observation"
        observation_references = []

        for i, res in enumerate(test_results):
            obs_id = f"obs-{uuid.uuid4().hex[:8]}"
            loinc_code = res.get("loinc_code") or "UNK"
            canonical_name = res.get("canonical_name") or res.get("test_name", "Lab Test")
            val = res.get("value")
            unit = res.get("unit") or "mg/dL"
            is_abnormal = res.get("is_abnormal", False)

            obs_resource: Dict[str, Any] = {
                "resourceType": "Observation",
                "id": obs_id,
                "meta": {
                    "profile": [obs_profile]
                },
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "laboratory",
                                "display": "Laboratory"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": loinc_code,
                            "display": canonical_name
                        }
                    ],
                    "text": canonical_name
                },
                "subject": {
                    "reference": f"urn:uuid:{patient_id}",
                    "display": patient_data.get("name", "Patient")
                },
                "effectiveDateTime": f"{report_date}T09:00:00Z"
            }

            # Value Quantity
            if val is not None:
                obs_resource["valueQuantity"] = {
                    "value": float(val),
                    "unit": unit,
                    "system": "http://unitsofmeasure.org",
                    "code": unit
                }

            # Reference Range
            ref_low = res.get("ref_low")
            ref_high = res.get("ref_high")
            if ref_low is not None or ref_high is not None:
                ref_range: Dict[str, Any] = {}
                if ref_low is not None:
                    ref_range["low"] = {"value": float(ref_low), "unit": unit}
                if ref_high is not None:
                    ref_range["high"] = {"value": float(ref_high), "unit": unit}
                obs_resource["referenceRange"] = [ref_range]

            # Interpretation flag (Abnormal / Normal)
            obs_resource["interpretation"] = [
                {
                    "coding": [
                        {
                            "system": "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                            "code": "A" if is_abnormal else "N",
                            "display": "Abnormal" if is_abnormal else "Normal"
                        }
                    ]
                }
            ]

            # Provenance & Confidence Extensions
            obs_resource["extension"] = [
                {
                    "url": "http://medlens.health/fhir/StructureDefinition/provenance-source",
                    "valueString": res.get("source", "Extracted from report")
                },
                {
                    "url": "http://medlens.health/fhir/StructureDefinition/confidence-tier",
                    "valueString": res.get("confidence_tier", "high")
                }
            ]

            entries.append({
                "fullUrl": f"urn:uuid:{obs_id}",
                "resource": obs_resource
            })
            observation_references.append({
                "reference": f"urn:uuid:{obs_id}",
                "display": canonical_name
            })

        # 3. FHIR DiagnosticReport Resource
        diag_profile = "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DiagnosticReportLab" if is_abdm_profile else "http://hl7.org/fhir/StructureDefinition/DiagnosticReport"

        diagnostic_report = {
            "fullUrl": f"urn:uuid:{report_id}",
            "resource": {
                "resourceType": "DiagnosticReport",
                "id": report_id,
                "meta": {
                    "profile": [diag_profile]
                },
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/v2-0074",
                                "code": "LAB",
                                "display": "Laboratory"
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": "11502-2",
                            "display": "Laboratory report"
                        }
                    ],
                    "text": report_data.get("lab_name", "Diagnostic Laboratory Report")
                },
                "subject": {
                    "reference": f"urn:uuid:{patient_id}",
                    "display": patient_data.get("name", "Patient")
                },
                "effectiveDateTime": f"{report_date}T09:00:00Z",
                "issued": datetime.now(timezone.utc).isoformat(),
                "performer": [
                    {
                        "display": report_data.get("lab_name", "Metropolis Diagnostic Lab")
                    }
                ],
                "result": observation_references
            }
        }
        entries.append(diagnostic_report)

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "profile": [
                    "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle" if is_abdm_profile else "http://hl7.org/fhir/StructureDefinition/Bundle"
                ],
                "lastUpdated": datetime.now(timezone.utc).isoformat()
            },
            "type": "collection",
            "entry": entries
        }
