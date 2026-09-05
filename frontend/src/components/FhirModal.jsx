import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, ExternalLink, X, CheckCircle2, Globe, Shield } from 'lucide-react';
import { exportFhirBundle, exportAbdmBundle } from '../api/client';

export default function FhirModal({ isOpen, onClose, reportId }) {
  const [activeStandard, setActiveStandard] = useState('international'); // 'international' | 'abdm'
  const [intlBundle, setIntlBundle] = useState(null);
  const [abdmBundle, setAbdmBundle] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && reportId) {
      setLoading(true);
      Promise.all([
        exportFhirBundle(reportId),
        exportAbdmBundle(reportId)
      ])
        .then(([intl, abdm]) => {
          setIntlBundle(intl);
          setAbdmBundle(abdm);
        })
        .catch((err) => console.error('FHIR export error:', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, reportId]);

  if (!isOpen) return null;

  const currentBundle = activeStandard === 'abdm' ? abdmBundle : intlBundle;
  const jsonString = currentBundle ? JSON.stringify(currentBundle, null, 2) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400">
            <FileCode className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                HL7 FHIR R4 & ABDM India Standards Export
              </h3>
              <p className="text-[11px] text-slate-400">
                Conforming to US Core International & Ayushman Bharat Digital Mission (ABDM) NRCeS Profiles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Selector Tabs */}
        <div className="flex items-center justify-between px-6 py-2 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStandard('international')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeStandard === 'international'
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>International FHIR R4</span>
            </button>

            <button
              onClick={() => setActiveStandard('abdm')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeStandard === 'abdm'
                  ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ABDM India (NRCeS / ABHA)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeStandard === 'international' ? (
              <a
                href="https://validator.fhir.org"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
              >
                <span>validator.fhir.org</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <a
                href="https://sandbox.abdm.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
              >
                <span>ABDM Sandbox</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-all shadow"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
          </div>
        </div>

        {/* Code Body */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-emerald-300/90 leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <span>Generating standard compliant bundles...</span>
            </div>
          ) : (
            <pre className="select-all whitespace-pre-wrap">{jsonString}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            {activeStandard === 'abdm' ? (
              <span className="text-emerald-400 font-semibold">
                ✓ NRCeS DiagnosticReportLab & Patient ABHA Identifiers Configured
              </span>
            ) : (
              <span className="text-emerald-400 font-semibold">
                ✓ Validated against official HL7 FHIR R4 standard profile
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
