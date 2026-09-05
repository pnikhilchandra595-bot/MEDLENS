import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function InconsistencyAlert({ inconsistencies = [] }) {
  if (!inconsistencies || inconsistencies.length === 0) return null;

  return (
    <div
      className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 space-y-3 animate-in fade-in"
      role="alert"
      aria-label="Clinical Inconsistencies Detected"
    >
      <div className="flex items-center gap-2.5 text-amber-400">
        <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
        <h3 className="font-bold text-sm text-slate-100">
          Clinical Inconsistencies Detected ({inconsistencies.length})
        </h3>
      </div>
      <p className="text-xs text-amber-200/90 leading-relaxed">
        The system cross-referenced patient-reported history with extracted lab values and identified potential conflicts for clinician review:
      </p>
      <div className="space-y-2 pt-1">
        {inconsistencies.map((inc, i) => (
          <div key={i} className="bg-slate-900/90 border border-amber-500/20 rounded-xl p-3 text-xs text-slate-300 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-bold text-amber-300">[{inc.field || inc.type || 'Alert'}]:</span> {inc.message || inc.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

InconsistencyAlert.propTypes = {
  inconsistencies: PropTypes.arrayOf(PropTypes.object)
};
