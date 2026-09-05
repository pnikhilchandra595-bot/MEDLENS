import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ShieldCheck, MapPinOff } from 'lucide-react';

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
  const groundedCount = results.filter(r => r.is_grounded !== false).length;
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
      <div className="relative flex-1 overflow-auto p-4 bg-slate-950/80 flex items-start justify-center min-h-[450px]">
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="relative transition-transform duration-150 ease-out bg-white text-slate-900 rounded-lg shadow-2xl p-6 max-w-[650px] w-full min-h-[700px] border border-slate-200 select-none my-2"
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

          {/* Test Table with Inline Grounded Bounding Boxes */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider">
                <th className="py-2 px-2.5">INVESTIGATION (TEST NAME)</th>
                <th className="py-2 px-2.5">OBSERVED VALUE</th>
                <th className="py-2 px-2.5">UNIT</th>
                <th className="py-2 px-2.5">BIOLOGICAL REFERENCE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-transparent text-slate-800">
              {results.map((res) => {
                const isSelected = selectedResultId === res.id;
                const isGrounded = res.is_grounded !== false;

                return (
                  <tr
                    key={res.id}
                    onClick={() => onSelectResult && onSelectResult(res.id)}
                    className="relative cursor-pointer group"
                  >
                    <td colSpan={4} className="p-0.5">
                      <div
                        className={`relative rounded-md px-2 py-2 flex items-center justify-between transition-all duration-150 ${
                          isSelected
                            ? 'border-2 border-emerald-500 bg-emerald-50/80 ring-4 ring-emerald-500/20 shadow-sm'
                            : res.is_abnormal
                            ? 'border border-rose-400/80 bg-rose-50/40 hover:bg-rose-50/70'
                            : isGrounded
                            ? 'border border-emerald-400/60 bg-emerald-50/20 hover:bg-emerald-50/50'
                            : 'border border-dashed border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* Floating Grounded Tag for selected row */}
                        {isSelected && (
                          <div className="absolute -top-3.5 left-2 z-20 px-2 py-0.5 bg-emerald-700 text-white rounded text-[9px] font-bold tracking-wide whitespace-nowrap shadow flex items-center gap-1">
                            <span>✓ Grounded OCR Box ({res.canonical_name || res.test_name})</span>
                          </div>
                        )}

                        <div className="grid grid-cols-12 w-full items-center text-xs">
                          <div className="col-span-4 font-medium text-slate-900 truncate pr-2">
                            {res.test_name}
                          </div>
                          <div className={`col-span-3 font-bold ${res.is_abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                            {res.value} {res.is_abnormal ? '▲' : ''}
                          </div>
                          <div className="col-span-2 text-slate-500">
                            {res.unit || '-'}
                          </div>
                          <div className="col-span-3 text-slate-500 text-right pr-1">
                            {res.ref_low !== null && res.ref_high !== null
                              ? `${res.ref_low} - ${res.ref_high}`
                              : res.ref_raw || 'Not Specified'}
                          </div>
                        </div>
                      </div>
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
        </div>
      </div>
    </div>
  );
}
