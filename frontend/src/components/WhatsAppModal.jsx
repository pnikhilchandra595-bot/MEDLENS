import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, X, ShieldAlert, Phone } from 'lucide-react';
import { sendWhatsAppMessage } from '../api/client';

export default function WhatsAppModal({ isOpen, onClose, reportData, language = 'en' }) {
  const [phone, setPhone] = useState('+91 98765 43210');
  const [loading, setLoading] = useState(false);
  const [sentResult, setSentResult] = useState(null);

  if (!isOpen || !reportData) return null;

  const { patient, clinical_intelligence } = reportData;
  const flagCount = clinical_intelligence?.flag_count || 0;
  const flaggedMarkers = clinical_intelligence?.flagged_markers || [];
  const doctorQuestions = clinical_intelligence?.doctor_questions || [];

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await sendWhatsAppMessage({
        phone: phone,
        patient_name: patient?.name || 'Patient',
        flag_count: flagCount,
        flagged_tests: flaggedMarkers,
        doctor_questions: doctorQuestions,
        language: language
      });
      setSentResult(res);
    } catch (err) {
      console.error('WhatsApp send error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/30 border-b border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-bold text-slate-100">WhatsApp Delivery Dispatch</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Safety Notice */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong>Safety Certified:</strong> Contains deterministic lab flag counts and non-diagnostic phrasing. Urgency emojis and triage risk scores are strictly excluded.
            </p>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Patient WhatsApp Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Live Preview Box */}
          <div>
            <span className="block text-xs font-semibold text-slate-400 mb-1">
              Live Formatted Message Preview ({language.toUpperCase()})
            </span>
            <div className="p-4 bg-[#0b141a] rounded-xl border border-emerald-900/40 text-xs font-sans text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono">
              <div className="bg-[#1f2c34] p-3.5 rounded-lg border-l-4 border-emerald-500 shadow">
                {sentResult ? sentResult.body : (
                  `📋 *Lab Report Analysis Complete*\nHello ${patient?.name || 'Arjun'},\n\n*${flagCount} value(s)* were flagged outside standard laboratory reference intervals on your recent report:\n${flaggedMarkers.map(m => `• ${m}`).join('\n') || '• None'}\n\n*Suggested Questions to Ask Your Doctor:*\n${doctorQuestions.slice(0, 3).map((q, i) => `${i+1}. ${q}`).join('\n')}\n\nAccess your full structured report at MedLens Portal.`
                )}
              </div>
            </div>
          </div>

          {sentResult && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
              <span>✓ {sentResult.message || 'Dispatched via MedLens Messaging Engine'}</span>
              <span className="font-mono text-[10px] text-slate-400">Provider: {sentResult.provider}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-900/50 transition-all disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Dispatching...' : 'Send WhatsApp Message'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
