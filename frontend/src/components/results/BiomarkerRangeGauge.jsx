import React from 'react';
import PropTypes from 'prop-types';

/**
 * BiomarkerRangeGauge
 * 3-zone visual range bar matching clinical smart report designs:
 * - Low zone (Red/Rose)
 * - Normal range zone (Teal/Emerald)
 * - High zone (Red/Rose)
 * - Position indicator dot with measured value tag
 * - Min/Max reference boundary labels
 */
export default function BiomarkerRangeGauge({
  value,
  unit = '',
  refLow = null,
  refHigh = null,
  refRaw = '',
  isAbnormal = false,
  isBorderline = false
}) {
  // If no numerical range is available (e.g. qualitative "Negative" or unspecified)
  if (refLow === null && refHigh === null) {
    return (
      <div className="py-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Reference: {refRaw || 'Qualitative evaluation'}</span>
          <span className={`px-2 py-0.5 rounded-full font-medium ${isAbnormal ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {isAbnormal ? 'Out of Range' : 'Normal / Negative'}
          </span>
        </div>
      </div>
    );
  }

  const low = refLow !== null ? refLow : (refHigh !== null ? refHigh * 0.5 : 0);
  const high = refHigh !== null ? refHigh : (refLow !== null ? refLow * 1.5 : 100);
  const span = Math.max(high - low, 0.001);

  // Extend the visual gauge window by 25% on both sides
  const gaugeMin = Math.max(0, low - span * 0.35);
  const gaugeMax = high + span * 0.35;
  const gaugeRange = Math.max(gaugeMax - gaugeMin, 0.001);

  // Calculate percentage positions (clamped between 3% and 97%)
  const lowPct = Math.max(8, Math.min(45, ((low - gaugeMin) / gaugeRange) * 100));
  const highPct = Math.max(55, Math.min(92, ((high - gaugeMin) / gaugeRange) * 100));
  
  let valPct = ((value - gaugeMin) / gaugeRange) * 100;
  valPct = Math.max(4, Math.min(96, valPct));

  const isLow = refLow !== null && value < refLow;
  const isHigh = refHigh !== null && value > refHigh;
  const indicatorColor = isAbnormal || isLow || isHigh
    ? 'bg-rose-500 text-rose-300 border-rose-400'
    : isBorderline
    ? 'bg-amber-500 text-amber-300 border-amber-400'
    : 'bg-teal-500 text-teal-200 border-teal-300';

  return (
    <div className="w-full pt-6 pb-2 px-1">
      {/* Indicator Tag above the bar */}
      <div className="relative w-full h-6 mb-1">
        <div
          className="absolute -translate-x-1/2 flex flex-col items-center transition-all duration-300"
          style={{ left: `${valPct}%` }}
        >
          <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap px-1.5 py-0.5 rounded shadow-sm ${
            isAbnormal ? 'text-rose-400' : isBorderline ? 'text-amber-400' : 'text-teal-400'
          }`}>
            {value} {unit}
          </span>
        </div>
      </div>

      {/* 3-Zone Range Bar */}
      <div className="relative h-2 w-full rounded-full bg-slate-800 flex items-center shadow-inner overflow-visible">
        {/* Left Out-of-Range Zone (Red) */}
        <div
          className="h-full bg-rose-500/80 rounded-l-full"
          style={{ width: `${lowPct}%` }}
        />
        
        {/* In-Range Normal Zone (Teal) */}
        <div
          className="h-full bg-teal-500 shadow-sm"
          style={{ width: `${highPct - lowPct}%` }}
        />

        {/* Right Out-of-Range Zone (Red) */}
        <div
          className="h-full bg-rose-500/80 rounded-r-full flex-1"
        />

        {/* Moving Indicator Pin Circle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 shadow-md transition-all duration-300 z-10 ${indicatorColor}`}
          style={{ left: `${valPct}%` }}
        />
      </div>

      {/* Numerical Boundary Labels Below Bar */}
      <div className="relative w-full h-5 mt-1.5 text-[11px] font-medium text-slate-400">
        {refLow !== null && (
          <span
            className="absolute -translate-x-1/2 text-slate-400 font-mono"
            style={{ left: `${lowPct}%` }}
          >
            {refLow}
          </span>
        )}
        {refHigh !== null && (
          <span
            className="absolute -translate-x-1/2 text-slate-400 font-mono"
            style={{ left: `${highPct}%` }}
          >
            {refHigh}
          </span>
        )}
      </div>
    </div>
  );
}

BiomarkerRangeGauge.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  refLow: PropTypes.number,
  refHigh: PropTypes.number,
  refRaw: PropTypes.string,
  isAbnormal: PropTypes.bool,
  isBorderline: PropTypes.bool
};
