/**
 * @file ResultsPage.jsx
 * @description Comprehensive Clinical Laboratory Results & Intelligence Dashboard.
 * Supports Smart Report view (with 3-zone visual range gauges, historical progression graphs,
 * categorized panel accordions), Health Summary view (adversarial intelligence & clinical insights),
 * and Document OCR Grounding view (SVG bounding box overlays).
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FileText,
  CheckCircle2,
  Sparkles,
  Activity,
  FileCheck,
  Download,
  Share2
} from 'lucide-react';
import ReportViewer from '../components/ReportViewer';
import WhatsAppModal from '../components/WhatsAppModal';
import FhirModal from '../components/FhirModal';
import ClinicalSummaryBanner from '../components/results/ClinicalSummaryBanner';
import InconsistencyAlert from '../components/results/InconsistencyAlert';
import BiomarkerTable from '../components/results/BiomarkerTable';
import AiIntelligencePanel from '../components/results/AiIntelligencePanel';
import HitlCorrectionModal from '../components/results/HitlCorrectionModal';
import SmartReportView from '../components/results/SmartReportView';
import { correctTestResult } from '../api/client';

export default function ResultsPage({
  reportData,
  glossary = {},
  language = 'en',
  onExportPdf,
  onViewTimeline
}) {
  // Main view switcher: 'smart' (default) | 'summary' | 'ocr'
  const [activeSubView, setActiveSubView] = useState('smart');

  const [selectedResultId, setSelectedResultId] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isFhirOpen, setIsFhirOpen] = useState(false);

  // Local mutable results state for Human-in-the-loop updates
  const [localResults, setLocalResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAbnormalFilter, setOnlyAbnormalFilter] = useState(false);

  // HITL Correction Modal State
  const [editingResult, setEditingResult] = useState(null);
  const [correctedValInput, setCorrectedValInput] = useState('');
  const [correctionReasonInput, setCorrectionReasonInput] = useState('');
  const [isSavingCorrection, setIsSavingCorrection] = useState(false);
  const [notification, setNotification] = useState(null);

  // Sync incoming reportData results into local state
  useEffect(() => {
    if (reportData?.results) {
      setLocalResults(reportData.results);
      const firstAbn = reportData.results.find((r) => r.is_abnormal);
      setSelectedResultId(firstAbn ? firstAbn.id : reportData.results[0]?.id);
    }
  }, [reportData]);

  if (!reportData) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4" role="region" aria-label="Empty Report State">
        <FileText className="w-12 h-12 text-slate-600 mx-auto animate-pulse" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-300">No Report Selected</h2>
        <p className="text-sm text-slate-500">
          Upload a clinical laboratory report or select a patient from the top bar to inspect intelligence.
        </p>
      </div>
    );
  }

  // Voice Narration Handler (Web Speech API)
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const summaryText = reportData.clinical_intelligence?.non_diagnostic_summary || 'No summary available.';
      const utter = new SpeechSynthesisUtterance(summaryText);
      utter.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-US';
      utter.rate = 0.95;
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utter);
    }
  };

  // HITL Correction Trigger
  const handleStartCorrection = (result) => {
    setEditingResult(result);
    setCorrectedValInput(String(result.value));
    setCorrectionReasonInput('Manual clinical verification of lab report scan');
  };

  const handleSaveCorrection = async () => {
    if (!editingResult || !correctedValInput) return;
    setIsSavingCorrection(true);
    try {
      const parsedVal = parseFloat(correctedValInput);
      const res = await correctTestResult(reportData.id, {
        result_id: editingResult.id,
        corrected_value: parsedVal,
        correction_reason: correctionReasonInput
      });

      // Update local state reactively
      setLocalResults((prev) =>
        prev.map((item) =>
          item.id === editingResult.id
            ? {
                ...item,
                value: parsedVal,
                is_abnormal: res.is_abnormal,
                source: 'Human-corrected',
                confidence_tier: 'high'
              }
            : item
        )
      );

      setNotification({
        type: 'success',
        message: `Value updated to ${parsedVal} ${editingResult.unit || ''} with 'Human-corrected' provenance audit trail.`
      });
      setTimeout(() => setNotification(null), 5000);
      setEditingResult(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to record HITL correction.'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsSavingCorrection(false);
    }
  };

  const currentReport = {
    ...reportData,
    results: localResults
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-3 sm:px-6">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 shadow-xl shadow-emerald-950'
              : 'bg-rose-950/90 border-rose-500 text-rose-200 shadow-xl shadow-rose-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Patient Title Bar Matching Screenshot #1 */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-display flex items-center gap-2">
            <span className="text-emerald-400 font-mono text-lg">‹</span>
            <span>{reportData.patient?.name || 'Patient'}&apos;s Report</span>
          </h1>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <button
              type="button"
              onClick={onExportPdf}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-sm"
              title="Download Clinical Summary PDF"
              aria-label="Download Clinical Summary PDF"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsWhatsAppOpen(true)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors shadow-sm"
            title="Share via WhatsApp"
            aria-label="Share via WhatsApp"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Segmented View Switcher Tabs Matching User Photos */}
      <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 flex items-center justify-center gap-1.5 shadow-md">
        <button
          type="button"
          onClick={() => setActiveSubView('smart')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeSubView === 'smart'
              ? 'bg-[#0f4c81] text-white shadow-lg shadow-blue-950/60 ring-1 ring-blue-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span>Smart Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('summary')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeSubView === 'summary'
              ? 'bg-[#0f4c81] text-white shadow-lg shadow-blue-950/60 ring-1 ring-blue-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Activity className="w-4 h-4" aria-hidden="true" />
          <span>Health Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('ocr')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
            activeSubView === 'ocr'
              ? 'bg-[#0f4c81] text-white shadow-lg shadow-blue-950/60 ring-1 ring-blue-400/40'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileCheck className="w-4 h-4" aria-hidden="true" />
          <span>Document OCR View</span>
        </button>
      </div>

      {/* View 1: Smart Report (Default, matching screenshots #1, #2, #3, #4) */}
      {activeSubView === 'smart' && (
        <div className="space-y-6">
          <SmartReportView
            reportData={currentReport}
            selectedResultId={selectedResultId}
            onSelectResult={setSelectedResultId}
            onStartCorrection={handleStartCorrection}
            glossary={glossary}
          />
        </div>
      )}

      {/* View 2: Health Summary & Clinical Insights */}
      {activeSubView === 'summary' && (
        <div className="space-y-6 animate-in fade-in">
          <ClinicalSummaryBanner
            reportData={currentReport}
            isSpeaking={isSpeaking}
            onToggleSpeech={handleToggleSpeech}
            onOpenFhir={() => setIsFhirOpen(true)}
            onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
            onExportPdf={onExportPdf}
          />

          <InconsistencyAlert inconsistencies={reportData.inconsistencies} />

          <AiIntelligencePanel
            clinicalIntelligence={reportData.clinical_intelligence}
            onViewTimeline={onViewTimeline}
          />

          <BiomarkerTable
            results={localResults}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onlyAbnormalFilter={onlyAbnormalFilter}
            setOnlyAbnormalFilter={setOnlyAbnormalFilter}
            selectedResultId={selectedResultId}
            onSelectResult={setSelectedResultId}
            onStartCorrection={handleStartCorrection}
            glossary={glossary}
          />
        </div>
      )}

      {/* View 3: Document OCR Visual Grounding View */}
      {activeSubView === 'ocr' && (
        <div className="space-y-6 animate-in fade-in">
          <InconsistencyAlert inconsistencies={reportData.inconsistencies} />

          <ReportViewer
            fileUrl={reportData.report_metadata?.file_url}
            results={localResults}
            selectedResultId={selectedResultId}
            onSelectResult={setSelectedResultId}
            reportDate={reportData.report_metadata?.report_date}
            patientName={reportData.patient?.name}
          />
        </div>
      )}

      {/* HITL Correction Modal */}
      <HitlCorrectionModal
        editingResult={editingResult}
        correctedValInput={correctedValInput}
        setCorrectedValInput={setCorrectedValInput}
        correctionReasonInput={correctionReasonInput}
        setCorrectionReasonInput={setCorrectionReasonInput}
        isSavingCorrection={isSavingCorrection}
        onSave={handleSaveCorrection}
        onCancel={() => setEditingResult(null)}
      />

      {/* Export Modals */}
      <FhirModal
        isOpen={isFhirOpen}
        onClose={() => setIsFhirOpen(false)}
        reportId={reportData.id}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        reportData={currentReport}
        language={language}
      />
    </div>
  );
}

ResultsPage.propTypes = {
  reportData: PropTypes.object,
  glossary: PropTypes.object,
  language: PropTypes.string,
  onExportPdf: PropTypes.func,
  onViewTimeline: PropTypes.func
};
