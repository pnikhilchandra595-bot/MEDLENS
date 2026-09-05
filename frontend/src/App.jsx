import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import TimelinePage from './pages/TimelinePage';
import SettingsPage from './pages/SettingsPage';
import PitchDeckPage from './pages/PitchDeckPage';
import ClinicianPdfTemplate from './components/ClinicianPdfTemplate';
import { fetchPatients, fetchPatientReports, fetchReportDetails, fetchGlossary, reseedDatabase } from './api/client';

export default function App() {
  const [activeTab, setActiveTab] = useState('results'); // 'upload' | 'results' | 'timeline' | 'settings' | 'pitch' | 'pdf'
  const [language, setLanguage] = useState('en'); // 'en' | 'hi' | 'te'
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('pat-arjun-sharma');
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [currentReportData, setCurrentReportData] = useState(null);
  const [glossary, setGlossary] = useState({});
  const [loading, setLoading] = useState(true);

  // Load initial patients & glossary
  useEffect(() => {
    Promise.all([fetchPatients(), fetchGlossary()])
      .then(([patientsData, glossaryData]) => {
        setPatients(patientsData || []);
        setGlossary(glossaryData || {});
        if (patientsData && patientsData.length > 0) {
          const defaultPat = patientsData.find(p => p.id === 'pat-p-vijay-kumar') || patientsData[0];
          setSelectedPatientId(defaultPat.id);
        }
      })
      .catch((err) => console.error('Initial load error:', err))
      .finally(() => setLoading(false));
  }, []);

  // When selected patient changes, load their reports
  useEffect(() => {
    if (selectedPatientId) {
      fetchPatientReports(selectedPatientId)
        .then((reports) => {
          if (reports && reports.length > 0) {
            const latest = reports[reports.length - 1];
            setSelectedReportId(latest.id);
          } else {
            setSelectedReportId(null);
            setCurrentReportData(null);
          }
        })
        .catch((err) => console.error('Error fetching patient reports:', err));
    }
  }, [selectedPatientId]);

  // When report or language changes, fetch full report details
  useEffect(() => {
    if (selectedReportId) {
      fetchReportDetails(selectedReportId, language, selectedPatientId)
        .then((data) => setCurrentReportData(data))
        .catch((err) => console.error('Error fetching report details:', err));
    }
  }, [selectedReportId, language, selectedPatientId]);

  const handlePatientSelect = (patId) => {
    setSelectedPatientId(patId);
  };

  const handleUploadSuccess = (reportId, patientId) => {
    setSelectedPatientId(patientId);
    setSelectedReportId(reportId);
    setActiveTab('results');
    fetchPatients().then(setPatients);
  };

  const handleSelectQuickDemo = (demoType) => {
    if (demoType === 'vijay') {
      const vijay = patients.find(p => p.id === 'pat-p-vijay-kumar' || p.name.includes('Vijay'));
      if (vijay) {
        setSelectedPatientId(vijay.id);
        fetchPatientReports(vijay.id).then((reps) => {
          if (reps && reps.length > 0) {
            setSelectedReportId(reps[reps.length - 1].id);
          }
          setActiveTab('results');
        });
      }
    } else if (demoType === 'arjun') {
      const arjun = patients.find(p => p.id === 'pat-arjun-sharma' || p.name.includes('Arjun'));
      if (arjun) {
        setSelectedPatientId(arjun.id);
        fetchPatientReports(arjun.id).then((reps) => {
          if (reps && reps.length > 0) {
            setSelectedReportId(reps[reps.length - 1].id);
          }
          setActiveTab('results');
        });
      }
    } else if (demoType === 'kavita') {
      const kavita = patients.find(p => p.id === 'pat-kavita-patel' || p.name.includes('Kavita'));
      if (kavita) {
        setSelectedPatientId(kavita.id);
        fetchPatientReports(kavita.id).then((reps) => {
          if (reps && reps.length > 0) {
            setSelectedReportId(reps[0].id);
          }
          setActiveTab('results');
        });
      }
    }
  };

  const handleReseed = async () => {
    await reseedDatabase();
    const pats = await fetchPatients();
    setPatients(pats || []);
    if (pats && pats.length > 0) {
      setSelectedPatientId(pats[0].id);
    }
    setActiveTab('results');
  };

  const currentPatient = patients.find(p => p.id === selectedPatientId);

  // If in printable PDF mode
  if (activeTab === 'pdf') {
    return (
      <ClinicianPdfTemplate
        reportData={currentReportData}
        onBack={() => setActiveTab('results')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Skip to Content Link for Keyboard / Screen Reader Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-400 focus:text-slate-950 focus:font-bold focus:rounded-xl focus:shadow-2xl focus:ring-2 focus:ring-emerald-300"
      >
        Skip to main content
      </a>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={handlePatientSelect}
        language={language}
        setLanguage={setLanguage}
        onReseed={handleReseed}
      />

      {/* Main Page Body Landmark */}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {activeTab === 'upload' && (
          <UploadPage
            selectedPatient={currentPatient}
            onUploadSuccess={handleUploadSuccess}
            onSelectQuickDemo={handleSelectQuickDemo}
          />
        )}

        {activeTab === 'results' && (
          <ResultsPage
            reportData={currentReportData}
            glossary={glossary}
            language={language}
            onExportPdf={() => setActiveTab('pdf')}
            onViewTimeline={() => setActiveTab('timeline')}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelinePage
            patientId={selectedPatientId}
            patientName={currentPatient?.name}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            patientId={selectedPatientId}
            patientName={currentPatient?.name}
            onDataDeleted={handleReseed}
          />
        )}

        {activeTab === 'pitch' && (
          <PitchDeckPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>MedLens Platform</strong> • Clinical Laboratory Intelligence & Temporal Patient Memory
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>HL7 FHIR R4 Ready</span>
            <span>•</span>
            <span>ABDM India NRCeS Ready</span>
            <span>•</span>
            <span>DPDP Act 2023 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
