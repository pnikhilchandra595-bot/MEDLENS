import React from 'react';
import { 
  Activity, 
  UploadCloud, 
  FileText, 
  TrendingUp, 
  Shield, 
  Globe, 
  User, 
  RefreshCw,
  Sparkles,
  Presentation
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  patients = [],
  selectedPatientId,
  onSelectPatient,
  language,
  setLanguage,
  onReseed
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Tagline */}
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            onClick={() => setActiveTab('results')}
            aria-label="Go to MedLens results dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-white/20">
              <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-display">
                  MedLens
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  FHIR R4 • ABDM Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Clinical Report Intelligence & Patient Memory
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 text-xs font-medium">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload & Intake</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'results'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lab Viewer & AI</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'timeline'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Longitudinal Trends</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Consent & Rights</span>
            </button>

            <button
              onClick={() => setActiveTab('pitch')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'pitch'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-500/20'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Pitch Deck (12 Slides)</span>
            </button>
          </nav>

          {/* Right Controls: Patient Select, Language Toggle, Reseed */}
          <div className="flex items-center gap-2">
            
            {/* Patient Switcher */}
            <div className="relative flex items-center bg-slate-800/80 rounded-lg border border-slate-700/80 px-2 py-1 text-xs">
              <User className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              <select
                value={selectedPatientId || ''}
                onChange={(e) => onSelectPatient(e.target.value)}
                aria-label="Select Patient Profile"
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs pr-2"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                    {p.name} ({p.reports_count || 0} reports)
                  </option>
                ))}
              </select>
            </div>

            {/* Language Toggle (Phase 7 Localization) */}
            <div className="flex items-center bg-slate-800/80 rounded-lg border border-slate-700/80 p-0.5 text-xs">
              <span className="px-1 text-slate-400">
                <Globe className="w-3 h-3" />
              </span>
              <button
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  language === 'en' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  language === 'hi' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('te')}
                className={`px-1.5 py-0.5 rounded transition-all ${
                  language === 'te' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
            </div>

            {/* Reseed Demo Data */}
            <button
              onClick={onReseed}
              title="Reset and reseed demo datasets"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 border border-slate-700/80 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
