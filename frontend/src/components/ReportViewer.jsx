import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, CheckCircle2, AlertTriangle, ShieldCheck, MapPinOff } from 'lucide-react';

export default function ReportViewer({
  fileUrl,
  results = [],
  selectedResultId,
  onSelectResult,
  sha256Hash
}) {
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setZoom(1);

  // Group grounded and ungrounded
  const groundedCount = results.filter(r => r.is_grounded && r.bbox).length;
  const unconfirmedCount = results.length - groundedCount;

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Laboratory Document</span>
          {sha256Hash && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]"
              title={`SHA-256 Tamper-Evidence: ${sha256Hash}`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>SHA-256: {sha256Hash.substring(0, 10)}...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {groundedCount} Grounded
            </span>
            {unconfirmedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400/80">
                <MapPinOff className="w-3 h-3" />
                {unconfirmedCount} Unconfirmed
              </span>
            )}
          </div>

          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:text-white text-slate-400 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-300 min-w-[40px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:text-white text-slate-400 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-white text-slate-400 border-l border-slate-700 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewport */}
      <div className="relative flex-1 overflow-auto p-4 bg-slate-950/80 flex items-center justify-center min-h-[450px]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="relative transition-transform duration-150 ease-out bg-white text-slate-900 rounded-lg shadow-2xl p-6 max-w-[650px] w-full min-h-[750px] border border-slate-200 select-none"
        >
          {/* Synthetic realistic lab report document layout */}
          <div className="border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">METROPOLIS HEALTHCARE LABS</h2>
                <p className="text-[11px] text-slate-500">Accredited Clinical Pathology & Diagnostic Services</p>
              </div>
              <div className="text-right text-[10px] text-slate-600">
                <p>NABL & ISO 15189 Certified</p>
                <p>Report ID: MET-2026-98124</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-200 text-xs text-slate-700">
              <div><span className="font-semibold text-slate-900">Patient Name:</span> Arjun Sharma (42Y / M)</div>
              <div><span className="font-semibold text-slate-900">Ref By:</span> Dr. V. K. Malhotra, MD</div>
              <div><span className="font-semibold text-slate-900">Collection Date:</span> 01-Mar-2026 08:30 AM</div>
              <div><span className="font-semibold text-slate-900">Sample:</span> Serum / Whole Blood</div>
            </div>
          </div>

          {/* Test Table Simulation */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-1.5 px-2">Investigation (Test Name)</th>
                <th className="py-1.5 px-2">Observed Value</th>
                <th className="py-1.5 px-2">Unit</th>
                <th className="py-1.5 px-2">Biological Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {results.map((res) => {
                const isSelected = selectedResultId === res.id;
                return (
                  <tr
                    key={res.id}
                    onClick={() => onSelectResult && onSelectResult(res.id)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected ? 'bg-emerald-50 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2 px-2 font-medium">{res.test_name}</td>
                    <td className={`py-2 px-2 ${res.is_abnormal ? 'text-rose-600 font-bold' : 'text-slate-900'}`}>
                      {res.value} {res.is_abnormal ? '▲' : ''}
                    </td>
                    <td className="py-2 px-2 text-slate-500">{res.unit || '-'}</td>
                    <td className="py-2 px-2 text-slate-500">
                      {res.ref_low !== null && res.ref_high !== null
                        ? `${res.ref_low} - ${res.ref_high}`
                        : res.ref_raw || 'Not Specified'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <div>Verified by: Dr. S. K. Ramanathan, MD (Path)</div>
            <div>*** End of Diagnostic Report ***</div>
          </div>

          {/* Bounding Box Highlights Overlay Layer */}
          <div className="absolute inset-0 pointer-events-none">
            {results.map((res) => {
              const isSelected = selectedResultId === res.id;
              if (!res.is_grounded || !res.bbox) return null;

              const { x, y, w, h } = res.bbox;
              return (
                <div
                  key={`bbox-${res.id}`}
                  style={{
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                    width: `${w * 100}%`,
                    height: `${h * 100}%`,
                  }}
                  className={`absolute rounded transition-all duration-200 ${
                    isSelected
                      ? 'border-2 border-emerald-500 bg-emerald-500/15 ring-4 ring-emerald-500/20'
                      : res.is_abnormal
                      ? 'border border-rose-500/60 bg-rose-500/5'
                      : 'border border-emerald-500/40 bg-emerald-500/5'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute -top-5 left-0 px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-semibold whitespace-nowrap shadow">
                      ✓ Grounded OCR Box ({res.canonical_name || res.test_name})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
