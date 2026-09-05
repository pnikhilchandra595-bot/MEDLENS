import React from 'react';
import PropTypes from 'prop-types';
import { Sparkles, ShieldCheck, HelpCircle, Activity, TrendingUp } from 'lucide-react';

export default function AiIntelligencePanel({ clinicalIntelligence, onViewTimeline }) {
  if (!clinicalIntelligence) return null;

  const {
    non_diagnostic_summary,
    doctor_questions = [],
    biological_factors = [],
    flag_count = 0,
    safety_invariants_verified = true
  } = clinicalIntelligence;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 text-emerald-700">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <h2 className="font-bold text-base text-slate-900 font-display">
            Adversarial Clinical Intelligence
          </h2>
        </div>
        {safety_invariants_verified && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            Adversary Blocklist Verified
          </span>
        )}
      </div>

      {/* Non-Diagnostic Summary */}
      <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <span>Patient-Safe Educational Synthesis</span>
        </div>
        <p className="text-xs text-slate-800 leading-relaxed font-normal">
          {non_diagnostic_summary || 'All reported lab analytes have been processed and indexed into clinical memory.'}
        </p>
      </div>

      {/* Suggested Doctor Questions */}
      {doctor_questions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-cyan-600" aria-hidden="true" />
            <span>Suggested Questions for Your Physician</span>
          </div>
          <div className="space-y-2">
            {doctor_questions.map((q, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 flex items-start gap-2.5 shadow-sm">
                <span className="font-bold text-cyan-700 shrink-0 font-mono">Q{i + 1}.</span>
                <p className="leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biological Alternatives / Confounders */}
      {biological_factors.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-600" aria-hidden="true" />
            <span>Plausible Physiological Factors (Non-Diagnostic)</span>
          </div>
          <div className="space-y-1.5">
            {biological_factors.map((f, i) => (
              <div key={i} className="text-xs text-slate-700 flex items-start gap-2 pl-1">
                <span className="text-amber-600 font-bold">•</span>
                <p className="leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Switch to Timeline Button */}
      {onViewTimeline && (
        <div className="pt-2 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onViewTimeline}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all border border-slate-300 shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>View Longitudinal Trajectory Graph →</span>
          </button>
        </div>
      )}
    </div>
  );
}

AiIntelligencePanel.propTypes = {
  clinicalIntelligence: PropTypes.object,
  onViewTimeline: PropTypes.func
};
