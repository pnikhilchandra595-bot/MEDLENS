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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hitl-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Edit3 className="w-5 h-5" aria-hidden="true" />
            <h3 id="hitl-modal-title" className="font-bold text-slate-100 text-sm">
              Correct Analyte Value (HITL)
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close correction modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 text-xs">
          <div className="font-semibold text-slate-200">
            {editingResult.canonical_name || editingResult.test_name}
          </div>
          <div className="text-slate-400">
            Extracted Value: <span className="font-mono text-amber-400 font-bold">{editingResult.value} {editingResult.unit}</span>
          </div>
          <div className="text-[10px] text-slate-500">
            LOINC: {editingResult.loinc_code || 'Unmapped'} • Reference: {editingResult.ref_low} – {editingResult.ref_high} {editingResult.unit}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="hitl-corrected-value" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Verified Numeric Value
            </label>
            <input
              id="hitl-corrected-value"
              type="number"
              step="any"
              value={correctedValInput}
              onChange={(e) => setCorrectedValInput(e.target.value)}
              placeholder="e.g. 5.8"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="hitl-reason-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Correction Reason (Clinical Audit Log)
            </label>
            <input
              id="hitl-reason-input"
              type="text"
              value={correctionReasonInput}
              onChange={(e) => setCorrectionReasonInput(e.target.value)}
              placeholder="e.g. OCR smudge misread 5.8 as 58"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              Updating will append an immutable entry to the audit trail and tag the result provenance as <strong>'Human-corrected'</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSavingCorrection || !correctedValInput}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
