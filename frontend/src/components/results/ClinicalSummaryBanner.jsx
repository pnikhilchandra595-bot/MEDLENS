import React from 'react';
import PropTypes from 'prop-types';
import { 
  FileText, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  FileCode, 
  Printer, 
  Sparkles 
} from 'lucide-react';
import ProvenanceBadge from '../ProvenanceBadge';

export default function ClinicalSummaryBanner({
  reportData,
  isSpeaking,
  onToggleSpeech,
  onOpenFhir,
  onOpenWhatsApp,
  onExportPdf
}) {
  const { patient, report_metadata, results = [] } = reportData;
  const flaggedCount = results.filter((r) => r.is_abnormal).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              REPORT: {reportData.id}
            </span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {report_metadata?.report_date || 'Unknown Date'}
            </span>
            {report_metadata?.extraction_mode === 'gemini_live' ? (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1 font-semibold">
                <Sparkles className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                Gemini Vision Live
              </span>
            ) : (
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 font-semibold">
                Demo Reference Panel
              </span>
            )}
            <ProvenanceBadge source={report_metadata?.provenance_tag || 'Extracted from report'} />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display">
              {patient?.name || 'Patient Report'}
              <span className="text-sm font-normal text-slate-400">
                ({patient?.age ? `${patient.age}y` : ''} {patient?.sex || ''})
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Lab: <strong className="text-slate-200">{report_metadata?.lab_name || 'Diagnostic Laboratory'}</strong></span>
              <span>•</span>
              <span>Physician: <strong className="text-slate-200">{report_metadata?.doctor_name || 'Dr. Consultant'}</strong></span>
            </p>
          </div>

          {report_metadata?.sha256_hash && (
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 max-w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <span>SHA-256: <span className="text-slate-300">{report_metadata.sha256_hash.slice(0, 16)}...</span></span>
              <span className="text-emerald-400 font-bold ml-1">✓ Tamper-Evident</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onToggleSpeech}
            aria-label={isSpeaking ? "Stop voice narration" : "Listen to audio summary"}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              isSpeaking
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>Listen Audio</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenFhir}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>FHIR R4 / ABDM</span>
          </button>

          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>WhatsApp Summary</span>
          </button>

          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:opacity-95 transition-all"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

ClinicalSummaryBanner.propTypes = {
  reportData: PropTypes.object.isRequired,
  isSpeaking: PropTypes.bool.isRequired,
  onToggleSpeech: PropTypes.func.isRequired,
  onOpenFhir: PropTypes.func.isRequired,
  onOpenWhatsApp: PropTypes.func.isRequired,
  onExportPdf: PropTypes.func
};
