import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine, 
  ReferenceArea 
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  Calendar, 
  Filter, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import PropTypes from 'prop-types';
import { fetchPatientTimeline } from '../api/client';
import ProvenanceBadge from '../components/ProvenanceBadge';

export default function TimelinePage({ patientId, patientName }) {
  const [timelineData, setTimelineData] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState('3016-3'); // default TSH
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      fetchPatientTimeline(patientId)
        .then((data) => {
          setTimelineData(data);
          const keys = Object.keys(data?.analyte_trends || {});
          if (keys.length > 0 && !keys.includes(selectedMarker)) {
            setSelectedMarker(keys[0]);
          }
        })
        .catch((err) => console.error('Timeline error:', err))
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 text-center space-y-3">
        <Activity className="w-10 h-10 text-emerald-400 mx-auto animate-spin" />
        <h2 className="text-lg font-bold text-slate-300">Reconstructing Temporal Patient Memory...</h2>
      </div>
    );
  }

  const trends = timelineData?.analyte_trends || {};
  const correlations = timelineData?.correlation_flags || [];
  const currentTrend = trends[selectedMarker];

  // Prepare chart data points
  const chartPoints = (currentTrend?.history || []).map((h) => ({
    date: h.report_date,
    value: h.value,
    ref_low: h.ref_low,
    ref_high: h.ref_high,
    is_abnormal: h.is_abnormal
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Title Banner */}
      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white font-display">
              Longitudinal Biometric Trends & Correlation Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tracking biological patterns across {timelineData?.reports_analyzed_count || 0} chronological laboratory reports for {patientName || 'Patient'}
          </p>
        </div>
        <ProvenanceBadge source="AI-generated" size="sm" />
      </div>

      {/* Multi-Marker Correlation Alerts (Phase 2 & Phase 3.1 Non-Diagnostic) */}
      {correlations.length > 0 && (
        <div className="space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
            🔗 Detected Multi-Marker Concordant Trajectories
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {correlations.map((c, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-300 text-sm">{c.pair_name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    {c.directions}
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed font-normal">
                  {c.observation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 4 Cols: Marker Select List */}
        <div className="lg:col-span-4 bg-slate-900/70 rounded-2xl border border-slate-800 p-4 space-y-3">
          <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Tracked Analytes & Biomarkers
          </span>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            {Object.entries(trends).map(([key, item]) => {
              const isSelected = selectedMarker === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMarker(key)}
                  className={`w-full p-3 rounded-xl text-left transition-all border ${
                    isSelected
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-white shadow'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{item.marker_name}</span>
                    <span className="text-[11px] font-bold text-emerald-400">
                      {item.latest_value} {item.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                      {item.direction === 'increasing' ? (
                        <span className="flex items-center text-rose-400 font-semibold">
                          <ArrowUpRight className="w-3 h-3" /> +{item.pct_change}%
                        </span>
                      ) : item.direction === 'decreasing' ? (
                        <span className="flex items-center text-emerald-400 font-semibold">
                          <ArrowDownRight className="w-3 h-3" /> {item.pct_change}%
                        </span>
                      ) : (
                        <span className="flex items-center text-slate-400">
                          <Minus className="w-3 h-3" /> Stable
                        </span>
                      )}
                    </div>
                    <span>{item.history?.length || 0} measurements</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 8 Cols: Recharts Visualizer */}
        <div className="lg:col-span-8 bg-slate-900/70 rounded-2xl border border-slate-800 p-6 space-y-4">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                {currentTrend?.marker_name} ({currentTrend?.unit})
              </h2>
              <p className="text-xs text-slate-400">
                Baseline: {currentTrend?.first_value} {currentTrend?.unit} → Current: {currentTrend?.latest_value} {currentTrend?.unit} ({currentTrend?.pct_change > 0 ? `+${currentTrend?.pct_change}%` : `${currentTrend?.pct_change}%`})
              </p>
            </div>

            {currentTrend?.threshold_event && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{currentTrend.threshold_event}</span>
              </span>
            )}
          </div>

          {/* Interactive Line Chart */}
          <div className="h-[380px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickMargin={8}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={11} 
                  domain={['auto', 'auto']}
                  tickMargin={8}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-slate-900/95 border border-emerald-500/40 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-emerald-400">{data.date}</p>
                          <p className="text-white font-semibold text-sm">
                            Value: {data.value} {currentTrend?.unit}
                          </p>
                          {data.ref_low !== null && data.ref_high !== null && (
                            <p className="text-slate-400 text-[11px]">
                              Normal Bounds: {data.ref_low} – {data.ref_high}
                            </p>
                          )}
                          <p className={data.is_abnormal ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            {data.is_abnormal ? '▲ Flagged Abnormal' : '✓ Within Range'}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                
                {/* Upper and Lower Reference Lines */}
                {chartPoints[0]?.ref_high && (
                  <ReferenceLine 
                    y={chartPoints[0].ref_high} 
                    stroke="#f43f5e" 
                    strokeDasharray="4 4" 
                    label={{ value: `Upper Ref (${chartPoints[0].ref_high})`, fill: '#f43f5e', fontSize: 10, position: 'top' }} 
                  />
                )}
                {chartPoints[0]?.ref_low && (
                  <ReferenceLine 
                    y={chartPoints[0].ref_low} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    label={{ value: `Lower Ref (${chartPoints[0].ref_low})`, fill: '#10b981', fontSize: 10, position: 'bottom' }} 
                  />
                )}

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 6, fill: '#10b981', stroke: '#022c22', strokeWidth: 2 }}
                  activeDot={{ r: 8, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Dashed lines indicate standard laboratory reference boundaries.</span>
            <span className="text-emerald-400 font-mono">Engine: Temporal Intelligence Engine v1.0</span>
          </div>

        </div>

      </div>

    </div>
  );
}

TimelinePage.propTypes = {
  patientId: PropTypes.string,
  patientName: PropTypes.string
};

