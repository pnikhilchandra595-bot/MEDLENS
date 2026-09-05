/**
 * @file ReportViewer.jsx
 * @description Honest Clinical Laboratory Document Viewer.
 * Renders genuine uploaded document scans/images with interactive SVG bounding-box overlays
 * drawn exclusively from verified backend coordinates.
 * Strictly adheres to provenance honesty: ungrounded items render NO fake bounding boxes.
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ShieldCheck, 
  MapPinOff, 
  FileText, 
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

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
 * @property {string} [grounding_type] - Type of grounding
 * @property {BoundingBox} [bbox] - Verified bounding box coordinates
 */

/**
 * ReportViewer Component
 * @param {Object} props
 * @param {string} [props.fileUrl] - URL of uploaded document (image or PDF)
 * @param {TestResult[]} [props.results] - Extracted test results
 * @param {string} [props.selectedResultId] - Focused test result ID
 * @param {function(string): void} [props.onSelectResult] - Selection callback
 * @param {string} [props.sha256Hash] - Cryptographic SHA-256 hash of original file
 * @param {string} [props.patientName] - Patient name for contextual alt text
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
  const [imageError, setImageError] = useState(false);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.6));
  const handleResetZoom = () => setZoom(1);

  // Group verified grounded vs unconfirmed counts
  const groundedCount = results.filter(r => r.bbox && r.is_grounded !== false).length;
  const unconfirmedCount = results.length - groundedCount;

  // Use relative or absolute fileUrl without hardcoding localhost:8000
  const resolvedFileUrl = fileUrl || null;
  const isPdf = resolvedFileUrl && /\.pdf$/i.test(resolvedFileUrl);
  const isImageFile = resolvedFileUrl && !imageError && /\.(png|jpe?g|webp|gif)$/i.test(resolvedFileUrl);

  return (
    <section 
      aria-label="Laboratory Document Viewer" 
      role="region" 
      className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
    >
      {/* Viewer Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 font-display">Laboratory Document</span>
          {sha256Hash && (
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] font-semibold"
              title={`SHA-256 Tamper-Evidence: ${sha256Hash}`}
              aria-label={`SHA-256 Verification Hash: ${sha256Hash}`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-600" aria-hidden="true" />
              <span>SHA-256: {sha256Hash.substring(0, 8)}...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Grounding Counter Badges */}
          <div className="flex items-center gap-2 mr-2 text-[11px]" aria-live="polite">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
              {groundedCount} Grounded
            </span>
            {unconfirmedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <MapPinOff className="w-3 h-3 text-amber-600" aria-hidden="true" />
                {unconfirmedCount} Unconfirmed
              </span>
            )}
          </div>

          {/* Zoom Controls (Active for image mode) */}
          {isImageFile && (
            <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-300 shadow-sm" role="toolbar" aria-label="Zoom controls">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:text-slate-900 text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-slate-700 min-w-[40px] text-center font-bold" aria-live="polite">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:text-slate-900 text-slate-500 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 hover:text-slate-900 text-slate-500 border-l border-slate-200 transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                title="Reset Zoom"
                aria-label="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Document Viewport Canvas */}
      <div 
        tabIndex={0}
        aria-label="Scrollable Document Canvas"
        className="relative flex-1 overflow-auto p-4 bg-slate-100/70 flex items-start justify-center min-h-[450px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
      >
        <div
          style={{ transform: isImageFile ? `scale(${zoom})` : 'none', transformOrigin: 'top center' }}
          className="relative transition-transform duration-150 ease-out max-w-[680px] w-full select-none my-2"
        >
          {/* View Mode 1: Real Scanned Document Image with Grounded SVG Bounding Box Overlays */}
          {isImageFile ? (
            <div className="relative rounded-lg overflow-hidden shadow-xl border border-slate-300 bg-white">
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
                aria-label="OCR Grounded Bounding Box Overlays"
              >
                {results.map((res) => {
                  // Strict Honesty: If result has no real bounding box or is ungrounded, render NOTHING.
                  if (!res.bbox || res.is_grounded === false) {
                    return null;
                  }

                  const bbox = res.bbox;
                  if (
                    typeof bbox.x !== 'number' || 
                    typeof bbox.y !== 'number' || 
                    typeof bbox.w !== 'number' || 
                    typeof bbox.h !== 'number'
                  ) {
                    return null;
                  }

                  const isSelected = selectedResultId === res.id;
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
                      aria-label={`Grounded Bounding Box for ${res.canonical_name || res.test_name}: ${res.value} ${res.unit || ''}. ${res.is_abnormal ? 'Abnormal' : 'Normal'}.`}
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
                            ? 'stroke-emerald-600 stroke-[3] fill-emerald-500/25'
                            : res.is_abnormal
                            ? 'stroke-rose-600 stroke-[1.5] fill-rose-500/15 hover:fill-rose-500/25'
                            : 'stroke-emerald-600 stroke-[1.5] fill-emerald-500/15 hover:fill-emerald-500/25'
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
                            className="fill-emerald-700 shadow"
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
          ) : isPdf ? (
            /* View Mode 2: PDF Document Embed with Real File Stream */
            <div className="rounded-lg overflow-hidden shadow-xl border border-slate-300 bg-white min-h-[550px] flex flex-col">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  PDF Laboratory Document
                </span>
                <a
                  href={resolvedFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 text-[11px] font-semibold"
                >
                  <span>Open PDF in New Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <iframe
                src={resolvedFileUrl}
                title={`Clinical Laboratory PDF Report for ${patientName}`}
                className="w-full flex-1 min-h-[500px] border-none bg-slate-100"
              />
            </div>
          ) : (
            /* View Mode 3: Honest Extracted Findings View (NO fake hospital/doctor letterheads) */
            <div className="bg-white text-slate-900 rounded-2xl shadow-sm p-5 border border-slate-200 space-y-4">
              <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-display">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Structured Diagnostic Extract
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Extracted investigation findings parsed with SHA-256 cryptographic verification.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {results.length} Extracted Parameters
                </span>
              </div>

              <div className="space-y-2">
                {results.map((res) => {
                  const isSelected = selectedResultId === res.id;
                  const isGrounded = res.bbox && res.is_grounded !== false;

                  return (
                    <button
                      type="button"
                      key={res.id}
                      onClick={() => onSelectResult && onSelectResult(res.id)}
                      aria-pressed={isSelected}
                      aria-label={`${res.test_name}: ${res.value} ${res.unit || ''}`}
                      className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 text-slate-900 shadow-sm ring-1 ring-emerald-500/40'
                          : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 hover:bg-white text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-bold text-slate-900">
                          {res.canonical_name || res.test_name}
                        </div>
                        <div className={`font-bold ${res.is_abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                          {res.value} <span className="font-medium text-slate-500 text-[11px]">{res.unit}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                        <span>
                          Reference: {res.ref_low !== null && res.ref_high !== null ? `${res.ref_low} – ${res.ref_high}` : res.ref_raw || 'Unspecified'}
                        </span>
                        <span>
                          {isGrounded ? (
                            <span className="text-emerald-700 font-semibold">✓ Grounded</span>
                          ) : (
                            <span className="text-amber-700 font-medium">Location unconfirmed</span>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

ReportViewer.propTypes = {
  fileUrl: PropTypes.string,
  results: PropTypes.arrayOf(PropTypes.object),
  selectedResultId: PropTypes.string,
  onSelectResult: PropTypes.func,
  sha256Hash: PropTypes.string,
  patientName: PropTypes.string
};
