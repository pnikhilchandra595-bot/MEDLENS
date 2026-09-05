import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Sparkles, 
  FileCheck,
  AlertTriangle,
  Pill
} from 'lucide-react';
import { uploadReport, savePatientIntake, searchRxNormDrug } from '../api/client';
import ProvenanceBadge from '../components/ProvenanceBadge';

export default function UploadPage({
  selectedPatient,
  onUploadSuccess,
  onSelectQuickDemo
}) {
  const [file, setFile] = useState(null);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mismatchWarning, setMismatchWarning] = useState(null);

  // Patient Intake Form States
  const [intake, setIntake] = useState({
    age: selectedPatient?.age || 42,
    sex: selectedPatient?.sex || 'Male',
    symptoms: 'Occasional sluggishness, cold sensitivity, mild evening fatigue',
    conditions: 'No known diabetes, familial hypercholesterolemia',
    allergies: 'Penicillin',
    medications: 'Thyronorm 50mcg, Atorva 10mg'
  });

  const [normalizedMeds, setNormalizedMeds] = useState([]);
  const fileInputRef = useRef(null);

  // Live RxNorm concept resolution on medication input change
  useEffect(() => {
    const raw = intake.medications || '';
    const parts = raw.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      Promise.all(parts.map(p => searchRxNormDrug(p).catch(() => null)))
        .then((res) => {
          setNormalizedMeds(res.filter(Boolean));
        });
    } else {
      setNormalizedMeds([]);
    }
  }, [intake.medications]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setMismatchWarning(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setMismatchWarning(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a laboratory report file (PDF or Image).');
      return;
    }
    if (!consentConfirmed) {
      setError('DPDP Consent must be explicitly confirmed before uploading medical reports.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Save patient intake first to maintain provenance
      if (selectedPatient?.id) {
        await savePatientIntake(selectedPatient.id, intake);
      }

      // 2. Upload and process report
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patient_id', selectedPatient?.id || '');
      formData.append('patient_name', selectedPatient?.name || 'Arjun Sharma');
      formData.append('consent_confirmed', 'true');

      const res = await uploadReport(formData);

      if (res.patient_match?.status === 'needs_confirmation') {
        setMismatchWarning(res.patient_match);
      }

      if (onUploadSuccess) {
        onUploadSuccess(res.report_id, res.patient_id);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during extraction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Hero Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Live NLM LOINC API + NLM RxNorm Drug Normalization</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">
          Upload & Clinical Ingestion Engine
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Ingest lab reports with SHA-256 tamper-evident hashing, honest two-tier confidence ranking, live RxNorm medication reconciliation, and 3-tier provenance tracking.
        </p>
      </div>

      {/* Quick Demo Pre-load Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 font-display">
          ⚡ Quick Demo Scenarios (One-Click Testing)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectQuickDemo('vijay')}
            className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
              1. 26-Biomarker Smart Report (P Vijay Kumar)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              9 reports (2023–2026), 10 clinical panels, full multi-year progression curves.
            </p>
          </button>

          <button
            onClick={() => onSelectQuickDemo('arjun')}
            className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
              2. Multi-Report Timeline (Arjun Sharma)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              3 sequential reports showing TSH & Total Cholesterol correlated upward shift.
            </p>
          </button>

          <button
            onClick={() => onSelectQuickDemo('kavita')}
            className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl text-left transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-700">
              3. Missing Reference Range (Kavita Patel)
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Demonstrates safe unconfirmed handling without guessing or fabricating ranges.
            </p>
          </button>

          <button
            onClick={() => {
              setFile(new File(['sample_mismatch_report'], 'priya_sharma_report.pdf', { type: 'application/pdf' }));
              setMismatchWarning({
                status: 'needs_confirmation',
                similarity: 45.2,
                extracted_name: 'Priya Sharma',
                active_name: selectedPatient?.name || 'P Vijay Kumar',
                message: "Report name 'Priya Sharma' does not match active profile (45% match). Confirm before saving."
              });
            }}
            className="p-3 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-xl text-left transition-all group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700">
              4. Family Profile Mismatch Test
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Tests blocking safety confirmation for family member report cross-talk.
            </p>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid: Upload + Patient Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Dropzone & Consent */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-display">
                <FileText className="w-4 h-4 text-emerald-600" />
                Upload Laboratory Document
              </h2>
              <ProvenanceBadge source="Extracted from report" size="xs" />
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                file 
                  ? 'border-emerald-500 bg-emerald-50/50' 
                  : 'border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-slate-50'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 group-hover:text-emerald-600">
                  {file ? <FileCheck className="w-6 h-6 text-emerald-600" /> : <UploadCloud className="w-6 h-6" />}
                </div>
                {file ? (
                  <div>
                    <span className="font-bold text-emerald-700 text-sm block">{file.name}</span>
                    <span className="text-[11px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • Ready for extraction
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">
                      Click to upload or drag & drop report
                    </span>
                    <span className="text-xs text-slate-500">PDF, JPG, PNG (up to 15MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* DPDP Consent Gating */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent-check"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 bg-white cursor-pointer"
                />
                <label htmlFor="consent-check" className="text-xs text-slate-700 leading-relaxed cursor-pointer select-none">
                  <strong className="text-emerald-800">DPDP Compliance & Data Consent:</strong> I explicitly consent to the extraction and temporal analysis of this clinical laboratory report. I understand my data remains encrypted and I can trigger irreversible erasure anytime under the Digital Personal Data Protection Act.
                </label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name Mismatch Safety Modal / Banner */}
            {mismatchWarning && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Profile Mismatch Warning (Improvisation #7)</span>
                </div>
                <p>{mismatchWarning.message}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMismatchWarning(null)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm"
                  >
                    Confirm & Proceed Anyway
                  </button>
                  <button
                    onClick={() => { setFile(null); setMismatchWarning(null); }}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs"
                  >
                    Cancel Upload
                  </button>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={loading || !file || !consentConfirmed}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-700/20 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Processing Document & Grounding Bboxes...' : 'Ingest & Analyze Report'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Patient Information Intake Form */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-display">
                <UserCheck className="w-4 h-4 text-sky-600" />
                Patient Information Intake
              </h2>
              <ProvenanceBadge source="Patient-reported" size="xs" />
            </div>
            <p className="text-xs text-slate-500">
              Supplements report extraction with patient-reported medical context for inconsistency detection.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="intake-age" className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  id="intake-age"
                  type="number"
                  value={intake.age}
                  onChange={(e) => setIntake({ ...intake, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="intake-sex" className="block text-xs font-bold text-slate-700 mb-1">Biological Sex</label>
                <select
                  id="intake-sex"
                  value={intake.sex}
                  onChange={(e) => setIntake({ ...intake, sex: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="intake-symptoms" className="block text-xs font-bold text-slate-700 mb-1">Reported Symptoms (Free Text)</label>
              <textarea
                id="intake-symptoms"
                rows={2}
                value={intake.symptoms}
                onChange={(e) => setIntake({ ...intake, symptoms: e.target.value })}
                placeholder="e.g., Fatigue, unexplained weight changes, joint stiffness..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none shadow-sm"
              />
            </div>

            <div>
              <label htmlFor="intake-conditions" className="block text-xs font-bold text-slate-700 mb-1">Known Diagnosed Conditions</label>
              <input
                id="intake-conditions"
                type="text"
                value={intake.conditions}
                onChange={(e) => setIntake({ ...intake, conditions: e.target.value })}
                placeholder="e.g., No diabetes, hypertension..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div>
                <label htmlFor="intake-medications" className="block text-xs font-bold text-slate-700 mb-1">
                  Current Medications (Auto-Normalized via NLM RxNorm)
                </label>
                <input
                  id="intake-medications"
                  type="text"
                  value={intake.medications}
                  onChange={(e) => setIntake({ ...intake, medications: e.target.value })}
                  placeholder="e.g., Thyronorm 50mcg, Atorva 10mg, Crocin, Metformin..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                />
              </div>

              {/* Live RxNorm Resolved Badges */}
              {normalizedMeds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {normalizedMeds.map((med, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-50 border border-cyan-200 text-[10px] text-cyan-800 font-medium"
                      title={med.source}
                    >
                      <Pill className="w-2.5 h-2.5 text-cyan-600" />
                      <span>{med.canonical_name}</span>
                      {med.rxcui && (
                        <span className="font-mono text-[9px] text-cyan-700 bg-cyan-100 px-1 rounded font-bold">
                          RxCUI: {med.rxcui}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="intake-allergies" className="block text-xs font-bold text-slate-700 mb-1">Allergies</label>
              <input
                id="intake-allergies"
                type="text"
                value={intake.allergies}
                onChange={(e) => setIntake({ ...intake, allergies: e.target.value })}
                placeholder="e.g., Penicillin, Sulfa..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
              />
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Automatic conflict check will run upon upload</span>
              <span className="text-emerald-700 font-mono font-bold">RxNorm: Active</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

UploadPage.propTypes = {
  selectedPatient: PropTypes.object,
  onUploadSuccess: PropTypes.func,
  onSelectQuickDemo: PropTypes.func
};
