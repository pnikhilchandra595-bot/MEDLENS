import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronUp,
  BarChart2,
  Table,
  Info,
  Edit3,
  CheckCircle2,
  AlertCircle,
  History,
  ShieldCheck,
  UserCheck,
  Clock
} from 'lucide-react';
import BiomarkerRangeGauge from './BiomarkerRangeGauge';
import BiomarkerHistoryGraph from './BiomarkerHistoryGraph';
import GlossaryTooltip from '../GlossaryTooltip';
import ProvenanceBadge from '../ProvenanceBadge';

/**
 * SmartAnalyteCard
 * High-fidelity clinical biomarker card matching smart report designs:
 * - Dynamic value display with status coloring
 * - 3-zone visual gauge bar
 * - Collapsible "Compare Readings" accordion with dual Graph & Table comparative views
 * - Expandable "Edit & Verification Audit Trail" for HITL auditability
 * - Human-in-the-loop correction trigger
 * - Complete keyboard accessibility & high-contrast focus rings
 */
export default function SmartAnalyteCard({
  result,
  isSelected = false,
  onSelect,
  onStartCorrection,
  glossary = {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'table'
  const [isAuditExpanded, setIsAuditExpanded] = useState(false);

  const hasHistory = result.history && result.history.length > 0;
  const auditEntries = result.audit_trail || result.audit_history || [];
  const hasAuditTrail = auditEntries.length > 0;
  const isAbn = result.is_abnormal || false;
  const isBorder = result.is_borderline || false;

  const statusColorClass = isAbn
    ? 'text-rose-400'
    : isBorder
    ? 'text-amber-400'
    : 'text-teal-400';

  const handleCardKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect && onSelect(result.id);
    }
  };

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={`Biomarker card for ${result.test_name}`}
      onKeyDown={handleCardKeyDown}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
        isSelected
          ? 'bg-slate-900/90 border-emerald-500/80 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30'
          : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70'
      }`}
    >
      {/* Top Main Section */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Analyte Name & Metadata */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => onSelect && onSelect(result.id)}
                className="text-base sm:text-lg font-bold text-slate-100 hover:text-emerald-400 transition-colors text-left font-display focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
              >
                {result.test_name}
              </button>

              <GlossaryTooltip
                term={result.canonical_name || result.test_name}
                definition={glossary[result.canonical_name] || glossary[result.test_name]}
              />

              {result.loinc_code && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                  LOINC {result.loinc_code}
                </span>
              )}

              {hasAuditTrail && (
                <button
                  type="button"
                  onClick={() => setIsAuditExpanded(!isAuditExpanded)}
                  aria-expanded={isAuditExpanded}
                  className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                >
                  <History className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  <span>Audit History ({auditEntries.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <ProvenanceBadge
                source={result.source}
                confidenceTier={result.confidence_tier}
                isGrounded={result.is_grounded}
              />
            </div>
          </div>

          {/* Right: Measured Value & Reference Range */}
          <div className="text-right flex-shrink-0">
            <div className={`text-xl sm:text-2xl font-extrabold tracking-tight font-mono ${statusColorClass}`}>
              {result.value}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-0.5">
              {result.ref_raw || (result.ref_low !== null && result.ref_high !== null ? `${result.ref_low} - ${result.ref_high} ${result.unit}` : result.unit)}
            </div>
          </div>
        </div>

        {/* Visual 3-Zone Range Bar Gauge */}
        <div className="mt-2">
          <BiomarkerRangeGauge
            value={result.value}
            unit={result.unit}
            refLow={result.ref_low}
            refHigh={result.ref_high}
            refRaw={result.ref_raw}
            isAbnormal={isAbn}
            isBorderline={isBorder}
          />
        </div>

        {/* Expandable Audit Trail History Drawer */}
        {hasAuditTrail && isAuditExpanded && (
          <div className="mt-3 p-3.5 bg-slate-950/80 rounded-xl border border-amber-500/30 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Verification & Correction Audit Trail</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                Immutable Ledger
              </span>
            </div>

            <div className="space-y-2 pt-1 divide-y divide-slate-800">
              {auditEntries.map((entry, idx) => (
                <div key={idx} className="pt-2 first:pt-0 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-300">
                      <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
                      {entry.changed_at ? new Date(entry.changed_at).toLocaleString() : 'Recent timestamp'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-300/90 font-medium">
                      <UserCheck className="w-3 h-3" aria-hidden="true" />
                      {entry.changed_by || 'Verified Pathologist'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-slate-400 line-through">
                      Original: {entry.old_value !== undefined ? entry.old_value : result.value} {result.unit}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      ➔ Corrected: {entry.new_value || entry.corrected_value} {result.unit}
                    </span>
                  </div>

                  {entry.reason && (
                    <div className="text-[11px] text-slate-300 bg-slate-900/80 p-2 rounded border border-slate-800 italic">
                      &quot;{entry.reason}&quot;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compare Readings Accordion Header */}
      {hasHistory && (
        <div className="border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between px-4 sm:px-5 py-2.5">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
              aria-expanded={isExpanded}
            >
              <BarChart2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Compare Readings</span>
              <span className="text-[11px] font-mono text-slate-500">
                ({result.history.length} {result.history.length === 1 ? 'reading' : 'readings'})
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" aria-hidden="true" />
              )}
            </button>

            {/* Sub-actions when expanded */}
            {isExpanded && (
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('graph')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    viewMode === 'graph'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Graph</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                    viewMode === 'table'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Table</span>
                </button>
              </div>
            )}
          </div>

          {/* Expanded Content: Graph or Historical Table */}
          {isExpanded && (
            <div className="p-4 sm:p-5 pt-1 space-y-4 animate-in fade-in">
              {viewMode === 'graph' ? (
                <BiomarkerHistoryGraph
                  testName={result.test_name}
                  unit={result.unit}
                  history={result.history}
                  refLow={result.ref_low}
                  refHigh={result.ref_high}
                />
              ) : (
                /* Historical Comparison Table Matching Photo 1 */
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60 font-semibold">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-4 text-center">Value</th>
                        <th className="py-2.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1">
                            Normal Range <Info className="w-3 h-3 text-slate-500" aria-hidden="true" />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {result.history.map((h, idx) => {
                        const rowAbn = h.is_abnormal || (result.ref_low !== null && h.value < result.ref_low) || (result.ref_high !== null && h.value > result.ref_high);
                        const rowBorder = h.is_borderline;
                        return (
                          <tr
                            key={idx}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              idx === 0 ? 'bg-emerald-500/5 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 font-medium text-slate-200 flex items-center gap-2">
                              <span>{h.date}</span>
                              {idx === 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                                  Current
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center font-mono font-bold">
                              <span
                                className={
                                  rowAbn
                                    ? 'text-rose-400'
                                    : rowBorder
                                    ? 'text-amber-400'
                                    : 'text-teal-400'
                                }
                              >
                                {h.value} {result.unit}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                              {h.ref_raw || result.ref_raw || (result.ref_low !== null && result.ref_high !== null ? `${result.ref_low} - ${result.ref_high} ${result.unit}` : '—')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* HITL Verification Button */}
              {onStartCorrection && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => onStartCorrection(result)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded px-2 py-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Verify or Correct Value</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

SmartAnalyteCard.propTypes = {
  result: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  onStartCorrection: PropTypes.func,
  glossary: PropTypes.object
};
