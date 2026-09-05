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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Tagline */}
          <button
            type="button"
            className="flex items-center gap-3 cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
            onClick={() => setActiveTab('results')}
            aria-label="Go to MedLens results dashboard"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-600/30">
              <Activity className="w-6 h-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-display">
                  MedLens
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  FHIR R4 • ABDM Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Clinical Report Intelligence & Patient Memory
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload & Intake</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'results'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lab Viewer & AI</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'timeline'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Longitudinal Trends</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'settings'
                  ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Consent & Rights</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pitch')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'pitch'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-sm'
                  : 'text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Pitch Deck (12 Slides)</span>
            </button>
          </nav>

          {/* Right Controls: Patient Select, Language Toggle, Reseed */}
          <div className="flex items-center gap-2">
            
            {/* Patient Switcher */}
            <div className="relative flex items-center bg-slate-100/90 rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs shadow-2xs">
              <User className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
              <select
                value={selectedPatientId || ''}
                onChange={(e) => onSelectPatient(e.target.value)}
                aria-label="Select Patient Profile"
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs pr-2"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white text-slate-800">
                    {p.name} ({p.reports_count || 0} reports)
                  </option>
                ))}
              </select>
            </div>

            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100/90 rounded-xl border border-slate-300 p-0.5 text-xs">
              <span className="px-1 text-slate-500">
                <Globe className="w-3 h-3" />
              </span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  language === 'en' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  language === 'hi' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('te')}
                className={`px-1.5 py-0.5 rounded-lg transition-all ${
                  language === 'te' ? 'bg-emerald-600 text-white font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                తెలుగు
              </button>
            </div>

            {/* Reseed Demo Data */}
            <button
              type="button"
              onClick={onReseed}
              title="Reset and reseed demo datasets"
              aria-label="Reset and reseed demo datasets"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 border border-slate-300 transition-colors shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
