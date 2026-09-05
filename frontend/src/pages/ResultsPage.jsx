/**
 * @file ResultsPage.jsx
 * @description Comprehensive Clinical Laboratory Results & Intelligence Dashboard.
 * Includes interactive ReportViewer with SVG bounding box grounding, LOINC mappings,
 * biological sanity checking, human-in-the-loop (HITL) correction workflow,
 * adversarial non-diagnostic AI summaries, and multilingual voice narration.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  MessageSquare, 
  HelpCircle, 
  CheckCircle2, 
  Activity, 
  Sparkles, 
  FileCode,
  Printer,
  ChevronRight,
  Edit3,
  Search,
  Check,
  X
} from 'lucide-react';
import ReportViewer from '../components/ReportViewer';
import ProvenanceBadge from '../components/ProvenanceBadge';
import GlossaryTooltip from '../components/GlossaryTooltip';
import WhatsAppModal from '../components/WhatsAppModal';
import FhirModal from '../components/FhirModal';
import { correctTestResult } from '../api/client';

/**
 * @typedef {Object} TestResult
 * @property {string} id
 * @property {string} test_name
 * @property {string} [canonical_name]
 * @property {string} [loinc_code]
 * @property {number} value
 * @property {string} [unit]
 * @property {number|null} [ref_low]
 * @property {number|null} [ref_high]
 * @property {string} [ref_raw]
 * @property {boolean} is_abnormal
 * @property {string} confidence_tier
 * @property {string} source
 * @property {Object} [bbox]
 */

/**
 * ResultsPage Component
 * @param {Object} props
 * @param {Object} props.reportData - Complete laboratory report object
 * @param {Object} [props.glossary] - Medical glossary definitions
 * @param {string} [props.language='en'] - Active display language ('en' | 'hi' | 'te')
 * @param {Function} [props.onExportPdf] - PDF export handler
 * @param {Function} [props.onViewTimeline] - Switch to longitudinal timeline handler
 */
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
      const firstAbn = reportData.results.find(r => r.is_abnormal);
      setSelectedResultId(firstAbn ? firstAbn.id : reportData.results[0]?.id);
    }
  }, [reportData]);

  if (!reportData) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-4" role="region" aria-label="Empty Report State">
        <FileText className="w-12 h-12 text-slate-600 mx-auto animate-pulse" aria-hidden="true" />
        <h2 className="text-xl font-bold text-slate-300">No Report Selected</h2>
        <p className="text-xs text-slate-500">Please upload a laboratory report or select a patient from the navigation bar.</p>
      </div>
    );
  }

  const { patient, report_metadata, inconsistencies = [], clinical_intelligence } = reportData;

  // Filter results by search query and abnormality flag
  const filteredResults = localResults.filter(r => {
    const matchesSearch = searchQuery === '' ||
      (r.canonical_name || r.test_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.loinc_code || '').includes(searchQuery);
    const matchesAbnormal = !onlyAbnormalFilter || r.is_abnormal;
    return matchesSearch && matchesAbnormal;
  });

  // Web Speech API Narration
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

  // Open HITL Correction Dialog
  const handleOpenCorrection = (res, e) => {
    e.stopPropagation();
    setEditingResult(res);
    setCorrectedValInput(String(res.value));
    setCorrectionReasonInput('Verified against physical document printout');
  };

  // Submit HITL Correction
  const handleSaveCorrection = async () => {
    if (!editingResult || !correctedValInput) return;
    setIsSavingCorrection(true);
    try {
      const numVal = parseFloat(correctedValInput);
      await correctTestResult(
        reportData.id,
        editingResult.id,
        isNaN(numVal) ? correctedValInput : numVal,
        correctionReasonInput,
        patient?.id
      );

      // Update local state to reflect human correction immediately
      setLocalResults(prev => prev.map(item => {
        if (item.id === editingResult.id) {
          const newVal = isNaN(numVal) ? correctedValInput : numVal;
          const isAbn = (item.ref_low !== null && newVal < item.ref_low) ||
                        (item.ref_high !== null && newVal > item.ref_high);
          return {
            ...item,
            value: newVal,
            is_abnormal: isAbn,
            source: 'Human-corrected',
            confidence_tier: 'high'
          };
        }
        return item;
      }));

      setNotification({
        type: 'success',
        text: `Successfully corrected ${editingResult.test_name} to ${correctedValInput}. Audit trail recorded.`
      });
      setTimeout(() => setNotification(null), 5000);
      setEditingResult(null);
    } catch (err) {
      setNotification({
        type: 'error',
        text: `Correction failed: ${err.message}`
      });
    } finally {
      setIsSavingCorrection(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {notification && (
        <div
          role="alert"
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-lg transition-all animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span className="font-semibold">{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white" aria-label="Dismiss notification">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-slate-800">
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
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Report Actions">
          {/* Voice Narration */}
          <button
            onClick={handleToggleSpeech}
            aria-label={isSpeaking ? 'Stop Voice Narration' : 'Start Voice Narration'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSpeaking
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" aria-hidden="true" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />}
            <span>{isSpeaking ? 'Stop Voice' : 'Voice Narration'}</span>
          </button>

          {/* FHIR R4 Export */}
          <button
            onClick={() => setIsFhirOpen(true)}
            aria-label="Export FHIR R4 JSON bundle"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            <span>FHIR R4 JSON</span>
          </button>

          {/* WhatsApp Dispatch */}
          <button
            onClick={() => setIsWhatsAppOpen(true)}
            aria-label="Send WhatsApp summary"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" />
            <span>WhatsApp Summary</span>
          </button>

          {/* Print / PDF Export */}
          <button
            onClick={onExportPdf}
            aria-label="Export printable clinician PDF"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md shadow-emerald-900/40 transition-all"
          >
            <Printer className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export Clinician PDF</span>
          </button>
        </div>
      </header>

      {/* Demo Fallback Alert Banner */}
      {(report_metadata?.extraction_mode === 'demo_fallback' || reportData?.extraction_warning) && (
        <div role="alert" className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3 shadow-lg animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <span className="font-bold text-amber-300">⚠️ Demo Fallback Active</span>
            <p className="mt-0.5 text-slate-300 leading-relaxed">
              Live Gemini Vision extraction was unavailable or timed out. Displaying calibrated baseline reference panel for testing.
            </p>
          </div>
        </div>
      )}

      {/* Inconsistency Detection Alert Banner */}
      {inconsistencies.length > 0 && (
        <section aria-label="Clinical Inconsistency Warnings" className="space-y-2">
          {inconsistencies.map((inc, i) => (
            <div
              key={i}
              role="alert"
              className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3 animate-in fade-in"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300">{inc.title}</span>
                  <ProvenanceBadge source={inc.source} size="xs" />
                </div>
                <p className="mt-1 text-slate-300 leading-relaxed">{inc.message}</p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Split-View: Left Document Viewer | Right Extracted Results Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Pane: Interactive Document Image + Grounded Bounding Boxes */}
        <div className="lg:col-span-5 h-[620px]">
          <ReportViewer
            fileUrl={report_metadata?.file_url}
            results={localResults}
            selectedResultId={selectedResultId}
            onSelectResult={(id) => setSelectedResultId(id)}
            sha256Hash={report_metadata?.sha256_hash}
            patientName={patient?.name}
          />
        </div>

        {/* Right Pane: Structured Results Table with Search & HITL Actions */}
        <section
          aria-label="Laboratory Test Results Table"
          className="lg:col-span-7 bg-slate-900/70 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[620px]"
        >
          
          <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  LOINC Normalized Laboratory Findings
                </h2>
                <p className="text-[11px] text-slate-400">Click any row to view its grounded OCR location or edit values</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                  {localResults.filter(r => r.is_abnormal).length} Flagged
                </span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" aria-hidden="true" />
                <label htmlFor="test-search-input" className="sr-only">Search tests or LOINC codes</label>
                <input
                  id="test-search-input"
                  type="text"
                  placeholder="Filter by test name or LOINC..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                <input
                  type="checkbox"
                  checked={onlyAbnormalFilter}
                  onChange={(e) => setOnlyAbnormalFilter(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-950"
                />
                <span>Only Flagged</span>
              </label>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950/90 backdrop-blur border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider z-10">
                <tr>
                  <th scope="col" className="py-2.5 px-3">Test Investigation</th>
                  <th scope="col" className="py-2.5 px-2">Observed Result</th>
                  <th scope="col" className="py-2.5 px-2">Reference Range</th>
                  <th scope="col" className="py-2.5 px-2">Confidence</th>
                  <th scope="col" className="py-2.5 px-3">Provenance</th>
                  <th scope="col" className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredResults.map((res) => {
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

                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={(e) => handleOpenCorrection(res, e)}
                          title="Human-in-the-loop: Edit or correct extracted value"
                          aria-label={`Correct test value for ${res.test_name}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-300 border border-slate-700 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </section>

      </div>

      {/* Bottom Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left 7 Cols: Non-diagnostic Interpretation & Gated Counter Argument */}
        <section
          aria-label="Adversarial Clinical Intelligence"
          className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-5"
        >
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" aria-hidden="true" />
              <h3 className="font-bold text-base text-white font-display">
                Adversarial AI Layer & Temporal Summary
              </h3>
            </div>
            <ProvenanceBadge source="AI-generated" size="xs" />
          </div>

          {/* Deterministic Source Flag Banner */}
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" aria-hidden="true"></span>
              <strong className="text-white">
                {clinical_intelligence?.flagged_tests_count_text || `${localResults.filter(r => r.is_abnormal).length} values flagged`}
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

          {/* Gated Counter-Argument Section */}
          <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" aria-hidden="true" />
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

        </section>

        {/* Right 5 Cols: Doctor Questions & Timeline Shortcut */}
        <section
          aria-label="Doctor Consultation Questions"
          className="lg:col-span-5 bg-slate-900/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-4"
        >
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" aria-hidden="true" />
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
            aria-label="Explore longitudinal patient memory and biomarker history"
            className="w-full py-3 px-4 bg-slate-800 hover:bg-emerald-950/50 hover:border-emerald-500/50 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-emerald-400 flex items-center justify-between transition-all group"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Explore Longitudinal Patient Memory</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>

        </section>

      </div>

      {/* HITL Human Correction Modal */}
      {editingResult && (
        <div
          role="dialog"
          aria-labelledby="hitl-modal-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 id="hitl-modal-title" className="font-bold text-base text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                Human-in-the-Loop Value Correction
              </h3>
              <button
                onClick={() => setEditingResult(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close correction modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Editing: <strong className="text-emerald-400">{editingResult.canonical_name || editingResult.test_name}</strong>
              <br />
              Original Extracted Value: <span className="font-mono text-slate-400">{editingResult.value} {editingResult.unit}</span>
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="hitl-corrected-value" className="block text-xs font-semibold text-slate-300 mb-1">
                  Corrected Lab Value:
                </label>
                <input
                  id="hitl-corrected-value"
                  type="text"
                  value={correctedValInput}
                  onChange={(e) => setCorrectedValInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. 6.8"
                />
              </div>

              <div>
                <label htmlFor="hitl-correction-reason" className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Correction (Audit Log):
                </label>
                <input
                  id="hitl-correction-reason"
                  type="text"
                  value={correctionReasonInput}
                  onChange={(e) => setCorrectionReasonInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Visual confirmation of printout"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingResult(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                disabled={isSavingCorrection}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-950"
              >
                {isSavingCorrection ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Human Correction</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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

ResultsPage.propTypes = {
  reportData: PropTypes.object,
  glossary: PropTypes.object,
  language: PropTypes.string,
  onExportPdf: PropTypes.func,
  onViewTimeline: PropTypes.func
};
