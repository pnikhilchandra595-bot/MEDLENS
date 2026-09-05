/**
 * @file mockData.js
 * @description Standalone offline fallback dataset for MedLens demo deployments (e.g. Vercel, static previews)
 * when a local Python FastAPI backend is not connected.
 */

export const MOCK_GLOSSARY = {
  "Hemoglobin": "Iron-containing oxygen-transport metalloprotein in red blood cells.",
  "RBC Count": "Total number of red blood corpuscles per unit volume of blood.",
  "PCV": "Packed Cell Volume / Hematocrit — percentage proportion of blood volume occupied by red blood cells.",
  "Platelet Count": "Cell fragments essential for normal blood clotting and primary hemostasis.",
  "Total Leukocyte Count (WBC)": "Total count of circulating white blood cells essential for immune defense.",
  "TSH": "Thyroid Stimulating Hormone — pituitary hormone regulating thyroid function and metabolic rate.",
  "Total Cholesterol": "Measurement of total sterol lipids circulating in blood; critical marker for cardiovascular risk.",
  "Triglycerides": "Primary circulating fat lipid derived from dietary intake and hepatic synthesis.",
  "HDL Cholesterol": "High-Density Lipoprotein ('good' cholesterol); transports peripheral cholesterol back to the liver.",
  "LDL Cholesterol": "Low-Density Lipoprotein ('bad' cholesterol); excess circulating levels accumulate in arterial walls.",
  "Fasting Blood Glucose": "Concentration of free glucose in serum following an 8-hour overnight fast.",
  "HbA1c": "Glycated hemoglobin indicating 3-month average blood glucose control.",
  "Serum Creatinine": "Metabolic breakdown byproduct of muscle creatine phosphate; key indicator of renal filtration rate.",
  "SGOT (AST)": "Serum glutamic oxaloacetic transaminase — enzyme present in hepatocytes and cardiac myocytes.",
  "SGPT (ALT)": "Serum glutamic pyruvic transaminase — liver-specific enzyme indicating hepatocellular integrity.",
  "Serum Ferritin": "Primary intracellular iron-storage protein; reliable metric of body iron reserves.",
  "ESR": "Erythrocyte Sedimentation Rate — non-specific rate of red cell settling indicating systemic inflammation."
};

export const MOCK_PATIENTS = [
  {
    "id": "pat-p-vijay-kumar",
    "name": "P Vijay Kumar",
    "age": 48,
    "sex": "Male",
    "phone": "+91 94401 23456",
    "email": "vijay.kumar@example.com",
    "reports_count": 9,
    "created_at": "2026-08-25T08:00:00Z"
  },
  {
    "id": "pat-arjun-sharma",
    "name": "Arjun Sharma",
    "age": 42,
    "sex": "Male",
    "phone": "+91 98765 43210",
    "email": "arjun.sharma@example.com",
    "reports_count": 3,
    "created_at": "2026-03-01T08:00:00Z"
  },
  {
    "id": "pat-kavita-patel",
    "name": "Kavita Patel",
    "age": 36,
    "sex": "Female",
    "phone": "+91 98111 22334",
    "email": "kavita.patel@example.com",
    "reports_count": 1,
    "created_at": "2026-01-15T08:00:00Z"
  },
  {
    "id": "pat-priya-sharma",
    "name": "Priya Sharma",
    "age": 29,
    "sex": "Female",
    "phone": "+91 98222 33445",
    "email": "priya.sharma@example.com",
    "reports_count": 1,
    "created_at": "2026-02-10T08:00:00Z"
  }
];

export const MOCK_REPORTS = {
  "rep-vijay-09": {
    "id": "rep-vijay-09",
    "patient": {
      "id": "pat-p-vijay-kumar",
      "name": "P Vijay Kumar",
      "age": 48,
      "sex": "Male",
      "phone": "+91 94401 23456"
    },
    "report_metadata": {
      "lab_name": "Apollo Diagnostics Central Laboratory",
      "report_date": "2026-08-25",
      "doctor_name": "Dr. Ramesh Chandra, MD",
      "file_name": "vijay_comprehensive_aug_2026.pdf",
      "file_url": "/samples/sample_report_1.png",
      "extraction_mode": "gemini_live",
      "sha256_hash": "c89f31a47e2b109dc04587621fba89410ce921b76402ea87bc1290384a511cd9",
      "provenance_tag": "Extracted from report"
    },
    "results": [
      // 1. Complete Blood Count (CBC) Test
      {
        "id": "res-v-01",
        "category": "Complete Blood Count (CBC) Test",
        "test_name": "Hemoglobin",
        "canonical_name": "Hemoglobin",
        "loinc_code": "718-7",
        "value": 16.3,
        "unit": "g/dL",
        "ref_low": 13.0,
        "ref_high": 17.0,
        "ref_raw": "13.0 - 17.0 g/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.22, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "25th Aug 2026", "value": 16.3, "is_abnormal": false, "is_borderline": false, "ref_raw": "13 - 17 g/dL" },
          { "date": "9th Apr 2026", "value": 17.0, "is_abnormal": false, "is_borderline": true, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "10th Oct 2025", "value": 15.1, "is_abnormal": false, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "6th Aug 2025", "value": 14.2, "is_abnormal": false, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "18th Feb 2025", "value": 13.2, "is_abnormal": false, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "23rd Jun 2024", "value": 14.3, "is_abnormal": false, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "5th May 2024", "value": 10.8, "is_abnormal": true, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "1st Apr 2024", "value": 10.1, "is_abnormal": true, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" },
          { "date": "14th Sep 2023", "value": 16.5, "is_abnormal": false, "is_borderline": false, "ref_raw": "13.0 - 17.0 g/dL" }
        ],
        "audit_trail": [
          {
            "id": "aud-v-01",
            "old_value": 15.8,
            "new_value": 16.3,
            "corrected_value": 16.3,
            "reason": "Calibration verified against primary Coulter hematology analyzer",
            "changed_at": "2026-08-25T09:42:00Z",
            "changed_by": "Dr. R. Chandra (Pathologist)"
          }
        ]
      },
      {
        "id": "res-v-02",
        "category": "Complete Blood Count (CBC) Test",
        "test_name": "RBC Count",
        "canonical_name": "Red Blood Cell Count",
        "loinc_code": "789-8",
        "value": 4.65,
        "unit": "10^6/µl",
        "ref_low": 4.5,
        "ref_high": 5.5,
        "ref_raw": "4.5 - 5.5 10^6/µl",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.27, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 3.8, "is_abnormal": true, "is_borderline": false, "ref_raw": "4.5 - 5.5" },
          { "date": "6th Aug '25", "value": 4.42, "is_abnormal": false, "is_borderline": true, "ref_raw": "4.5 - 5.5" },
          { "date": "10th Oct '25", "value": 4.46, "is_abnormal": false, "is_borderline": true, "ref_raw": "4.5 - 5.5" },
          { "date": "9th Apr '26", "value": 5.08, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.5 - 5.5" },
          { "date": "25th Aug '26", "value": 4.65, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.5 - 5.5" }
        ]
      },
      {
        "id": "res-v-03",
        "category": "Complete Blood Count (CBC) Test",
        "test_name": "PCV",
        "canonical_name": "Packed Cell Volume (Hematocrit)",
        "loinc_code": "20570-8",
        "value": 48.3,
        "unit": "%",
        "ref_low": 40.0,
        "ref_high": 50.0,
        "ref_raw": "40 - 50 %",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.32, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 37.8, "is_abnormal": true, "is_borderline": false, "ref_raw": "40 - 50 %" },
          { "date": "6th Aug '25", "value": 44.5, "is_abnormal": false, "is_borderline": false, "ref_raw": "40 - 50 %" },
          { "date": "10th Oct '25", "value": 45.4, "is_abnormal": false, "is_borderline": false, "ref_raw": "40 - 50 %" },
          { "date": "9th Apr '26", "value": 52.8, "is_abnormal": true, "is_borderline": false, "ref_raw": "40 - 50 %" },
          { "date": "25th Aug '26", "value": 48.3, "is_abnormal": false, "is_borderline": false, "ref_raw": "40 - 50 %" }
        ]
      },
      {
        "id": "res-v-04",
        "category": "Complete Blood Count (CBC) Test",
        "test_name": "Platelet Count",
        "canonical_name": "Platelet Count",
        "loinc_code": "777-3",
        "value": 240.0,
        "unit": "10^3/µl",
        "ref_low": 150.0,
        "ref_high": 450.0,
        "ref_raw": "150 - 450 10^3/µl",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Human-corrected",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.37, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 210.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "150 - 450" },
          { "date": "6th Aug '25", "value": 225.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "150 - 450" },
          { "date": "10th Oct '25", "value": 235.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "150 - 450" },
          { "date": "9th Apr '26", "value": 255.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "150 - 450" },
          { "date": "25th Aug '26", "value": 240.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "150 - 450" }
        ],
        "audit_trail": [
          {
            "id": "aud-v-04",
            "old_value": 220.0,
            "new_value": 240.0,
            "corrected_value": 240.0,
            "reason": "Corrected per automated impedance chamber slide recount",
            "changed_at": "2026-08-25T11:05:00Z",
            "changed_by": "Senior Lab Technologist"
          }
        ]
      },
      {
        "id": "res-v-05",
        "category": "Complete Blood Count (CBC) Test",
        "test_name": "Total Leukocyte Count (WBC)",
        "canonical_name": "Leukocyte Count (WBC)",
        "loinc_code": "6690-2",
        "value": 7.2,
        "unit": "10^3/µl",
        "ref_low": 4.0,
        "ref_high": 11.0,
        "ref_raw": "4.0 - 11.0 10^3/µl",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 6.4, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.0 - 11.0" },
          { "date": "6th Aug '25", "value": 7.8, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.0 - 11.0" },
          { "date": "10th Oct '25", "value": 7.1, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.0 - 11.0" },
          { "date": "9th Apr '26", "value": 6.9, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.0 - 11.0" },
          { "date": "25th Aug '26", "value": 7.2, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.0 - 11.0" }
        ]
      },

      // 2. Thyroid Profile Total
      {
        "id": "res-v-06",
        "category": "Thyroid Profile Total",
        "test_name": "TSH",
        "canonical_name": "Thyroid Stimulating Hormone",
        "loinc_code": "3016-3",
        "value": 2.45,
        "unit": "uIU/mL",
        "ref_low": 0.40,
        "ref_high": 4.50,
        "ref_raw": "0.40 - 4.50 uIU/mL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.48, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 5.8, "is_abnormal": true, "is_borderline": false, "ref_raw": "0.40 - 4.50" },
          { "date": "6th Aug '25", "value": 4.2, "is_abnormal": false, "is_borderline": true, "ref_raw": "0.40 - 4.50" },
          { "date": "10th Oct '25", "value": 3.6, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.40 - 4.50" },
          { "date": "9th Apr '26", "value": 2.8, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.40 - 4.50" },
          { "date": "25th Aug '26", "value": 2.45, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.40 - 4.50" }
        ]
      },
      {
        "id": "res-v-07",
        "category": "Thyroid Profile Total",
        "test_name": "Total T3",
        "canonical_name": "Triiodothyronine (Total T3)",
        "loinc_code": "3049-4",
        "value": 1.15,
        "unit": "ng/mL",
        "ref_low": 0.80,
        "ref_high": 2.00,
        "ref_raw": "0.80 - 2.00 ng/mL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.53, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 0.72, "is_abnormal": true, "is_borderline": false, "ref_raw": "0.80 - 2.00" },
          { "date": "10th Oct '25", "value": 0.98, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.80 - 2.00" },
          { "date": "25th Aug '26", "value": 1.15, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.80 - 2.00" }
        ]
      },
      {
        "id": "res-v-08",
        "category": "Thyroid Profile Total",
        "test_name": "Total T4",
        "canonical_name": "Thyroxine (Total T4)",
        "loinc_code": "3026-2",
        "value": 7.8,
        "unit": "µg/dL",
        "ref_low": 5.1,
        "ref_high": 14.1,
        "ref_raw": "5.1 - 14.1 µg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.58, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 4.8, "is_abnormal": true, "is_borderline": false, "ref_raw": "5.1 - 14.1" },
          { "date": "10th Oct '25", "value": 6.9, "is_abnormal": false, "is_borderline": false, "ref_raw": "5.1 - 14.1" },
          { "date": "25th Aug '26", "value": 7.8, "is_abnormal": false, "is_borderline": false, "ref_raw": "5.1 - 14.1" }
        ]
      },

      // 3. Liver Function Test (LFT)
      {
        "id": "res-v-09",
        "category": "Liver Function Test (LFT)",
        "test_name": "Total Bilirubin",
        "canonical_name": "Total Bilirubin",
        "loinc_code": "1975-2",
        "value": 0.8,
        "unit": "mg/dL",
        "ref_low": 0.2,
        "ref_high": 1.2,
        "ref_raw": "0.2 - 1.2 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.63, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 0.9, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.2 - 1.2" },
          { "date": "9th Apr '26", "value": 0.85, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.2 - 1.2" },
          { "date": "25th Aug '26", "value": 0.8, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.2 - 1.2" }
        ]
      },
      {
        "id": "res-v-10",
        "category": "Liver Function Test (LFT)",
        "test_name": "SGOT (AST)",
        "canonical_name": "Aspartate Aminotransferase (AST)",
        "loinc_code": "1920-8",
        "value": 28.0,
        "unit": "U/L",
        "ref_low": 10.0,
        "ref_high": 40.0,
        "ref_raw": "10.0 - 40.0 U/L",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.68, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 36.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "10.0 - 40.0" },
          { "date": "10th Oct '25", "value": 31.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "10.0 - 40.0" },
          { "date": "25th Aug '26", "value": 28.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "10.0 - 40.0" }
        ]
      },
      {
        "id": "res-v-11",
        "category": "Liver Function Test (LFT)",
        "test_name": "SGPT (ALT)",
        "canonical_name": "Alanine Aminotransferase (ALT)",
        "loinc_code": "1742-6",
        "value": 32.0,
        "unit": "U/L",
        "ref_low": 10.0,
        "ref_high": 41.0,
        "ref_raw": "10.0 - 41.0 U/L",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.73, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 44.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "10.0 - 41.0" },
          { "date": "10th Oct '25", "value": 38.0, "is_abnormal": false, "is_borderline": true, "ref_raw": "10.0 - 41.0" },
          { "date": "25th Aug '26", "value": 32.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "10.0 - 41.0" }
        ]
      },

      // 4. Lipid Profile Test
      {
        "id": "res-v-12",
        "category": "Lipid Profile Test",
        "test_name": "Total Cholesterol",
        "canonical_name": "Total Cholesterol",
        "loinc_code": "2093-3",
        "value": 178.0,
        "unit": "mg/dL",
        "ref_low": 125.0,
        "ref_high": 200.0,
        "ref_raw": "< 200.0 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.78, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 228.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "< 200.0" },
          { "date": "6th Aug '25", "value": 208.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "< 200.0" },
          { "date": "10th Oct '25", "value": 194.0, "is_abnormal": false, "is_borderline": true, "ref_raw": "< 200.0" },
          { "date": "9th Apr '26", "value": 182.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "< 200.0" },
          { "date": "25th Aug '26", "value": 178.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "< 200.0" }
        ]
      },
      {
        "id": "res-v-13",
        "category": "Lipid Profile Test",
        "test_name": "Triglycerides",
        "canonical_name": "Triglycerides",
        "loinc_code": "2571-8",
        "value": 135.0,
        "unit": "mg/dL",
        "ref_low": 50.0,
        "ref_high": 150.0,
        "ref_raw": "< 150.0 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.83, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 198.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "< 150.0" },
          { "date": "10th Oct '25", "value": 162.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "< 150.0" },
          { "date": "25th Aug '26", "value": 135.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "< 150.0" }
        ]
      },
      {
        "id": "res-v-14",
        "category": "Lipid Profile Test",
        "test_name": "LDL Cholesterol",
        "canonical_name": "Low-Density Lipoprotein (LDL)",
        "loinc_code": "2089-1",
        "value": 105.0,
        "unit": "mg/dL",
        "ref_low": 60.0,
        "ref_high": 100.0,
        "ref_raw": "< 100.0 mg/dL",
        "is_abnormal": true,
        "is_borderline": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.88, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 142.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "< 100.0" },
          { "date": "10th Oct '25", "value": 118.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "< 100.0" },
          { "date": "25th Aug '26", "value": 105.0, "is_abnormal": true, "is_borderline": true, "ref_raw": "< 100.0" }
        ]
      },
      {
        "id": "res-v-15",
        "category": "Lipid Profile Test",
        "test_name": "HDL Cholesterol",
        "canonical_name": "High-Density Lipoprotein (HDL)",
        "loinc_code": "2085-9",
        "value": 46.0,
        "unit": "mg/dL",
        "ref_low": 40.0,
        "ref_high": 60.0,
        "ref_raw": "> 40.0 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.93, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 41.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "> 40.0" },
          { "date": "25th Aug '26", "value": 46.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "> 40.0" }
        ]
      },

      // 5. Kidney Function Test (KFT)
      {
        "id": "res-v-16",
        "category": "Kidney Function Test (KFT)",
        "test_name": "Serum Creatinine",
        "canonical_name": "Serum Creatinine",
        "loinc_code": "2160-0",
        "value": 0.95,
        "unit": "mg/dL",
        "ref_low": 0.70,
        "ref_high": 1.30,
        "ref_raw": "0.70 - 1.30 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 1.05, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.70 - 1.30" },
          { "date": "10th Oct '25", "value": 0.98, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.70 - 1.30" },
          { "date": "25th Aug '26", "value": 0.95, "is_abnormal": false, "is_borderline": false, "ref_raw": "0.70 - 1.30" }
        ]
      },
      {
        "id": "res-v-17",
        "category": "Kidney Function Test (KFT)",
        "test_name": "Blood Urea Nitrogen (BUN)",
        "canonical_name": "Blood Urea Nitrogen (BUN)",
        "loinc_code": "3094-0",
        "value": 14.0,
        "unit": "mg/dL",
        "ref_low": 7.0,
        "ref_high": 20.0,
        "ref_raw": "7.0 - 20.0 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.40, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 16.5, "is_abnormal": false, "is_borderline": false, "ref_raw": "7.0 - 20.0" },
          { "date": "25th Aug '26", "value": 14.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "7.0 - 20.0" }
        ]
      },
      {
        "id": "res-v-18",
        "category": "Kidney Function Test (KFT)",
        "test_name": "Serum Uric Acid",
        "canonical_name": "Serum Uric Acid",
        "loinc_code": "3084-1",
        "value": 5.8,
        "unit": "mg/dL",
        "ref_low": 3.5,
        "ref_high": 7.2,
        "ref_raw": "3.5 - 7.2 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.45, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 6.8, "is_abnormal": false, "is_borderline": true, "ref_raw": "3.5 - 7.2" },
          { "date": "25th Aug '26", "value": 5.8, "is_abnormal": false, "is_borderline": false, "ref_raw": "3.5 - 7.2" }
        ]
      },

      // 6. Iron Test
      {
        "id": "res-v-19",
        "category": "Iron Test",
        "test_name": "Serum Iron",
        "canonical_name": "Serum Iron",
        "loinc_code": "2498-4",
        "value": 95.0,
        "unit": "µg/dL",
        "ref_low": 65.0,
        "ref_high": 175.0,
        "ref_raw": "65 - 175 µg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.50, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "1st Apr '24", "value": 42.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "65 - 175" },
          { "date": "5th May '24", "value": 58.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "65 - 175" },
          { "date": "18th Feb '25", "value": 78.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "65 - 175" },
          { "date": "25th Aug '26", "value": 95.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "65 - 175" }
        ]
      },
      {
        "id": "res-v-20",
        "category": "Iron Test",
        "test_name": "Serum Ferritin",
        "canonical_name": "Serum Ferritin",
        "loinc_code": "2276-4",
        "value": 140.0,
        "unit": "ng/mL",
        "ref_low": 30.0,
        "ref_high": 400.0,
        "ref_raw": "30 - 400 ng/mL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.55, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "1st Apr '24", "value": 18.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "30 - 400" },
          { "date": "18th Feb '25", "value": 85.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "30 - 400" },
          { "date": "25th Aug '26", "value": 140.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "30 - 400" }
        ]
      },

      // 7. HBA1C Test
      {
        "id": "res-v-21",
        "category": "HBA1C Test",
        "test_name": "HbA1c",
        "canonical_name": "Glycated Hemoglobin (HbA1c)",
        "loinc_code": "4548-4",
        "value": 5.6,
        "unit": "%",
        "ref_low": 4.0,
        "ref_high": 5.6,
        "ref_raw": "< 5.7 % (Normal)",
        "is_abnormal": false,
        "is_borderline": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.60, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 6.2, "is_abnormal": true, "is_borderline": true, "ref_raw": "< 5.7 %" },
          { "date": "10th Oct '25", "value": 5.9, "is_abnormal": true, "is_borderline": true, "ref_raw": "< 5.7 %" },
          { "date": "25th Aug '26", "value": 5.6, "is_abnormal": false, "is_borderline": true, "ref_raw": "< 5.7 %" }
        ]
      },

      // 8. Blood Sugar Fasting
      {
        "id": "res-v-22",
        "category": "Blood Sugar Fasting",
        "test_name": "Fasting Blood Sugar",
        "canonical_name": "Fasting Blood Glucose",
        "loinc_code": "1558-6",
        "value": 94.0,
        "unit": "mg/dL",
        "ref_low": 70.0,
        "ref_high": 99.0,
        "ref_raw": "70 - 99 mg/dL",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.65, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 118.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "70 - 99" },
          { "date": "10th Oct '25", "value": 104.0, "is_abnormal": true, "is_borderline": true, "ref_raw": "70 - 99" },
          { "date": "25th Aug '26", "value": 94.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "70 - 99" }
        ]
      },

      // 9. ESR Test
      {
        "id": "res-v-23",
        "category": "ESR Test",
        "test_name": "ESR",
        "canonical_name": "Erythrocyte Sedimentation Rate",
        "loinc_code": "4537-7",
        "value": 8.0,
        "unit": "mm/hr",
        "ref_low": 0.0,
        "ref_high": 15.0,
        "ref_raw": "0 - 15 mm/hr",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.70, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "1st Apr '24", "value": 24.0, "is_abnormal": true, "is_borderline": false, "ref_raw": "0 - 15" },
          { "date": "18th Feb '25", "value": 14.0, "is_abnormal": false, "is_borderline": true, "ref_raw": "0 - 15" },
          { "date": "25th Aug '26", "value": 8.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "0 - 15" }
        ]
      },

      // 10. Urine Routine & Microscopic Examination Test
      {
        "id": "res-v-24",
        "category": "Urine Routine & Microscopic Examination Test",
        "test_name": "Specific Gravity",
        "canonical_name": "Urine Specific Gravity",
        "loinc_code": "2965-2",
        "value": 1.018,
        "unit": "",
        "ref_low": 1.005,
        "ref_high": 1.030,
        "ref_raw": "1.005 - 1.030",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.75, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 1.022, "is_abnormal": false, "is_borderline": false, "ref_raw": "1.005 - 1.030" },
          { "date": "25th Aug '26", "value": 1.018, "is_abnormal": false, "is_borderline": false, "ref_raw": "1.005 - 1.030" }
        ]
      },
      {
        "id": "res-v-25",
        "category": "Urine Routine & Microscopic Examination Test",
        "test_name": "Urine pH",
        "canonical_name": "Urine pH",
        "loinc_code": "2756-5",
        "value": 6.2,
        "unit": "pH",
        "ref_low": 4.5,
        "ref_high": 8.0,
        "ref_raw": "4.5 - 8.0",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.80, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 6.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.5 - 8.0" },
          { "date": "25th Aug '26", "value": 6.2, "is_abnormal": false, "is_borderline": false, "ref_raw": "4.5 - 8.0" }
        ]
      },
      {
        "id": "res-v-26",
        "category": "Urine Routine & Microscopic Examination Test",
        "test_name": "Urine Albumin (Protein)",
        "canonical_name": "Urine Albumin",
        "loinc_code": "1753-3",
        "value": 0.0,
        "unit": "",
        "ref_low": 0.0,
        "ref_high": 0.0,
        "ref_raw": "Negative / Nil",
        "is_abnormal": false,
        "is_borderline": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.85, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "18th Feb '25", "value": 0.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "Negative" },
          { "date": "25th Aug '26", "value": 0.0, "is_abnormal": false, "is_borderline": false, "ref_raw": "Negative" }
        ]
      }
    ],
    "inconsistencies": [],
    "temporal_summary": {
      "analyte_trends": {
        "Hemoglobin": { "direction": "improving", "delta": "+6.2 g/dL recovery from 2024 anemia nadir", "velocity": "+0.3 g/dL / quarter" },
        "TSH": { "direction": "normalizing", "delta": "-3.35 uIU/mL from peak", "velocity": "-0.5 uIU/mL / quarter" },
        "Total Cholesterol": { "direction": "improving", "delta": "-50 mg/dL reduction", "velocity": "-12 mg/dL / quarter" },
        "HbA1c": { "direction": "controlled", "delta": "-0.6% drop to normal range", "velocity": "-0.15% / quarter" }
      },
      "correlation_flags": [
        {
          "title": "Normalized Thyroid-Metabolic Axis",
          "description": "Historical normalization in TSH is coupled with synchronous reduction in circulating Total Cholesterol and Fasting Glucose."
        },
        {
          "title": "Complete Anemia Resolution",
          "description": "Hemoglobin and RBC counts have fully recovered to normal baseline following iron repletion recorded in mid-2024."
        }
      ]
    },
    "clinical_intelligence": {
      "flag_count": 1,
      "flagged_markers": ["LDL Cholesterol (105 mg/dL)"],
      "non_diagnostic_summary": "P Vijay Kumar's 25th Aug 2026 comprehensive metabolic panel demonstrates excellent recovery across Complete Blood Count and Thyroid function. 25 of 26 parameters are within physiological reference intervals, with mild borderline LDL Cholesterol.",
      "doctor_questions": [
        "Are any dietary or exercise adjustments recommended for optimizing LDL cholesterol?",
        "Should routine CBC and thyroid screening be scheduled at annual intervals now that parameters have stabilized?"
      ],
      "biological_factors": [
        "Post-prandial lipid metabolism can cause minor shifts in measured LDL fractions.",
        "Hydration levels and time of collection naturally influence hematocrit and red cell indices."
      ],
      "safety_invariants_verified": true
    }
  },

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
      "extraction_mode": "gemini_live",
      "sha256_hash": "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      "provenance_tag": "Extracted from report"
    },
    "results": [
      {
        "id": "res-01",
        "category": "Thyroid Profile Total",
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
        "bbox": { "x": 0.08, "y": 0.28, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2025-09-10", "value": 3.8, "is_abnormal": false, "ref_raw": "0.40 - 4.50" },
          { "date": "2025-12-05", "value": 5.1, "is_abnormal": true, "ref_raw": "0.40 - 4.50" },
          { "date": "2026-03-01", "value": 6.8, "is_abnormal": true, "ref_raw": "0.40 - 4.50" }
        ]
      },
      {
        "id": "res-02",
        "category": "Lipid Profile Test",
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
        "bbox": { "x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2025-09-10", "value": 185.0, "is_abnormal": false, "ref_raw": "< 200.0" },
          { "date": "2025-12-05", "value": 215.0, "is_abnormal": true, "ref_raw": "< 200.0" },
          { "date": "2026-03-01", "value": 242.0, "is_abnormal": true, "ref_raw": "< 200.0" }
        ]
      },
      {
        "id": "res-03",
        "category": "Lipid Profile Test",
        "test_name": "Triglycerides",
        "canonical_name": "Triglycerides",
        "loinc_code": "2571-8",
        "value": 188.0,
        "unit": "mg/dL",
        "ref_low": 50.0,
        "ref_high": 150.0,
        "ref_raw": "< 150.0",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2025-09-10", "value": 140.0, "is_abnormal": false, "ref_raw": "< 150.0" },
          { "date": "2025-12-05", "value": 165.0, "is_abnormal": true, "ref_raw": "< 150.0" },
          { "date": "2026-03-01", "value": 188.0, "is_abnormal": true, "ref_raw": "< 150.0" }
        ]
      },
      {
        "id": "res-04",
        "category": "Lipid Profile Test",
        "test_name": "HDL Cholesterol",
        "canonical_name": "High-Density Lipoprotein (HDL)",
        "loinc_code": "2085-9",
        "value": 42.0,
        "unit": "mg/dL",
        "ref_low": 40.0,
        "ref_high": 60.0,
        "ref_raw": "> 40.0",
        "is_abnormal": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.49, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2025-09-10", "value": 45.0, "is_abnormal": false, "ref_raw": "> 40.0" },
          { "date": "2026-03-01", "value": 42.0, "is_abnormal": false, "ref_raw": "> 40.0" }
        ]
      },
      {
        "id": "res-05",
        "category": "Blood Sugar Fasting",
        "test_name": "Fasting Blood Glucose",
        "canonical_name": "Fasting Blood Glucose",
        "loinc_code": "1558-6",
        "value": 118.0,
        "unit": "mg/dL",
        "ref_low": 70.0,
        "ref_high": 99.0,
        "ref_raw": "70 - 99",
        "is_abnormal": true,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.56, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2025-09-10", "value": 92.0, "is_abnormal": false, "ref_raw": "70 - 99" },
          { "date": "2025-12-05", "value": 104.0, "is_abnormal": true, "ref_raw": "70 - 99" },
          { "date": "2026-03-01", "value": 118.0, "is_abnormal": true, "ref_raw": "70 - 99" }
        ]
      },
      {
        "id": "res-06",
        "category": "Kidney Function Test (KFT)",
        "test_name": "Serum Creatinine",
        "canonical_name": "Serum Creatinine",
        "loinc_code": "2160-0",
        "value": 0.95,
        "unit": "mg/dL",
        "ref_low": 0.7,
        "ref_high": 1.3,
        "ref_raw": "0.70 - 1.30",
        "is_abnormal": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.63, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2025-09-10", "value": 0.92, "is_abnormal": false, "ref_raw": "0.70 - 1.30" },
          { "date": "2026-03-01", "value": 0.95, "is_abnormal": false, "ref_raw": "0.70 - 1.30" }
        ]
      }
    ],
    "inconsistencies": [
      {
        "field": "Conditions",
        "type": "Condition Discrepancy",
        "message": "Patient reported 'No known diabetes', but Fasting Blood Glucose is elevated (118.0 mg/dL, reference: 70 - 99)."
      }
    ],
    "temporal_summary": {
      "analyte_trends": {
        "TSH": { "direction": "rising", "delta": "+3.0 uIU/mL over 6 months", "velocity": "+0.5 uIU/mL / month" },
        "Total Cholesterol": { "direction": "rising", "delta": "+57 mg/dL over 6 months", "velocity": "+9.5 mg/dL / month" },
        "Fasting Blood Glucose": { "direction": "rising", "delta": "+26 mg/dL over 6 months", "velocity": "+4.3 mg/dL / month" }
      },
      "correlation_flags": [
        {
          "title": "Concordant Shift: TSH & Lipid Profile",
          "description": "TSH has risen from 3.8 to 6.8 uIU/mL concurrently with Total Cholesterol increase from 185 to 242 mg/dL across 3 consecutive visits."
        }
      ]
    },
    "clinical_intelligence": {
      "flag_count": 4,
      "flagged_markers": ["TSH (6.8 uIU/mL)", "Total Cholesterol (242 mg/dL)", "Triglycerides (188 mg/dL)", "Fasting Blood Glucose (118 mg/dL)"],
      "non_diagnostic_summary": "Over the past 6 months across 3 consecutive lab reports, TSH has shifted upwards from 3.8 to 6.8 uIU/mL, accompanied by upward movements in Total Cholesterol (185 to 242 mg/dL) and Fasting Glucose (92 to 118 mg/dL).",
      "doctor_questions": [
        "Would you recommend checking Free T3/T4 and thyroid antibody titers given the upward TSH trajectory?",
        "What lifestyle or medication adjustments are recommended for managing the concurrent lipid elevations?"
      ],
      "biological_factors": [
        "Variations in hydration, sleep patterns, or circadian rhythms can influence circulating analyte levels.",
        "Fasting duration before blood draw significantly impacts glucose and triglyceride measurements."
      ],
      "safety_invariants_verified": true
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
      "lab_name": "Suburban Diagnostics Lab",
      "report_date": "2026-01-15",
      "doctor_name": "Dr. S. K. Roy, MBBS",
      "file_name": "kavita_hormone_panel.pdf",
      "file_url": "/samples/sample_report_1.png",
      "extraction_mode": "demo_fallback",
      "sha256_hash": "b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890a1",
      "provenance_tag": "Extracted from report"
    },
    "results": [
      {
        "id": "res-k-01",
        "category": "Thyroid Profile Total",
        "test_name": "Serum Cortisol",
        "canonical_name": "Serum Cortisol",
        "loinc_code": "2143-6",
        "value": 14.2,
        "unit": "µg/dL",
        "ref_low": null,
        "ref_high": null,
        "ref_raw": "Unspecified by Lab",
        "is_abnormal": false,
        "confidence_tier": "medium",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.35, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2026-01-15", "value": 14.2, "is_abnormal": false, "ref_raw": "Unspecified" }
        ]
      },
      {
        "id": "res-k-02",
        "category": "Thyroid Profile Total",
        "test_name": "TSH",
        "canonical_name": "Thyroid Stimulating Hormone",
        "loinc_code": "3016-3",
        "value": 2.1,
        "unit": "uIU/mL",
        "ref_low": 0.4,
        "ref_high": 4.5,
        "ref_raw": "0.40 - 4.50",
        "is_abnormal": false,
        "confidence_tier": "high",
        "source": "Extracted from report",
        "is_grounded": true,
        "bbox": { "x": 0.08, "y": 0.42, "w": 0.84, "h": 0.038 },
        "history": [
          { "date": "2026-01-15", "value": 2.1, "is_abnormal": false, "ref_raw": "0.40 - 4.50" }
        ]
      }
    ],
    "inconsistencies": [],
    "temporal_summary": { "analyte_trends": {}, "correlation_flags": [] },
    "clinical_intelligence": {
      "flag_count": 0,
      "flagged_markers": [],
      "non_diagnostic_summary": "All reported test parameters with published laboratory reference ranges are within expected physiological bounds. Serum Cortisol was reported without a laboratory reference interval and is safely preserved without guessing.",
      "doctor_questions": [
        "What specific reference interval does your laboratory use for morning Serum Cortisol evaluation?"
      ],
      "biological_factors": [
        "Diurnal rhythms cause natural variations in cortisol secretion between morning and evening."
      ],
      "safety_invariants_verified": true
    }
  }
};

export const MOCK_TIMELINE = {
  analyte_trends: {
    "718-7": {
      canonical_name: "Hemoglobin",
      loinc_code: "718-7",
      unit: "g/dL",
      ref_low: 13.0,
      ref_high: 17.0,
      direction: "improving",
      delta: "+6.2 g/dL recovery from 2024 anemia nadir",
      velocity: "+0.3 g/dL / quarter",
      history: [
        { report_date: "14th Sep 2023", value: 16.5, ref_low: 13.0, ref_high: 17.0, is_abnormal: false },
        { report_date: "1st Apr 2024", value: 10.1, ref_low: 13.0, ref_high: 17.0, is_abnormal: true },
        { report_date: "5th May 2024", value: 10.8, ref_low: 13.0, ref_high: 17.0, is_abnormal: true },
        { report_date: "23rd Jun 2024", value: 14.3, ref_low: 13.0, ref_high: 17.0, is_abnormal: false },
        { report_date: "18th Feb 2025", value: 13.2, ref_low: 13.0, ref_high: 17.0, is_abnormal: false },
        { report_date: "6th Aug 2025", value: 14.2, ref_low: 13.0, ref_high: 17.0, is_abnormal: false },
        { report_date: "10th Oct 2025", value: 15.1, ref_low: 13.0, ref_high: 17.0, is_abnormal: false },
        { report_date: "9th Apr 2026", value: 17.0, ref_low: 13.0, ref_high: 17.0, is_abnormal: false },
        { report_date: "25th Aug 2026", value: 16.3, ref_low: 13.0, ref_high: 17.0, is_abnormal: false }
      ]
    },
    "789-8": {
      canonical_name: "Red Blood Cell Count (RBC)",
      loinc_code: "789-8",
      unit: "10^6/µl",
      ref_low: 4.5,
      ref_high: 5.5,
      direction: "normalizing",
      delta: "+0.85 10^6/µl recovery",
      velocity: "+0.08 / quarter",
      history: [
        { report_date: "18th Feb 2025", value: 3.8, ref_low: 4.5, ref_high: 5.5, is_abnormal: true },
        { report_date: "6th Aug 2025", value: 4.42, ref_low: 4.5, ref_high: 5.5, is_abnormal: false },
        { report_date: "10th Oct 2025", value: 4.46, ref_low: 4.5, ref_high: 5.5, is_abnormal: false },
        { report_date: "9th Apr 2026", value: 5.08, ref_low: 4.5, ref_high: 5.5, is_abnormal: false },
        { report_date: "25th Aug 2026", value: 4.65, ref_low: 4.5, ref_high: 5.5, is_abnormal: false }
      ]
    },
    "20570-8": {
      canonical_name: "Packed Cell Volume (PCV / Hematocrit)",
      loinc_code: "20570-8",
      unit: "%",
      ref_low: 40.0,
      ref_high: 50.0,
      direction: "stabilized",
      delta: "+10.5% resolution from anemia",
      velocity: "+1.2% / quarter",
      history: [
        { report_date: "18th Feb 2025", value: 37.8, ref_low: 40.0, ref_high: 50.0, is_abnormal: true },
        { report_date: "6th Aug 2025", value: 44.5, ref_low: 40.0, ref_high: 50.0, is_abnormal: false },
        { report_date: "10th Oct 2025", value: 45.4, ref_low: 40.0, ref_high: 50.0, is_abnormal: false },
        { report_date: "9th Apr 2026", value: 52.8, ref_low: 40.0, ref_high: 50.0, is_abnormal: true },
        { report_date: "25th Aug 2026", value: 48.3, ref_low: 40.0, ref_high: 50.0, is_abnormal: false }
      ]
    },
    "3016-3": {
      canonical_name: "Thyroid Stimulating Hormone (TSH)",
      loinc_code: "3016-3",
      unit: "uIU/mL",
      ref_low: 0.40,
      ref_high: 4.50,
      direction: "normalizing",
      delta: "-3.35 uIU/mL reduction from peak",
      velocity: "-0.5 uIU/mL / quarter",
      history: [
        { report_date: "18th Feb 2025", value: 5.8, ref_low: 0.40, ref_high: 4.50, is_abnormal: true },
        { report_date: "6th Aug 2025", value: 4.2, ref_low: 0.40, ref_high: 4.50, is_abnormal: false },
        { report_date: "10th Oct 2025", value: 3.6, ref_low: 0.40, ref_high: 4.50, is_abnormal: false },
        { report_date: "9th Apr 2026", value: 2.8, ref_low: 0.40, ref_high: 4.50, is_abnormal: false },
        { report_date: "25th Aug 2026", value: 2.45, ref_low: 0.40, ref_high: 4.50, is_abnormal: false }
      ]
    },
    "2093-3": {
      canonical_name: "Total Cholesterol",
      loinc_code: "2093-3",
      unit: "mg/dL",
      ref_low: 125.0,
      ref_high: 200.0,
      direction: "improving",
      delta: "-50 mg/dL reduction to normal baseline",
      velocity: "-12 mg/dL / quarter",
      history: [
        { report_date: "18th Feb 2025", value: 228.0, ref_low: 125.0, ref_high: 200.0, is_abnormal: true },
        { report_date: "6th Aug 2025", value: 208.0, ref_low: 125.0, ref_high: 200.0, is_abnormal: true },
        { report_date: "10th Oct 2025", value: 194.0, ref_low: 125.0, ref_high: 200.0, is_abnormal: false },
        { report_date: "9th Apr 2026", value: 182.0, ref_low: 125.0, ref_high: 200.0, is_abnormal: false },
        { report_date: "25th Aug 2026", value: 178.0, ref_low: 125.0, ref_high: 200.0, is_abnormal: false }
      ]
    }
  },
  correlation_flags: [
    {
      title: "Synchronous Multi-Axis Recovery",
      description: "Progressive normalization in TSH across 2025–2026 is synchronously coupled with a 50 mg/dL reduction in Total Cholesterol and normalized fasting glycemia."
    },
    {
      title: "Complete Hematological Anemia Resolution",
      description: "Hemoglobin and RBC counts have achieved full normal baseline after mid-2024 nadir."
    }
  ]
};
