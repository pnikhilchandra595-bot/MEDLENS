import React from 'react';
import PropTypes from 'prop-types';
import { Edit3, Check, X, ShieldAlert } from 'lucide-react';

export default function HitlCorrectionModal({
  editingResult,
  correctedValInput,
  setCorrectedValInput,
  correctionReasonInput,
  setCorrectionReasonInput,
  isSavingCorrection,
  onSave,
  onCancel
}) {
  if (!editingResult) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hitl-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 text-amber-700">
            <Edit3 className="w-5 h-5" aria-hidden="true" />
            <h3 id="hitl-modal-title" className="font-bold text-slate-900 text-sm font-display">
              Correct Analyte Value (HITL)
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close correction modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
          <div className="font-bold text-slate-900">
            {editingResult.canonical_name || editingResult.test_name}
          </div>
          <div className="text-slate-600">
            Extracted Value: <span className="font-mono text-amber-700 font-bold">{editingResult.value} {editingResult.unit}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            LOINC: {editingResult.loinc_code || 'Unmapped'} • Reference: {editingResult.ref_low} – {editingResult.ref_high} {editingResult.unit}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="hitl-corrected-value" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Verified Numeric Value
            </label>
            <input
              id="hitl-corrected-value"
              type="number"
              step="any"
              value={correctedValInput}
              onChange={(e) => setCorrectedValInput(e.target.value)}
              placeholder="e.g. 5.8"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm text-slate-900 font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <div>
            <label htmlFor="hitl-reason-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Correction Reason (Clinical Audit Log)
            </label>
            <input
              id="hitl-reason-input"
              type="text"
              value={correctionReasonInput}
              onChange={(e) => setCorrectionReasonInput(e.target.value)}
              placeholder="e.g. OCR smudge misread 5.8 as 58"
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Updating will append an immutable entry to the audit trail and tag the result provenance as <strong>'Human-corrected'</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSavingCorrection || !correctedValInput}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-700/20 disabled:opacity-50"
          >
            {isSavingCorrection ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Save Correction</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

HitlCorrectionModal.propTypes = {
  editingResult: PropTypes.object,
  correctedValInput: PropTypes.string.isRequired,
  setCorrectedValInput: PropTypes.func.isRequired,
  correctionReasonInput: PropTypes.string.isRequired,
  setCorrectionReasonInput: PropTypes.func.isRequired,
  isSavingCorrection: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};
