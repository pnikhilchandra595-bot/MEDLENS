import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * BiomarkerHistoryGraph
 * Renders time-series lab progression with shaded Normal Min/Max bands,
 * Borderline transition zones, connecting trend lines, and colored status markers.
 */
export default function BiomarkerHistoryGraph({
  testName = '',
  unit = '',
  history = [],
  refLow = null,
  refHigh = null
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!history || history.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 italic">
        No previous comparative readings available for this parameter.
      </div>
    );
  }

  // Extract values and bounds
  const validHistory = history.filter(h => typeof h.value === 'number' && !isNaN(h.value));
  if (validHistory.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 italic">
        Historical readings are qualitative or non-numeric.
      </div>
    );
  }

  const values = validHistory.map(h => h.value);
  const low = refLow !== null ? refLow : Math.min(...values);
  const high = refHigh !== null ? refHigh : Math.max(...values);

  const dataMin = Math.min(...values, low);
  const dataMax = Math.max(...values, high);
  const rangeSpan = Math.max(dataMax - dataMin, 1);

  // Add 20% vertical padding
  const yMin = Math.max(0, dataMin - rangeSpan * 0.2);
  const yMax = dataMax + rangeSpan * 0.2;
  const yDomain = Math.max(yMax - yMin, 0.001);

  // SVG Coordinate mapping (width 500, height 220, padding left 45, right 30, top 25, bottom 65)
  const width = 480;
  const height = 210;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 60;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const getY = (val) => {
    const norm = (val - yMin) / yDomain;
    return padTop + chartH - norm * chartH;
  };

  const getX = (idx) => {
    if (validHistory.length === 1) return padLeft + chartW / 2;
    return padLeft + (idx / (validHistory.length - 1)) * chartW;
  };

  // Normal and Borderline Zone coordinates
  const yNormalMin = refLow !== null ? getY(refLow) : null;
  const yNormalMax = refHigh !== null ? getY(refHigh) : null;
  const normalSpan = (refHigh !== null && refLow !== null) ? refHigh - refLow : rangeSpan * 0.5;
  
  const yBorderlineTop = refHigh !== null ? getY(refHigh + normalSpan * 0.2) : null;
  const yBorderlineBottom = refLow !== null ? getY(Math.max(0, refLow - normalSpan * 0.2)) : null;

  // Build SVG polyline points string
  const pointsString = validHistory.map((h, i) => `${getX(i)},${getY(h.value)}`).join(' ');

  return (
    <div className="w-full bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
      <div className="text-center text-xs font-semibold text-slate-300 mb-2">
        Comparison graph in {unit || 'units'}
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[340px] select-none"
        >
          <defs>
            {/* Grid line pattern */}
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background Grid */}
          <rect x={padLeft} y={padTop} width={chartW} height={chartH} fill="url(#grid)" />

          {/* Borderline Zone Shading (Light Orange) */}
          {yBorderlineTop !== null && yBorderlineBottom !== null && (
            <rect
              x={padLeft}
              y={Math.min(yBorderlineTop, yBorderlineBottom)}
              width={chartW}
              height={Math.abs(yBorderlineBottom - yBorderlineTop)}
              fill="rgba(245, 158, 11, 0.12)"
              rx="4"
            />
          )}

          {/* Normal In-Range Band Shading (Light Green/Teal) */}
          {yNormalMin !== null && yNormalMax !== null && (
            <rect
              x={padLeft}
              y={Math.min(yNormalMax, yNormalMin)}
              width={chartW}
              height={Math.abs(yNormalMin - yNormalMax)}
              fill="rgba(16, 185, 129, 0.2)"
              rx="2"
            />
          )}

          {/* Normal Max Reference Line */}
          {yNormalMax !== null && (
            <g>
              <line
                x1={padLeft}
                y1={yNormalMax}
                x2={padLeft + chartW}
                y2={yNormalMax}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <text
                x={padLeft + 8}
                y={yNormalMax - 4}
                fill="#10b981"
                fontSize="10"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                Normal Max ({refHigh})
              </text>
            </g>
          )}

          {/* Normal Min Reference Line */}
          {yNormalMin !== null && (
            <g>
              <line
                x1={padLeft}
                y1={yNormalMin}
                x2={padLeft + chartW}
                y2={yNormalMin}
                stroke="#10b981"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                opacity="0.8"
              />
              <text
                x={padLeft + 8}
                y={yNormalMin + 12}
                fill="#10b981"
                fontSize="10"
                fontWeight="600"
                fontFamily="sans-serif"
              >
                Normal Min ({refLow})
              </text>
            </g>
          )}

          {/* Y-Axis Ticks & Labels */}
          <g className="text-[10px] text-slate-500 font-mono">
            <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartH} stroke="rgba(255,255,255,0.1)" />
            <text x={padLeft - 6} y={padTop + 8} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {yMax.toFixed(1)}
            </text>
            <text x={padLeft - 6} y={padTop + chartH / 2} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {((yMax + yMin) / 2).toFixed(1)}
            </text>
            <text x={padLeft - 6} y={padTop + chartH} textAnchor="end" fill="#94a3b8" fontSize="9" fontFamily="monospace">
              {yMin.toFixed(1)}
            </text>
          </g>

          {/* Trend Polyline */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pointsString}
          />

          {/* Data Points */}
          {validHistory.map((h, i) => {
            const cx = getX(i);
            const cy = getY(h.value);
            const isAbn = h.is_abnormal || (refLow !== null && h.value < refLow) || (refHigh !== null && h.value > refHigh);
            const isBorder = h.is_borderline;
            const dotFill = isAbn ? '#f43f5e' : isBorder ? '#f59e0b' : '#10b981';

            return (
              <g
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(h)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Glow ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="7"
                  fill={dotFill}
                  opacity="0.25"
                  className="group-hover:opacity-60 transition-opacity"
                />
                {/* Center marker */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="4.5"
                  fill={dotFill}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />

                {/* X-Axis Date Label */}
                <text
                  x={cx}
                  y={padTop + chartH + 18}
                  textAnchor="end"
                  transform={`rotate(-35, ${cx}, ${padTop + chartH + 18})`}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="500"
                  fontFamily="sans-serif"
                >
                  {h.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered Tooltip Badge */}
      {hoveredPoint && (
        <div className="mt-2 text-center text-xs py-1 px-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200">
          <span className="font-semibold text-slate-400">{hoveredPoint.date}: </span>
          <span className={`font-bold ${
            hoveredPoint.is_abnormal ? 'text-rose-400' : hoveredPoint.is_borderline ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {hoveredPoint.value} {unit}
          </span>
          <span className="text-slate-500 text-[11px] ml-1.5">({hoveredPoint.ref_raw || 'Ref Range'})</span>
        </div>
      )}

      {/* Legend Matching User Screenshots */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block shadow-sm" />
          <span className="text-slate-300 font-medium">In Range</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block shadow-sm" />
          <span className="text-slate-300 font-medium">Borderline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block shadow-sm" />
          <span className="text-slate-300 font-medium">Out of Range</span>
        </div>
      </div>
    </div>
  );
}

BiomarkerHistoryGraph.propTypes = {
  testName: PropTypes.string,
  unit: PropTypes.string,
  history: PropTypes.arrayOf(PropTypes.object),
  refLow: PropTypes.number,
  refHigh: PropTypes.number
};
