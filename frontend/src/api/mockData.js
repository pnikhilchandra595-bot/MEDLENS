/**
 * @file mockData.js
 * @description Standalone offline fallback dataset for MedLens demo deployments (e.g. Vercel, static previews)
 * when a local Python FastAPI backend is not connected.
 */

export const MOCK_GLOSSARY = {
  "TSH": "Thyroid Stimulating Hormone — pituitary hormone regulating thyroid function and metabolic rate.",
  "Total Cholesterol": "Measurement of total sterol lipids circulating in blood; critical marker for cardiovascular risk.",
  "Triglycerides": "Primary circulating fat lipid derived from dietary intake and hepatic synthesis.",
  "HDL Cholesterol": "High-Density Lipoprotein ('good' cholesterol); transports peripheral cholesterol back to the liver.",
  "LDL Cholesterol": "Low-Density Lipoprotein ('bad' cholesterol); excess circulating levels accumulate in arterial walls.",
  "Fasting Blood Glucose": "Concentration of free glucose in serum following an 8-hour overnight fast.",
  "Serum Creatinine": "Metabolic breakdown byproduct of muscle creatine phosphate; key indicator of renal filtration rate."
};

export const MOCK_PATIENTS = [
  {
    "id": "pat-arjun-sharma",
    "name": "Arjun Sharma",
    "age": 42,
    "sex": "Male",
    "phone": "+91 98765 43210",
    "reports_count": 3
  },
  {
    "id": "pat-kavita-patel",
    "name": "Kavita Patel",
    "age": 36,
    "sex": "Female",
    "phone": "+91 98111 22334",
    "reports_count": 1
  },
  {
    "id": "pat-priya-sharma",
    "name": "Priya Sharma",
    "age": 29,
    "sex": "Female",
    "phone": "+91 98222 33445",
    "reports_count": 1
  }
];

export const MOCK_REPORTS = {
  "rep-arjun-03": {
    "id": "rep-arjun-03",
    "patient": {
      "id": "pat-arjun-sharma",
      "name": "Arjun Sharma",
      "age": 42,
      "sex": "Male",
      "phone": "+91 98765 43210"
    },
    "report_metadata": {
      "lab_name": "Metropolis Healthcare Labs",
      "report_date": "2026-03-01",
      "doctor_name": "Dr. V. K. Malhotra, MD",
      "file_name": "arjun_lab_march_2026.pdf",
      "file_url": "/samples/sample_report_1.png",
      "extraction_mode": "demo_fallback",
      "sha256_hash": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      "provenance_tag": "Extracted from report"
    },
    "results": [
      {
        "id": "res-01",
        "test_name": "TSH",
        "canonical_name": "Thyroid Stimulating Hormone",
        "loinc_code": "3016-3",
        "value": 6.8,
        "unit": "uIU/mL",
        "ref_low": 0.4,
        "ref_high": 4.5,
        "ref_raw": "0.40 - 4.50",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.28, "w": 0.84, "h": 0.038 }
      },
      {
        "id": "res-02",
        "test_name": "Total Cholesterol",
        "canonical_name": "Total Cholesterol",
        "loinc_code": "2093-3",
        "value": 242.0,
        "unit": "mg/dL",
        "ref_low": 125.0,
        "ref_high": 200.0,
        "ref_raw": "< 200.0",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038 }
      },
      {
        "id": "res-03",
        "test_name": "Triglycerides",
        "canonical_name": "Triglycerides",
        "loinc_code": "2571-8",
        "value": 195.0,
        "unit": "mg/dL",
        "ref_low": 50.0,
        "ref_high": 150.0,
        "ref_raw": "< 150.0",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038 }
      },
      {
        "id": "res-04",
        "test_name": "HDL Cholesterol",
        "canonical_name": "HDL Cholesterol",
        "loinc_code": "2085-9",
        "value": 38.0,
        "unit": "mg/dL",
        "ref_low": 40.0,
        "ref_high": 60.0,
        "ref_raw": "> 40.0",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.49, "w": 0.84, "h": 0.038 }
      },
      {
        "id": "res-05",
        "test_name": "LDL Cholesterol",
        "canonical_name": "LDL Cholesterol",
        "loinc_code": "13457-7",
        "value": 165.0,
        "unit": "mg/dL",
        "ref_low": 50.0,
        "ref_high": 100.0,
        "ref_raw": "< 100.0",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.56, "w": 0.84, "h": 0.038 }
      },
      {
        "id": "res-06",
        "test_name": "Fasting Blood Glucose",
        "canonical_name": "Fasting Glucose",
        "loinc_code": "1558-6",
        "value": 94.0,
        "unit": "mg/dL",
        "ref_low": 70.0,
        "ref_high": 99.0,
        "ref_raw": "70.0 - 99.0",
        "is_abnormal": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.63, "w": 0.84, "h": 0.038 }
      },
      {
        "id": "res-07",
        "test_name": "Serum Creatinine",
        "canonical_name": "Creatinine",
        "loinc_code": "2160-0",
        "value": 0.9,
        "unit": "mg/dL",
        "ref_low": 0.6,
        "ref_high": 1.2,
        "ref_raw": "0.60 - 1.20",
        "is_abnormal": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.70, "w": 0.84, "h": 0.038 }
      }
    ],
    "inconsistencies": [
      {
        "title": "Medication-Lab Conflict: Statin with Elevated Lipids",
        "message": "Patient is taking Atorvastatin (Atorva 10mg) but Total Cholesterol (242 mg/dL) and LDL (165 mg/dL) remain elevated above reference targets. Recommended for clinical titration review.",
        "source": "AI-generated"
      }
    ],
    "clinical_intelligence": {
      "flag_count": 5,
      "flagged_tests_count_text": "5 values flagged outside standard laboratory reference range.",
      "flagged_markers": ["TSH", "Total Cholesterol", "Triglycerides", "HDL Cholesterol", "LDL Cholesterol"],
      "primary_summary": "On your report, TSH, Total Cholesterol, Triglycerides, and LDL Cholesterol are above standard reference boundaries, while HDL Cholesterol is below reference target. Across recorded dates, concordant upward shifts were observed in TSH and Total Cholesterol for physician consultation.",
      "counter_explanations": [
        "Variations in hydration status, exact fasting duration, or time of day of blood collection can naturally shift circulating analyte concentrations.",
        "Recent physical exertion, temporary dietary changes, or differences in laboratory assay calibration between test batches."
      ],
      "doctor_questions": [
        "Would you recommend a follow-up retest in 4 to 8 weeks to observe if these values remain consistent?",
        "Could my current dietary routine, supplements, or medications be contributing to these specific shifts?",
        "Are there any complementary biomarker checks or physical assessments you would advise based on these trends?"
      ],
      "language": "en",
      "source": "AI-generated"
    }
  },
  "rep-kavita-01": {
    "id": "rep-kavita-01",
    "patient": {
      "id": "pat-kavita-patel",
      "name": "Kavita Patel",
      "age": 36,
      "sex": "Female",
      "phone": "+91 98111 22334"
    },
    "report_metadata": {
      "lab_name": "Suburban Diagnostics, Ahmedabad",
      "report_date": "2026-02-20",
      "doctor_name": "Dr. A. N. Joshi, MD",
      "file_name": "kavita_specialized_panel.pdf",
      "file_url": "/samples/sample_report_1.png",
      "extraction_mode": "demo_fallback",
      "sha256_hash": "b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890a1",
      "provenance_tag": "Extracted from report"
    },
    "results": [
      {
        "id": "res-k01",
        "test_name": "HbA1c",
        "canonical_name": "Glycated Hemoglobin",
        "loinc_code": "4548-4",
        "value": 6.9,
        "unit": "%",
        "ref_low": null,
        "ref_high": null,
        "ref_raw": "Unspecified in Report",
        "is_abnormal": true,
        "confidence_tier": "medium",
        "source": "Extracted from report",
        "is_grounded": false,
        "bbox": null
      },
      {
        "id": "res-k02",
        "test_name": "Fasting Plasma Glucose",
        "canonical_name": "Fasting Glucose",
        "loinc_code": "1558-6",
        "value": 142.0,
        "unit": "mg/dL",
        "ref_low": 70.0,
        "ref_high": 99.0,
        "ref_raw": "70.0 - 99.0",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.40, "w": 0.84, "h": 0.038 }
      }
    ],
    "inconsistencies": [],
    "clinical_intelligence": {
      "flag_count": 2,
      "flagged_tests_count_text": "2 values flagged outside standard laboratory reference range.",
      "flagged_markers": ["HbA1c", "Fasting Plasma Glucose"],
      "primary_summary": "On your report, Fasting Plasma Glucose is outside reference boundaries and HbA1c is recorded with an unspecified reference range on the physical document. This summary notes numerical findings for clinical review.",
      "counter_explanations": [
        "Fasting duration variation prior to morning collection can shift circulating glucose concentrations.",
        "Assay methodology differences across laboratory analyzers."
      ],
      "doctor_questions": [
        "Should we perform a confirmatory repeat test under standardized 10-hour fasting conditions?",
        "What target glycemic range do you advise based on my current clinical profile?"
      ],
      "language": "en",
      "source": "AI-generated"
    }
  }
};

export const MOCK_TIMELINE = {
  "patient_id": "pat-arjun-sharma",
  "patient_name": "Arjun Sharma",
  "reports_analyzed_count": 3,
  "analyte_trends": {
    "3016-3": {
      "marker_name": "TSH (Thyroid Stimulating Hormone)",
      "loinc_code": "3016-3",
      "unit": "uIU/mL",
      "first_value": 3.2,
      "latest_value": 6.8,
      "pct_change": 112.5,
      "direction": "increasing",
      "threshold_event": "Crossed upper reference threshold on 2026-03-01",
      "history": [
        { "report_date": "2025-09-10", "value": 3.2, "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": false },
        { "report_date": "2025-12-15", "value": 4.6, "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": true },
        { "report_date": "2026-03-01", "value": 6.8, "ref_low": 0.4, "ref_high": 4.5, "is_abnormal": true }
      ]
    },
    "2093-3": {
      "marker_name": "Total Cholesterol",
      "loinc_code": "2093-3",
      "unit": "mg/dL",
      "first_value": 190.0,
      "latest_value": 242.0,
      "pct_change": 27.4,
      "direction": "increasing",
      "threshold_event": "Crossed upper reference threshold on 2025-12-15",
      "history": [
        { "report_date": "2025-09-10", "value": 190.0, "ref_low": 125.0, "ref_high": 200.0, "is_abnormal": false },
        { "report_date": "2025-12-15", "value": 215.0, "ref_low": 125.0, "ref_high": 200.0, "is_abnormal": true },
        { "report_date": "2026-03-01", "value": 242.0, "ref_low": 125.0, "ref_high": 200.0, "is_abnormal": true }
      ]
    },
    "2571-8": {
      "marker_name": "Triglycerides",
      "loinc_code": "2571-8",
      "unit": "mg/dL",
      "first_value": 140.0,
      "latest_value": 195.0,
      "pct_change": 39.3,
      "direction": "increasing",
      "threshold_event": "Crossed upper reference threshold on 2025-12-15",
      "history": [
        { "report_date": "2025-09-10", "value": 140.0, "ref_low": 50.0, "ref_high": 150.0, "is_abnormal": false },
        { "report_date": "2025-12-15", "value": 165.0, "ref_low": 50.0, "ref_high": 150.0, "is_abnormal": true },
        { "report_date": "2026-03-01", "value": 195.0, "ref_low": 50.0, "ref_high": 150.0, "is_abnormal": true }
      ]
    },
    "1558-6": {
      "marker_name": "Fasting Blood Glucose",
      "loinc_code": "1558-6",
      "unit": "mg/dL",
      "first_value": 88.0,
      "latest_value": 94.0,
      "pct_change": 6.8,
      "direction": "stable",
      "threshold_event": null,
      "history": [
        { "report_date": "2025-09-10", "value": 88.0, "ref_low": 70.0, "ref_high": 99.0, "is_abnormal": false },
        { "report_date": "2025-12-15", "value": 91.0, "ref_low": 70.0, "ref_high": 99.0, "is_abnormal": false },
        { "report_date": "2026-03-01", "value": 94.0, "ref_low": 70.0, "ref_high": 99.0, "is_abnormal": false }
      ]
    }
  },
  "correlation_flags": [
    {
      "pair_key": "3016-3+2093-3",
      "pair_name": "TSH & Total Cholesterol Concordance",
      "directions": "Both Rising",
      "observation": "Concordant upward shift observed across 3 sequential reports. Published physiology literature notes elevated TSH frequently correlates with altered hepatic lipid clearance. Marked for physician review."
    }
  ]
};
