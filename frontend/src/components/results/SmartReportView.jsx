import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronUp, Filter, Search, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import SmartAnalyteCard from './SmartAnalyteCard';

/**
 * SmartReportView
 * Clinical Smart Report view organized by categorized test panels (CBC, Thyroid, LFT, Lipid, KFT, etc.)
 * with "Out of Range Only" toggle, parameter statistics bar, and accordion sections matching clinical apps.
 */
export default function SmartReportView({
  reportData,
  selectedResultId,
  onSelectResult,
  onStartCorrection,
  glossary = {}
}) {
  const [outOfRangeOnly, setOutOfRangeOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track expanded category accordions (set of category names)
  const [expandedCategories, setExpandedCategories] = useState(() => {
    return new Set(['Complete Blood Count (CBC) Test', 'Thyroid Profile Total', 'Lipid Profile Test']);
  });

  const results = reportData?.results || [];

  // Categorize results into panels
  const categorizedData = useMemo(() => {
    const groups = {};

    results.forEach((res) => {
      const cat = res.category || 'General Laboratory Panel';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(res);
    });

    return groups;
  }, [results]);

  // Compute overall counts
  const totalCount = results.length;
  const outOfRangeCount = results.filter(r => r.is_abnormal).length;
  const inRangeCount = totalCount - outOfRangeCount;

  // Filtered categories and analytes
  const filteredCategories = useMemo(() => {
    const output = {};

    Object.entries(categorizedData).forEach(([catName, items]) => {
      let filteredItems = items;

      if (outOfRangeOnly) {
        filteredItems = filteredItems.filter(item => item.is_abnormal);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filteredItems = filteredItems.filter(
          item =>
            item.test_name?.toLowerCase().includes(q) ||
            item.canonical_name?.toLowerCase().includes(q) ||
            item.loinc_code?.toLowerCase().includes(q) ||
            catName.toLowerCase().includes(q)
        );
      }

      if (filteredItems.length > 0) {
        output[catName] = filteredItems;
      }
    });

    return output;
  }, [categorizedData, outOfRangeOnly, searchQuery]);

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCategories(new Set(Object.keys(categorizedData)));
  };

  const collapseAll = () => {
    setExpandedCategories(new Set());
  };

  const reportDateFormatted = reportData?.report_metadata?.report_date
    ? new Date(reportData.report_metadata.report_date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '25th Aug 2026';

  return (
    <div className="space-y-6">
      {/* Subheader Matching Screenshot #1 & #4 */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        {/* Left: Report Date */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Report Date:</span>
          <span className="text-sm font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            {reportDateFormatted}
          </span>
        </div>

        {/* Right: Out Of Range Only Switch Toggle */}
        <div className="flex items-center gap-3">
          <label htmlFor="out-of-range-toggle" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
            Out Of Range Only
          </label>
          <button
            id="out-of-range-toggle"
            type="button"
            role="switch"
            aria-checked={outOfRangeOnly}
            onClick={() => setOutOfRangeOnly(!outOfRangeOnly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white shadow-2xs ${
              outOfRangeOnly ? 'bg-rose-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                outOfRangeOnly ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Parameter Stats Bar Matching Screenshot #1 */}
      <div className="bg-white border border-slate-200/90 rounded-2xl py-3.5 px-6 flex items-center justify-center gap-6 text-xs sm:text-sm font-bold tracking-wide shadow-sm">
        <div className="flex items-center gap-2 text-teal-700">
          <CheckCircle2 className="w-4 h-4 text-teal-600" aria-hidden="true" />
          <span>In Range: <span className="font-extrabold">{inRangeCount} parameters</span></span>
        </div>

        <span className="text-slate-300 font-normal">|</span>

        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-4 h-4 text-rose-600" aria-hidden="true" />
          <span>Out Of Range: <span className="font-extrabold">{outOfRangeCount} parameters</span></span>
        </div>
      </div>

      {/* Search & Collapse Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search biomarkers (e.g. Hemoglobin, TSH, Iron)..."
            className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search query"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Expand All Panels
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold border border-slate-200 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Categorized Test Panel Accordions Matching Screenshot #4 */}
      <div className="space-y-4">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-sm">
            <Layers className="w-10 h-10 text-slate-400 mx-auto" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-800">No Parameters Match Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {outOfRangeOnly
                ? 'All parameters in this report are within physiological reference ranges.'
                : 'Try adjusting your search keyword or clearing the filter.'}
            </p>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([categoryName, items]) => {
            const isCategoryExpanded = expandedCategories.has(categoryName);
            const categoryAbnormalCount = items.filter(i => i.is_abnormal).length;

            return (
              <div
                key={categoryName}
                className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Accordion Panel Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(categoryName)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left bg-slate-50/70 hover:bg-slate-100/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-2xl"
                  aria-expanded={isCategoryExpanded}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base sm:text-lg font-extrabold text-slate-900 font-display">
                      {categoryName}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 border border-slate-300 font-semibold">
                      {items.length} {items.length === 1 ? 'parameter' : 'parameters'}
                    </span>
                    {categoryAbnormalCount > 0 && (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-bold">
                        {categoryAbnormalCount} out of range
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500">
                    {isCategoryExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-600" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-600" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {/* Expanded Category Analyte Cards */}
                {isCategoryExpanded && (
                  <div className="p-4 sm:p-5 pt-3 grid grid-cols-1 gap-4 border-t border-slate-100 bg-slate-50/30">
                    {items.map((result) => (
                      <SmartAnalyteCard
                        key={result.id}
                        result={result}
                        isSelected={selectedResultId === result.id}
                        onSelect={onSelectResult}
                        onStartCorrection={onStartCorrection}
                        glossary={glossary}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

SmartReportView.propTypes = {
  reportData: PropTypes.object,
  selectedResultId: PropTypes.string,
  onSelectResult: PropTypes.func,
  onStartCorrection: PropTypes.func,
  glossary: PropTypes.object
};
