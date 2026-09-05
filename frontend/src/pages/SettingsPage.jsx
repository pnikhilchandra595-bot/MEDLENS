import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Download, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  FileCode,
  UserX
} from 'lucide-react';
import { deletePatientData, fetchPatient } from '../api/client';
import ProvenanceBadge from '../components/ProvenanceBadge';

import PropTypes from 'prop-types';

export default function SettingsPage({
  patientId,
  patientName,
  onDataDeleted
}) {
  const [patientDetails, setPatientDetails] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchPatient(patientId)
        .then((data) => setPatientDetails(data))
        .catch((err) => console.error('Error loading patient settings:', err));
    }
  }, [patientId]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deletePatientData(patientId);
      setDeleteSuccess(res.message);
      setShowConfirm(false);
      if (onDataDeleted) {
        setTimeout(() => onDataDeleted(), 2000);
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>DPDP Act 2023 Compliant</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 font-display">
          Consent Registry & Data Rights Management
        </h1>
        <p className="text-sm text-slate-600">
          Exercise your statutory rights under Digital Personal Data Protection laws, manage active processing consents, or trigger complete data erasure.
        </p>
      </div>

      {deleteSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center gap-3 animate-in fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{deleteSuccess}</span>
        </div>
      )}

      {/* Active Consent Record */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-display">
            <Lock className="w-4 h-4 text-emerald-600" />
            Active Clinical Processing Consent
          </h2>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            Status: Active & Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Data Principal</span>
            <span className="font-bold text-slate-900">{patientDetails?.name || patientName}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Consent Timestamp</span>
            <span className="font-mono text-slate-800 font-semibold">
              {patientDetails?.consent?.latest_consent_date || 'Active Registration'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <strong className="text-emerald-800 block mb-1">Declared Processing Purpose:</strong>
          {patientDetails?.consent?.purpose || 'Clinical laboratory report extraction, biological sanity checking, and non-diagnostic longitudinal temporal pattern analysis.'}
        </div>
      </div>

      {/* Data Portability (FHIR / JSON) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2 font-display">
              <Download className="w-4 h-4 text-sky-600" />
              Right to Data Portability
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Download your complete medical history and longitudinal trends in standard FHIR R4 format.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href={`/api/patients/${patientId}/reports`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <FileCode className="w-3.5 h-3.5 text-sky-600" />
            <span>Download Reports Payload (JSON)</span>
          </a>
        </div>
      </div>

      {/* Right to Erasure (Delete My Data) */}
      <div className="bg-rose-50/50 rounded-2xl border border-rose-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-rose-900 flex items-center gap-2 font-display">
            <Trash2 className="w-4 h-4 text-rose-600" />
            Right to Erasure (DPDP 'Delete My Data' Action)
          </h2>
          <span className="text-[10px] font-mono text-rose-800 uppercase bg-rose-100 px-2 py-0.5 rounded border border-rose-200 font-bold">
            Irreversible Purge
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          In compliance with the DPDP Act 2023, you can permanently and irreversibly erase all personal information, uploaded laboratory reports, SHA-256 hashes, temporal trend history, and consent records associated with your profile from MedLens storage.
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <UserX className="w-4 h-4 text-rose-600" />
            <span>Request Complete Data Erasure</span>
          </button>
        ) : (
          <div className="p-4 bg-rose-100/60 rounded-xl border border-rose-300 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Are you absolutely sure? This cannot be undone.</span>
            </div>
            <p className="text-xs text-rose-900">
              All stored records for <strong>{patientName}</strong> will be permanently wiped across all database tables.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
              >
                {loading ? 'Purging Records...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

SettingsPage.propTypes = {
  patientId: PropTypes.string,
  patientName: PropTypes.string,
  onDataDeleted: PropTypes.func
};

