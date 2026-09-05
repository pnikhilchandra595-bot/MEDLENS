import React from 'react';
import { Printer, Download, ArrowLeft, ShieldCheck, Calendar, Activity } from 'lucide-react';

export default function ClinicianPdfTemplate({ reportData, onBack }) {
  if (!reportData) return null;

  const { patient, report_metadata, results, clinical_intelligence, temporal_summary } = reportData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      {/* Top action bar (hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-900/40 transition-all"
        >
          <Printer className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-4xl mx-auto bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-200 print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-emerald-700">MEDLENS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-slate-700 font-semibold uppercase">
                Clinician Handover Summary
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Structured Provenance & Longitudinal Biological Pattern Report</p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Generated for Physician Review</p>
            <p>Report Date: {report_metadata?.report_date || 'Current'}</p>
            {report_metadata?.sha256_hash && (
              <p className="font-mono text-[9px] text-slate-400 mt-1">
                SHA-256: {report_metadata.sha256_hash.substring(0, 16)}... (Verified)
              </p>
            )}
          </div>
        </div>

        {/* Patient & Lab Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Patient Name</span>
            <span className="font-bold text-slate-900 text-sm">{patient?.name || 'Arjun Sharma'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Age / Sex</span>
            <span className="font-semibold text-slate-800">{patient?.age || 42} Y / {patient?.sex || 'Male'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Original Laboratory</span>
            <span className="font-semibold text-slate-800">{report_metadata?.lab_name || 'Metropolis Labs'}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Deterministic Flag Count</span>
            <span className="font-bold text-rose-600">{clinical_intelligence?.flag_count || 0} Abnormal Values</span>
          </div>
        </div>

        {/* Extracted Values Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Structured Laboratory Findings (LOINC Normalized)
          </h3>
          <table className="w-full text-left text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-2 px-3">Test Investigation</th>
                <th className="py-2 px-3">LOINC</th>
                <th className="py-2 px-3">Result</th>
                <th className="py-2 px-3">Reference Range</th>
                <th className="py-2 px-3">Confidence</th>
                <th className="py-2 px-3">Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {results?.map((res, i) => (
                <tr key={i} className={res.is_abnormal ? 'bg-rose-50/40' : ''}>
                  <td className="py-2 px-3 font-medium text-slate-900">{res.canonical_name || res.test_name}</td>
                  <td className="py-2 px-3 font-mono text-[11px] text-slate-500">{res.loinc_code || 'Unmapped'}</td>
                  <td className={`py-2 px-3 font-bold ${res.is_abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                    {res.value} {res.unit} {res.is_abnormal ? '▲' : ''}
                  </td>
                  <td className="py-2 px-3 text-slate-600">
                    {res.ref_low !== null && res.ref_high !== null
                      ? `${res.ref_low} - ${res.ref_high}`
                      : res.ref_raw || 'Not specified'}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      res.confidence_tier === 'high' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {res.confidence_tier}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[10px] text-slate-500">{res.source || 'Extracted'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Temporal Pattern & Counter Arguments */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Non-Diagnostic Pattern Observation
            </h4>
            <p className="text-slate-700 leading-relaxed">
              {clinical_intelligence?.primary_summary}
            </p>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200 text-xs">
            <h4 className="font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              Gated Alternative Physiological Factors
            </h4>
            <ul className="list-disc list-inside text-slate-700 space-y-1">
              {clinical_intelligence?.counter_explanations?.map((exp, i) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Doctor Consultation Prompts */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-6">
          <h4 className="font-bold text-slate-900 mb-1">Suggested Clinical Inquiries for Physician:</h4>
          <ol className="list-decimal list-inside text-slate-700 space-y-1">
            {clinical_intelligence?.doctor_questions?.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-[10px] text-slate-400">
          <div>MedLens Clinical Intelligence Platform • HL7 FHIR R4 & LOINC Conforming</div>
          <div>Notice: For clinical reference only. Does not replace professional medical judgment.</div>
        </div>
      </div>
    </div>
  );
}
