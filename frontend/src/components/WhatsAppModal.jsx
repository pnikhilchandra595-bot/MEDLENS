import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MessageSquare, Send, CheckCircle2, X, ShieldAlert, Phone } from 'lucide-react';
import { sendWhatsAppMessage } from '../api/client';

export default function WhatsAppModal({ isOpen, onClose, reportData, language = 'en' }) {
  const [phone, setPhone] = useState('+91 98765 43210');
  const [loading, setLoading] = useState(false);
  const [sentResult, setSentResult] = useState(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
      aria-describedby="whatsapp-modal-desc"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950/30 border-b border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400">
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            <h3 id="whatsapp-modal-title" className="font-bold text-slate-100">WhatsApp Delivery Dispatch</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close WhatsApp delivery modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4" id="whatsapp-modal-desc">
          {/* Safety Notice */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <p>
              <strong>Safety Certified:</strong> Contains deterministic lab flag counts and non-diagnostic phrasing. Urgency emojis and triage risk scores are strictly excluded.
            </p>
          </div>

          <div>
            <label htmlFor="whatsapp-phone-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Recipient WhatsApp Mobile
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" aria-hidden="true" />
              <input
                id="whatsapp-phone-input"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Message Preview */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Structured Template Payload Preview ({language.toUpperCase()})
            </label>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 whitespace-pre-wrap leading-relaxed max-h-52 overflow-y-auto" tabIndex={0}>
              <p className="font-semibold text-emerald-400">🩺 MedLens Verified Lab Summary</p>
              <p>Hello {patient?.name || 'Patient'}, your laboratory report has been processed.</p>
              <p>• Flagged Parameters: {flagCount} of {reportData?.results?.length || 0}</p>
              {flaggedMarkers.length > 0 && (
                <p>• Outside Bounds: {flaggedMarkers.join(', ')}</p>
              )}
              {doctorQuestions.length > 0 && (
                <p>• Discussion Questions: {doctorQuestions.slice(0, 2).join(' ')}</p>
              )}
              <p className="text-[10px] text-slate-500 italic mt-2">
                Note: Strictly educational summary with provenance. Does not replace professional clinical evaluation.
              </p>
            </div>
          </div>

          {/* Result Alert */}
          {sentResult && (
            <div className={`p-4 rounded-xl border text-xs space-y-1 animate-in fade-in ${
              sentResult.status === 'sent'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-teal-950/40 border-teal-500/30 text-teal-300'
            }`}>
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>
                  {sentResult.status === 'sent' ? 'Live WhatsApp Dispatch Successful' : 'Demo Dispatch Logged'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Provider: <span className="font-mono text-emerald-400">{sentResult.provider}</span>
                {sentResult.sid && ` • SID: ${sentResult.sid.slice(0, 12)}...`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span>Dispatching...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Send via WhatsApp</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

WhatsAppModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reportData: PropTypes.object,
  language: PropTypes.string
};
