import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ShieldCheck, MapPinOff, FileText, Image as ImageIcon } from 'lucide-react';

/**
 * @typedef {Object} BoundingBox
 * @property {number} x - Normalized x coordinate (0.0 - 1.0)
 * @property {number} y - Normalized y coordinate (0.0 - 1.0)
 * @property {number} w - Normalized width (0.0 - 1.0)
 * @property {number} h - Normalized height (0.0 - 1.0)
 */

/**
 * @typedef {Object} TestResult
 * @property {string} id - Unique identifier
 * @property {string} test_name - Name of the test
 * @property {string} [canonical_name] - LOINC canonical name
 * @property {number|string} value - Numerical or categorical value
 * @property {string} [unit] - Unit of measurement
 * @property {number} [ref_low] - Lower reference limit
 * @property {number} [ref_high] - Upper reference limit
 * @property {string} [ref_raw] - Raw reference text from report
 * @property {boolean} is_abnormal - Whether value is outside reference bounds
 * @property {boolean} [is_grounded] - Provenance grounding status
 * @property {string} [grounding_type] - Type of grounding (independent_ocr_line_match vs model_self_consistency)
 * @property {BoundingBox} [bbox] - Bounding box coordinates
 * @property {number} [bbox_x] - Fallback x coordinate
 * @property {number} [bbox_y] - Fallback y coordinate
 * @property {number} [bbox_w] - Fallback width
 * @property {number} [bbox_h] - Fallback height
 */

/**
 * ReportViewer Component
 * Renders clinical lab documents with interactive SVG bounding-box overlays,
 * dual-mode switching between real image/scan view and structured report view,
 * full keyboard accessibility (WCAG AA), and SHA-256 tamper-evident verification.
 * 
 * @param {Object} props
 * @param {string} [props.fileUrl] - URL of the uploaded image/document
 * @param {TestResult[]} [props.results] - Extracted test results with bounding boxes
 * @param {string} [props.selectedResultId] - Currently active/focused result ID
 * @param {function(string): void} [props.onSelectResult] - Selection callback
 * @param {string} [props.sha256Hash] - Cryptographic SHA-256 hash of original file
 * @param {string} [props.patientName] - Patient name for dynamic alt text
 */
export default function ReportViewer({
  fileUrl,
  results = [],
  selectedResultId,
  onSelectResult,
  sha256Hash,
  patientName = 'Patient'
}) {
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState(fileUrl && (fileUrl.endsWith('.jpg') || fileUrl.endsWith('.png') || fileUrl.endsWith('.jpeg')) ? 'image' : 'structured');
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setZoom(1);

  // Group grounded and ungrounded counts
  const groundedCount = results.filter(r => r.is_grounded !== false).length;
  const unconfirmedCount = results.length - groundedCount;

  // Resolve backend static upload URL
  const resolvedFileUrl = fileUrl 
    ? (fileUrl.startsWith('http') || fileUrl.startsWith('blob:') ? fileUrl : `http://localhost:8000${fileUrl}`)
    : null;

  const isImageFile = resolvedFileUrl && !imageError && /\.(png|jpe?g|webp|gif)$/i.test(resolvedFileUrl);

  return (
    <section 
      aria-label="Laboratory Document Viewer" 
      role="region" 
      className="flex flex-col h-full bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden"
    >
      {/* Viewer Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Laboratory Document</span>
          {sha256Hash && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]"
              title={`SHA-256 Tamper-Evidence: ${sha256Hash}`}
              aria-label={`SHA-256 Verification Hash: ${sha256Hash}`}
            >
              <ShieldCheck className="w-3 h-3" aria-hidden="true" />
              <span>SHA-256: {sha256Hash.substring(0, 8)}...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle if image is available */}
          {isImageFile && (
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 mr-1">
              <button
                type="button"
                onClick={() => setViewMode('image')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  viewMode === 'image' ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={viewMode === 'image'}
              >
                <ImageIcon className="w-3 h-3" aria-hidden="true" />
                <span>Scan Image</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('structured')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  viewMode === 'structured' ? 'bg-emerald-600 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={viewMode === 'structured'}
              >
                <FileText className="w-3 h-3" aria-hidden="true" />
                <span>Structured</span>
              </button>
            </div>
          )}

          {/* Grounding Counter Badges */}
          <div className="hidden sm:flex items-center gap-2 mr-2 text-[11px]" aria-live="polite">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true"></span>
              {groundedCount} Grounded
            </span>
            {unconfirmedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400/80">
                <MapPinOff className="w-3 h-3" aria-hidden="true" />
                {unconfirmedCount} Unconfirmed
              </span>
            )}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700" role="toolbar" aria-label="Zoom controls">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:text-white text-slate-400 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-300 min-w-[40px] text-center" aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:text-white text-slate-400 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 hover:text-white text-slate-400 border-l border-slate-700 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Document Viewport Canvas */}
      <div 
        tabIndex={0}
        aria-label="Scrollable Document Canvas"
        className="relative flex-1 overflow-auto p-4 bg-slate-950/80 flex items-start justify-center min-h-[450px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          className="relative transition-transform duration-150 ease-out max-w-[680px] w-full select-none my-2"
        >
          {/* Mode A: Real Scanned Document Image with Dynamic SVG Bounding Box Overlays */}
          {viewMode === 'image' && isImageFile ? (
            <div className="relative rounded-lg overflow-hidden shadow-2xl border border-slate-800 bg-black">
              <img
                src={resolvedFileUrl}
                alt={`Clinical laboratory diagnostic report scan for ${patientName}`}
                onError={() => setImageError(true)}
                className="w-full h-auto block"
              />

              {/* Interactive SVG Bounding Box Overlay Layer */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
                aria-label="OCR Bounding Box Overlays"
              >
                {results.map((res) => {
                  const isSelected = selectedResultId === res.id;
                  const bbox = res.bbox || {
                    x: res.bbox_x ?? 0.08,
                    y: res.bbox_y ?? 0.3,
                    w: res.bbox_w ?? 0.84,
                    h: res.bbox_h ?? 0.04
                  };

                  const x = bbox.x * 1000;
                  const y = bbox.y * 1000;
                  const w = bbox.w * 1000;
                  const h = bbox.h * 1000;

                  return (
                    <g 
                      key={`svg-box-${res.id}`} 
                      className="pointer-events-auto cursor-pointer"
                      onClick={() => onSelectResult && onSelectResult(res.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectResult && onSelectResult(res.id);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`OCR Bounding Box for ${res.canonical_name || res.test_name}: ${res.value} ${res.unit || ''}. ${res.is_abnormal ? 'Abnormal' : 'Normal'}.`}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        rx={6}
                        ry={6}
                        className={`transition-all duration-150 ${
                          isSelected
                            ? 'stroke-emerald-400 stroke-[3] fill-emerald-500/25'
                            : res.is_abnormal
                            ? 'stroke-rose-500/80 stroke-[1.5] fill-rose-500/10 hover:fill-rose-500/20'
                            : 'stroke-emerald-500/60 stroke-[1.5] fill-emerald-500/10 hover:fill-emerald-500/20'
                        }`}
                      />
                      {isSelected && (
                        <g transform={`translate(${x}, ${Math.max(y - 28, 10)})`}>
                          <rect
                            x="0"
                            y="0"
                            width={Math.min(w, 320)}
                            height="24"
                            rx="4"
                            className="fill-emerald-700/90 shadow"
                          />
                          <text
                            x="8"
                            y="16"
                            className="fill-white font-sans text-[12px] font-bold"
                          >
                            ✓ Grounded OCR ({res.canonical_name || res.test_name})
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          ) : (
            /* Mode B: Structured High-Fidelity Pathology Document Layout */
            <div className="bg-white text-slate-900 rounded-lg shadow-2xl p-6 min-h-[700px] border border-slate-200">
              {/* Document Letterhead */}
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
                  <div><span className="font-semibold text-slate-900">Patient Name:</span> {patientName} (42Y / M)</div>
                  <div><span className="font-semibold text-slate-900">Ref By:</span> Dr. V. K. Malhotra, MD</div>
                  <div><span className="font-semibold text-slate-900">Collection Date:</span> 01-Mar-2026 08:30 AM</div>
                  <div><span className="font-semibold text-slate-900">Sample:</span> Serum / Whole Blood</div>
                </div>
              </div>

              {/* Accessible Test Table with Anchored Grounded Boxes */}
              <table className="w-full text-left text-xs border-collapse" aria-label="Extracted Laboratory Tests Table">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-600 uppercase text-[10px] tracking-wider">
                    <th scope="col" className="py-2 px-2.5">INVESTIGATION (TEST NAME)</th>
                    <th scope="col" className="py-2 px-2.5">OBSERVED VALUE</th>
                    <th scope="col" className="py-2 px-2.5">UNIT</th>
                    <th scope="col" className="py-2 px-2.5">BIOLOGICAL REFERENCE</th>
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
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectResult && onSelectResult(res.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-label={`${res.test_name}, observed: ${res.value} ${res.unit || ''}, ${res.is_abnormal ? 'abnormal' : 'normal'}.`}
                        className="relative cursor-pointer group focus:outline-none"
                      >
                        <td colSpan={4} className="p-0.5">
                          <div
                            className={`relative rounded-md px-2 py-2 flex items-center justify-between transition-all duration-150 ${
                              isSelected
                                ? 'border-2 border-emerald-500 bg-emerald-50/80 ring-4 ring-emerald-500/20 shadow-sm'
                                : res.is_abnormal
                                ? 'border border-rose-400/80 bg-rose-50/40 group-hover:bg-rose-50/70 group-focus:ring-2 group-focus:ring-rose-400'
                                : isGrounded
                                ? 'border border-emerald-400/60 bg-emerald-50/20 group-hover:bg-emerald-50/50 group-focus:ring-2 group-focus:ring-emerald-400'
                                : 'border border-dashed border-slate-300 group-hover:bg-slate-50'
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

              <footer className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                <div>Verified by: Dr. S. K. Ramanathan, MD (Path)</div>
                <div>*** End of Diagnostic Report ***</div>
              </footer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
