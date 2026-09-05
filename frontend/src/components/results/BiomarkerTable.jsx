import React from 'react';
import PropTypes from 'prop-types';
import { Search, Edit3, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Controls */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-slate-100">
            Normalized Biomarkers ({filteredResults.length} / {results.length})
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            LOINC Standardized
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search analyte or LOINC..."
              className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Filter Abnormal Toggle */}
          <button
            type="button"
            onClick={() => setOnlyAbnormalFilter(!onlyAbnormalFilter)}
            aria-pressed={onlyAbnormalFilter}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              onlyAbnormalFilter
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200'
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
            <tr className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Test Parameter & LOINC</th>
              <th className="py-3 px-4">Measured Value</th>
              <th className="py-3 px-4">Reference Interval</th>
              <th className="py-3 px-4">Status & Provenance</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
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

                return (
                  <tr
                    key={tr.id}
                    onClick={() => onSelectResult && onSelectResult(tr.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/40 hover:bg-emerald-950/50'
                        : tr.is_abnormal
                        ? 'bg-rose-950/10 hover:bg-slate-800/40'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Name + LOINC */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-200">
                          {tr.canonical_name || tr.test_name}
                        </span>
                        {def && <GlossaryTooltip term={tr.canonical_name || tr.test_name} definition={def} />}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>LOINC: {tr.loinc_code || 'Unmapped'}</span>
                        {tr.test_name !== tr.canonical_name && (
                          <span className="text-slate-600">({tr.test_name})</span>
                        )}
                      </div>
                    </td>

                    {/* Measured Value */}
                    <td className="py-3 px-4">
                      <span className={`font-bold font-mono text-sm ${tr.is_abnormal ? 'text-rose-400' : 'text-slate-100'}`}>
                        {tr.value}
                      </span>
                      <span className="font-normal text-slate-400 text-[11px] ml-1">
                        {tr.unit}
                      </span>
                    </td>

                    {/* Reference Range */}
                    <td className="py-3 px-4 text-[11px] text-slate-300 font-mono">
                      {tr.ref_low !== null && tr.ref_high !== null ? (
                        <span>{tr.ref_low} – {tr.ref_high} {tr.unit}</span>
                      ) : (
                        <span className="text-slate-500">{tr.ref_raw || 'Unspecified by Lab'}</span>
                      )}
                    </td>

                    {/* Status & Provenance */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {tr.is_abnormal ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <AlertTriangle className="w-3 h-3 text-rose-400" aria-hidden="true" />
                            Outside Bounds
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" aria-hidden="true" />
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" aria-hidden="true" />
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
