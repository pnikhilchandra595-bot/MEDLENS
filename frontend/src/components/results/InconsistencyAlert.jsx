import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function InconsistencyAlert({ inconsistencies = [] }) {
  if (!inconsistencies || inconsistencies.length === 0) return null;

  return (
    <div
      className="bg-amber-50 border border-amber-300 rounded-2xl p-5 space-y-3 animate-in fade-in shadow-sm"
      role="alert"
      aria-label="Clinical Inconsistencies Detected"
    >
      <div className="flex items-center gap-2.5 text-amber-800">
        <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" aria-hidden="true" />
        <h3 className="font-bold text-sm text-slate-900">
          Clinical Inconsistencies Detected ({inconsistencies.length})
        </h3>
      </div>
      <p className="text-xs text-amber-900 leading-relaxed font-medium">
        The system cross-referenced patient-reported history with extracted lab values and identified potential conflicts for clinician review:
      </p>
      <div className="space-y-2 pt-1">
        {inconsistencies.map((inc, i) => (
          <div key={i} className="bg-white border border-amber-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2 shadow-2xs">
            <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-bold text-amber-800">[{inc.field || inc.type || 'Alert'}]:</span> {inc.message || inc.description}
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
