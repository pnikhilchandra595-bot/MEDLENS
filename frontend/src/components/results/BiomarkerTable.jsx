import React from 'react';
import PropTypes from 'prop-types';
import { Search, Edit3, CheckCircle2, AlertTriangle, HelpCircle, History } from 'lucide-react';
import ProvenanceBadge from '../ProvenanceBadge';
import GlossaryTooltip from '../GlossaryTooltip';

export default function BiomarkerTable({
  results = [],
  searchQuery,
  setSearchQuery,
  onlyAbnormalFilter,
  setOnlyAbnormalFilter,
  selectedResultId,
  onSelectResult,
  onStartCorrection,
  glossary = {}
}) {
  const filteredResults = results.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.test_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.canonical_name && r.canonical_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.loinc_code && r.loinc_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAbnormal = !onlyAbnormalFilter || r.is_abnormal;
    return matchesSearch && matchesAbnormal;
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
      {/* Table Controls */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-slate-900 font-display">
            Normalized Biomarkers ({filteredResults.length} / {results.length})
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold border border-slate-300/60">
            LOINC Standardized
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search analyte or LOINC..."
              className="bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 w-44 sm:w-56 shadow-sm"
            />
          </div>

          {/* Filter Abnormal Toggle */}
          <button
            type="button"
            onClick={() => setOnlyAbnormalFilter(!onlyAbnormalFilter)}
            aria-pressed={onlyAbnormalFilter}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm ${
              onlyAbnormalFilter
                ? 'bg-rose-50 text-rose-700 border-rose-300'
                : 'bg-white text-slate-600 border-slate-300 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Flagged Only
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" role="table">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-mono text-slate-600 uppercase tracking-wider font-bold">
              <th className="py-3 px-4">Test Parameter & LOINC</th>
              <th className="py-3 px-4">Measured Value</th>
              <th className="py-3 px-4">Reference Interval</th>
              <th className="py-3 px-4">Status & Provenance</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  No biomarkers match your search filter.
                </td>
              </tr>
            ) : (
              filteredResults.map((tr) => {
                const isSelected = selectedResultId === tr.id;
                const def = glossary[tr.canonical_name || tr.test_name];
                const auditEntries = tr.audit_trail || tr.audit_history || [];
                const hasAuditTrail = auditEntries.length > 0;

                const handleKeyDown = (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectResult && onSelectResult(tr.id);
                  }
                };

                return (
                  <tr
                    key={tr.id}
                    tabIndex={0}
                    role="row"
                    aria-label={`${tr.canonical_name || tr.test_name} (${tr.test_name}), value ${tr.value} ${tr.unit}`}
                    onClick={() => onSelectResult && onSelectResult(tr.id)}
                    onKeyDown={handleKeyDown}
                    className={`transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                      isSelected
                        ? 'bg-emerald-50/70 hover:bg-emerald-50/90'
                        : tr.is_abnormal
                        ? 'bg-rose-50/40 hover:bg-rose-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Name + LOINC */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900">
                          {tr.canonical_name || tr.test_name}
                        </span>
                        {def && <GlossaryTooltip term={tr.canonical_name || tr.test_name} definition={def} />}
                        {hasAuditTrail && (
                          <span
                            title={`Audited: ${auditEntries.length} verified edit(s)`}
                            className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-semibold"
                          >
                            <History className="w-2.5 h-2.5 text-amber-600" aria-hidden="true" />
                            <span>Audit Log</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>LOINC: {tr.loinc_code || 'Unmapped'}</span>
                        {tr.test_name !== tr.canonical_name && (
                          <span className="text-slate-400">({tr.test_name})</span>
                        )}
                      </div>
                    </td>

                    {/* Measured Value */}
                    <td className="py-3 px-4">
                      <span className={`font-bold font-mono text-sm ${tr.is_abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                        {tr.value}
                      </span>
                      <span className="font-medium text-slate-500 text-[11px] ml-1">
                        {tr.unit}
                      </span>
                    </td>

                    {/* Reference Range */}
                    <td className="py-3 px-4 text-[11px] text-slate-600 font-mono">
                      {tr.ref_low !== null && tr.ref_high !== null ? (
                        <span>{tr.ref_low} – {tr.ref_high} {tr.unit}</span>
                      ) : (
                        <span className="text-slate-400">{tr.ref_raw || 'Unspecified by Lab'}</span>
                      )}
                    </td>

                    {/* Status & Provenance */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tr.is_abnormal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" aria-hidden="true" />
                            Outside Bounds
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <CheckCircle2 className="w-3 h-3 text-teal-600" aria-hidden="true" />
                            Within Reference
                          </span>
                        )}
                        <ProvenanceBadge source={tr.source || 'Extracted from report'} />
                      </div>
                    </td>

                    {/* HITL Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartCorrection(tr);
                        }}
                        aria-label={`Correct value for ${tr.test_name}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-sm"
                      >
                        <Edit3 className="w-3 h-3 text-amber-600" aria-hidden="true" />
                        <span>Correct</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

BiomarkerTable.propTypes = {
  results: PropTypes.arrayOf(PropTypes.object).isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  onlyAbnormalFilter: PropTypes.bool.isRequired,
  setOnlyAbnormalFilter: PropTypes.func.isRequired,
  selectedResultId: PropTypes.string,
  onSelectResult: PropTypes.func,
  onStartCorrection: PropTypes.func.isRequired,
  glossary: PropTypes.object
};
