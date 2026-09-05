import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Sparkles, 
  FileCheck,
  AlertTriangle
} from 'lucide-react';
import { uploadReport, savePatientIntake } from '../api/client';
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
    medications: 'Multivitamin daily'
  });

  const fileInputRef = useRef(null);

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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-modal Vision + Document OCR Grounding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-display">
          Upload & Patient Ingestion Engine
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Ingest lab reports with SHA-256 tamper-evident hashing, honest two-tier confidence ranking, and 3-tier provenance tracking.
        </p>
      </div>

      {/* Quick Demo Pre-load Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          ⚡ Quick Demo Scenarios (One-Click Testing)
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onSelectQuickDemo('arjun')}
            className="p-3 bg-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400">
              1. Multi-Report Timeline (Arjun Sharma)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              3 sequential reports showing TSH & Total Cholesterol correlated upward shift.
            </p>
          </button>

          <button
            onClick={() => onSelectQuickDemo('kavita')}
            className="p-3 bg-slate-800/80 hover:bg-emerald-950/40 hover:border-emerald-500/40 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400">
              2. Missing Reference Range (Kavita Patel)
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
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
                active_name: selectedPatient?.name || 'Arjun Sharma',
                message: "Report name 'Priya Sharma' does not match active profile 'Arjun Sharma' (45% match). Confirm before saving."
              });
            }}
            className="p-3 bg-slate-800/80 hover:bg-amber-950/40 hover:border-amber-500/40 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <div className="font-semibold text-xs text-slate-200 group-hover:text-amber-400">
              3. Family Profile Mismatch Test
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Tests blocking safety confirmation for family member report cross-talk.
            </p>
          </button>
        </div>
      </div>

      {/* Main 2-Column Grid: Upload + Patient Intake */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Dropzone & Consent */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
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
                  ? 'border-emerald-500/60 bg-emerald-500/5' 
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40'
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
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400">
                  {file ? <FileCheck className="w-6 h-6 text-emerald-400" /> : <UploadCloud className="w-6 h-6" />}
                </div>
                {file ? (
                  <div>
                    <span className="font-semibold text-emerald-400 text-sm block">{file.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {(file.size / 1024).toFixed(1)} KB • Ready for extraction
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-slate-200 text-sm block">
                      Click to upload or drag & drop report
                    </span>
                    <span className="text-xs text-slate-500">PDF, JPG, PNG (up to 15MB)</span>
                  </div>
                )}
              </div>
            </div>

            {/* DPDP Consent Gating (Phase 4.5) */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent-check"
                  checked={consentConfirmed}
                  onChange={(e) => setConsentConfirmed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900 cursor-pointer"
                />
                <label htmlFor="consent-check" className="text-xs text-slate-300 leading-relaxed cursor-pointer select-none">
                  <strong className="text-emerald-400">DPDP Compliance & Data Consent:</strong> I explicitly consent to the extraction and temporal analysis of this clinical laboratory report. I understand my data remains encrypted and I can trigger irreversible erasure anytime under the Digital Personal Data Protection Act.
                </label>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name Mismatch Safety Modal / Banner */}
            {mismatchWarning && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Profile Mismatch Warning (Improvisation #7)</span>
                </div>
                <p>{mismatchWarning.message}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMismatchWarning(null)}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Confirm & Proceed Anyway
                  </button>
                  <button
                    onClick={() => { setFile(null); setMismatchWarning(null); }}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
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
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-900/40 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'Processing Document & Grounding Bboxes...' : 'Ingest & Analyze Report'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Patient Information Intake Form (Phase 1.5) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Patient Information Intake
              </h2>
              <ProvenanceBadge source="Patient-reported" size="xs" />
            </div>
            <p className="text-xs text-slate-400">
              Supplements report extraction with patient-reported medical context for inconsistency detection.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Age</label>
                <input
                  type="number"
                  value={intake.age}
                  onChange={(e) => setIntake({ ...intake, age: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Biological Sex</label>
                <select
                  value={intake.sex}
                  onChange={(e) => setIntake({ ...intake, sex: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Reported Symptoms (Free Text)</label>
              <textarea
                rows={2}
                value={intake.symptoms}
                onChange={(e) => setIntake({ ...intake, symptoms: e.target.value })}
                placeholder="e.g., Fatigue, unexplained weight changes, joint stiffness..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Known Diagnosed Conditions</label>
              <input
                type="text"
                value={intake.conditions}
                onChange={(e) => setIntake({ ...intake, conditions: e.target.value })}
                placeholder="e.g., No diabetes, hypertension..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Allergies</label>
                <input
                  type="text"
                  value={intake.allergies}
                  onChange={(e) => setIntake({ ...intake, allergies: e.target.value })}
                  placeholder="e.g., Penicillin, Sulfa..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Current Medications</label>
                <input
                  type="text"
                  value={intake.medications}
                  onChange={(e) => setIntake({ ...intake, medications: e.target.value })}
                  placeholder="e.g., Atorvastatin 10mg..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Automatic conflict check will run upon upload</span>
              <span className="text-emerald-400 font-mono">Status: Ready</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
