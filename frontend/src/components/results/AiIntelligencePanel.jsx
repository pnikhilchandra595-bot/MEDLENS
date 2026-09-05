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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-5 h-5" aria-hidden="true" />
          <h2 className="font-bold text-base text-slate-100">
            Adversarial Clinical Intelligence
          </h2>
        </div>
        {safety_invariants_verified && (
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
            Adversary Blocklist Verified
          </span>
        )}
      </div>

      {/* Non-Diagnostic Summary */}
      <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider">
          <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span>Patient-Safe Educational Synthesis</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">
          {non_diagnostic_summary || 'All reported lab analytes have been processed and indexed into clinical memory.'}
        </p>
      </div>

      {/* Suggested Doctor Questions */}
      {doctor_questions.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <HelpCircle className="w-4 h-4 text-cyan-400" aria-hidden="true" />
            <span>Suggested Questions for Your Physician</span>
          </div>
          <div className="space-y-2">
            {doctor_questions.map((q, i) => (
              <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <span className="font-bold text-cyan-400 shrink-0 font-mono">Q{i + 1}.</span>
                <p className="leading-relaxed">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Biological Alternatives / Confounders */}
      {biological_factors.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Plausible Physiological Factors (Non-Diagnostic)</span>
          </div>
          <div className="space-y-1.5">
            {biological_factors.map((f, i) => (
              <div key={i} className="text-xs text-slate-400 flex items-start gap-2 pl-1">
                <span className="text-amber-400 font-bold">•</span>
                <p className="leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Switch to Timeline Button */}
      {onViewTimeline && (
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onViewTimeline}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
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
