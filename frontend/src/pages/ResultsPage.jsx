/**
 * @file ResultsPage.jsx
 * @description Comprehensive Clinical Laboratory Results & Intelligence Dashboard.
 * Includes interactive ReportViewer with SVG bounding box grounding, LOINC mappings,
 * biological sanity checking, human-in-the-loop (HITL) correction workflow,
 * adversarial non-diagnostic AI summaries, and multilingual voice narration.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FileText, CheckCircle2 } from 'lucide-react';
import ReportViewer from '../components/ReportViewer';
import WhatsAppModal from '../components/WhatsAppModal';
import FhirModal from '../components/FhirModal';
import ClinicalSummaryBanner from '../components/results/ClinicalSummaryBanner';
import InconsistencyAlert from '../components/results/InconsistencyAlert';
import BiomarkerTable from '../components/results/BiomarkerTable';
import AiIntelligencePanel from '../components/results/AiIntelligencePanel';
import HitlCorrectionModal from '../components/results/HitlCorrectionModal';
import { correctTestResult } from '../api/client';

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

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-950'
              : 'bg-rose-950/80 border-rose-500 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Top Clinical Summary Banner */}
      <ClinicalSummaryBanner
        reportData={{ ...reportData, results: localResults }}
        isSpeaking={isSpeaking}
        onToggleSpeech={handleToggleSpeech}
        onOpenFhir={() => setIsFhirOpen(true)}
        onOpenWhatsApp={() => setIsWhatsAppOpen(true)}
        onExportPdf={onExportPdf}
      />

      {/* Inconsistency Conflict Alert */}
      <InconsistencyAlert inconsistencies={reportData.inconsistencies} />

      {/* Document OCR Visual Grounding Viewer */}
      <ReportViewer
        fileUrl={reportData.report_metadata?.file_url}
        results={localResults}
        selectedResultId={selectedResultId}
        onSelectResult={setSelectedResultId}
        reportDate={reportData.report_metadata?.report_date}
        patientName={reportData.patient?.name}
      />

      {/* Normalized Biomarkers Table */}
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

      {/* Adversarial AI Intelligence Panel */}
      <AiIntelligencePanel
        clinicalIntelligence={reportData.clinical_intelligence}
        onViewTimeline={onViewTimeline}
      />

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

      {/* Modals */}
      <FhirModal
        isOpen={isFhirOpen}
        onClose={() => setIsFhirOpen(false)}
        reportId={reportData.id}
      />

      <WhatsAppModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        reportData={{ ...reportData, results: localResults }}
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
