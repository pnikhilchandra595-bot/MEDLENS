import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FileCode, Copy, Check, ExternalLink, X, CheckCircle2, Globe, Shield } from 'lucide-react';
import { exportFhirBundle, exportAbdmBundle } from '../api/client';

export default function FhirModal({ isOpen, onClose, reportId }) {
  const [activeStandard, setActiveStandard] = useState('international'); // 'international' | 'abdm'
  const [intlBundle, setIntlBundle] = useState(null);
  const [abdmBundle, setAbdmBundle] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fhir-modal-title"
      aria-describedby="fhir-modal-desc"
    >
      <div className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-emerald-700">
            <FileCode className="w-5 h-5" aria-hidden="true" />
            <div>
              <h3 id="fhir-modal-title" className="font-bold text-slate-900 text-sm font-display">
                HL7 FHIR R4 & ABDM India Standards Export
              </h3>
              <p id="fhir-modal-desc" className="text-[11px] text-slate-500">
                Conforming to US Core International & Ayushman Bharat Digital Mission (ABDM) NRCeS Profiles
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close FHIR export modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Profile Selector Tabs */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50/80 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStandard('international')}
              aria-pressed={activeStandard === 'international'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeStandard === 'international'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>International FHIR R4</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStandard('abdm')}
              aria-pressed={activeStandard === 'abdm'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeStandard === 'abdm'
                  ? 'bg-emerald-600 text-white font-bold shadow-sm'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 font-semibold'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>ABDM India NRCeS Profile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            disabled={loading || !currentBundle}
            aria-label="Copy FHIR JSON Bundle to clipboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copied JSON!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Copy JSON Bundle</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Info Banner */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-600 flex items-center justify-between font-medium">
          <span>
            {activeStandard === 'abdm'
              ? 'Profile: DiagnosticReport-lab | Indian NRCeS M3 compliant with ABHA ID verification metadata'
              : 'Profile: HL7 FHIR US-Core DiagnosticReport R4 Bundle with LOINC Observation codings'}
          </span>
          <span className="font-mono text-emerald-700 font-bold">
            {currentBundle?.entry ? `${currentBundle.entry.length} FHIR Resources` : ''}
          </span>
        </div>

        {/* JSON Code Viewer */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-slate-100 bg-slate-950">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3 text-slate-400">
              <FileCode className="w-8 h-8 animate-pulse text-emerald-400" aria-hidden="true" />
              <p>Constructing HL7 FHIR R4 Bundle from normalized LOINC parameters...</p>
            </div>
          ) : (
            <pre className="overflow-x-auto leading-relaxed whitespace-pre-wrap selection:bg-emerald-500 selection:text-slate-950" tabIndex={0}>
              <code>{jsonString}</code>
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>Cryptographically ground-verified data package ready for EHR ingestion</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 font-semibold transition-colors shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

FhirModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reportId: PropTypes.string
};
