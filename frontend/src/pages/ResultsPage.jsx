import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Download, 
  Share2, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  FileCode,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import ReportViewer from '../components/ReportViewer';
import ProvenanceBadge from '../components/ProvenanceBadge';
import GlossaryTooltip from '../components/GlossaryTooltip';
import WhatsAppModal from '../components/WhatsAppModal';
import FhirModal from '../components/FhirModal';

export default function ResultsPage({
  reportData,
  glossary = {},
  language = 'en',
  onExportPdf,
  onViewTimeline
}) {
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isFhirOpen, setIsFhirOpen] = useState(false);

  // Auto-select first abnormal result for demo focus
  useEffect(() => {
    if (reportData?.results && reportData.results.length > 0) {
      const firstAbn = reportData.results.find(r => r.is_abnormal);
      setSelectedResultId(firstAbn ? firstAbn.id : reportData.results[0].id);
    }
  }, [reportData]);

  if (!reportData) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4">
        <FileText className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
        <h2 className="text-xl font-bold text-slate-300">No Report Selected</h2>
        <p className="text-xs text-slate-500">Please upload a laboratory report or select a patient from the navigation bar.</p>
      </div>
    );
  }

  const { patient, report_metadata, results = [], inconsistencies = [], clinical_intelligence } = reportData;

  // Web Speech API Narration (Improvisation #6 & Phase 7)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported by your browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const narrationText = `${clinical_intelligence?.primary_summary || ''}. Alternative physiological explanations: ${clinical_intelligence?.counter_explanations?.join('. ') || ''}. Suggested doctor questions: ${clinical_intelligence?.doctor_questions?.join('. ') || ''}`;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    const langCode = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    utterance.lang = langCode;
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
              {patient?.name || 'Patient'} — Lab Report Review
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {report_metadata?.report_date || '2026-03-01'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
            <span>{report_metadata?.lab_name || 'Metropolis Labs'}</span>
            <span>•</span>
            <span className="font-mono text-[10px] text-emerald-400">
              SHA-256: {report_metadata?.sha256_hash?.substring(0, 16)}...
            </span>
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Narration */}
          <button
            onClick={handleToggleSpeech}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSpeaking
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSpeaking ? 'Stop Voice' : 'Voice Narration'}</span>
          </button>

          {/* FHIR R4 Export */}
          <button
            onClick={() => setIsFhirOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>FHIR R4 JSON</span>
          </button>

          {/* WhatsApp Dispatch */}
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Summary</span>
          </button>

          {/* Print / PDF Export */}
          <button
            onClick={onExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/40 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Clinician PDF</span>
          </button>
        </div>
      </div>

      {/* Inconsistency Detection Alert Banner (Phase 1.5) */}
      {inconsistencies.length > 0 && (
        <div className="space-y-2">
          {inconsistencies.map((inc, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{inc.title}</span>
                  <ProvenanceBadge source={inc.source} size="xs" />
                </div>
                <p className="mt-1 text-slate-300 leading-relaxed">{inc.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Split-View: Left Document Viewer | Right Extracted Results Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Interactive Document Image + Grounded Bounding Boxes */}
        <div className="lg:col-span-5 h-[580px]">
          <ReportViewer
            fileUrl={report_metadata?.file_url}
            results={results}
            selectedResultId={selectedResultId}
            onSelectResult={(id) => setSelectedResultId(id)}
            sha256Hash={report_metadata?.sha256_hash}
          />
        </div>

        {/* Right Pane: Structured Results Table with Provenance & Confidence */}
        <div className="lg:col-span-7 bg-slate-900/70 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[580px]">
          
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                LOINC Normalized Laboratory Findings
              </h2>
              <p className="text-[11px] text-slate-400">Click any row to view its grounded OCR location in document</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                {clinical_intelligence?.flag_count || 0} Flagged
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3">Test Investigation</th>
                  <th className="py-2.5 px-2">Observed Result</th>
                  <th className="py-2.5 px-2">Reference Range</th>
                  <th className="py-2.5 px-2">Confidence</th>
                  <th className="py-2.5 px-3">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {results.map((res) => {
                  const isSelected = selectedResultId === res.id;
                  return (
                    <tr
                      key={res.id}
                      onClick={() => setSelectedResultId(res.id)}
                      className={`cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? 'bg-emerald-950/40 border-l-4 border-l-emerald-500 text-white font-medium'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center">
                          <GlossaryTooltip testName={res.test_name} glossary={glossary}>
                            <span className="font-semibold text-slate-100">
                              {res.canonical_name || res.test_name}
                            </span>
                          </GlossaryTooltip>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {res.loinc_code ? (
                            <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-800/40">
                              LOINC: {res.loinc_code}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/40">
                              Unmapped • Human Review
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <span className={`text-sm font-bold ${res.is_abnormal ? 'text-rose-400' : 'text-slate-100'}`}>
                          {res.value} <span className="text-xs font-normal text-slate-400">{res.unit}</span>
                        </span>
                        {res.is_abnormal && (
                          <span className="block text-[10px] text-rose-400 font-semibold">▲ Flagged Abnormal</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-slate-400 text-xs">
                        {res.ref_low !== null && res.ref_high !== null ? (
                          <span>{res.ref_low} – {res.ref_high}</span>
                        ) : (
                          <span className="text-amber-400/90 italic font-mono text-[11px]">
                            {res.ref_raw || 'Unspecified'}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          res.confidence_tier === 'high'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : res.confidence_tier === 'medium'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {res.confidence_tier}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <ProvenanceBadge source={res.source} size="xs" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* Bottom Intelligence Section: Flag Count + Non-diagnostic Summary + Gated Counter-Prompt + Questions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 7 Cols: Non-diagnostic Interpretation & Gated Counter Argument */}
        <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-5">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-base text-white font-display">
                Adversarial AI Layer & Temporal Summary
              </h3>
            </div>
            <ProvenanceBadge source="AI-generated" size="xs" />
          </div>

          {/* Deterministic Source Flag Banner */}
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <strong className="text-white">
                {clinical_intelligence?.flagged_tests_count_text || `${clinical_intelligence?.flag_count || 0} values flagged`}
              </strong>
            </div>
            <span className="text-[10px] text-slate-400">Deterministic Lab Flag Count (No AI Triage Score)</span>
          </div>

          {/* Primary Interpretation */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-200">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
              Descriptive Pattern Observation ({language.toUpperCase()})
            </span>
            <p className="text-sm text-slate-100 font-normal">
              {clinical_intelligence?.primary_summary}
            </p>
          </div>

          {/* Gated Counter-Argument Section (Structurally part of output, Phase 3.2) */}
          <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Gated Adversarial Counter-Argument (Alternative Explanations)</span>
            </div>
            <p className="text-[11px] text-slate-400">
              To prevent premature assumptions, here are plausible non-diagnostic physiological or technical factors for these variations:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {clinical_intelligence?.counter_explanations?.map((exp, i) => (
                <li key={i}>{exp}</li>
              ))}
            </ul>
          </div>

        </div>

        {/* Right 5 Cols: Doctor Questions & Timeline Shortcut */}
        <div className="lg:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4">
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Questions to Ask Your Doctor
              </h3>
              <ProvenanceBadge source="AI-generated" size="xs" />
            </div>

            <ol className="space-y-2 text-xs text-slate-300">
              {clinical_intelligence?.doctor_questions?.map((q, i) => (
                <li key={i} className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-start gap-2">
                  <span className="font-mono text-cyan-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{q}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Longitudinal Timeline Button */}
          <button
            onClick={onViewTimeline}
            className="w-full py-3 px-4 bg-slate-800 hover:bg-emerald-950/50 hover:border-emerald-500/50 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-emerald-400 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Explore Longitudinal Patient Memory</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

        </div>

      </div>

      {/* Modals */}
      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        reportData={reportData}
        language={language}
      />

      <FhirModal
        isOpen={isFhirOpen}
        onClose={() => setIsFhirOpen(false)}
        reportId={reportData?.id}
      />

    </div>
  );
}
