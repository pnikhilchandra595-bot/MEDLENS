/**
 * @file PitchDeckPage.jsx
 * @description 12-Slide Interactive Clinical Pitch Deck for MedLens.
 * Features keyboard navigation (Left/Right arrows), fullscreen toggle,
 * and comprehensive clinical architecture walkthrough.
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Minimize2,
  Sparkles
} from 'lucide-react';
import { PITCH_SLIDES } from '../components/pitch/slidesData';

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard Navigation (Left / Right arrows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, PITCH_SLIDES.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slide = PITCH_SLIDES[currentSlide];

  return (
    <div className={`max-w-6xl mx-auto space-y-6 pb-16 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-6 overflow-y-auto max-w-none' : ''}`}>
      {/* Top Deck Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              MedLens Executive Presentation Deck
            </h2>
            <p className="text-[11px] text-slate-400">
              Slide {currentSlide + 1} of {PITCH_SLIDES.length} • Use Arrow Keys to Navigate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Slide Selector Dots */}
          <div className="hidden md:flex items-center gap-1.5" role="tablist" aria-label="Presentation Slides">
            {PITCH_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={currentSlide === idx ? 'true' : 'false'}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  currentSlide === idx
                    ? 'bg-emerald-400 w-6'
                    : 'bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              type="button"
              onClick={() => setCurrentSlide((p) => Math.max(p - 1, 0))}
              disabled={currentSlide === 0}
              aria-label="Previous Slide"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentSlide((p) => Math.min(p + 1, PITCH_SLIDES.length - 1))}
              disabled={currentSlide === PITCH_SLIDES.length - 1}
              aria-label="Next Slide"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors ml-1"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Maximize2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Active Slide Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              {slide.tag}
            </span>
            <span className="text-xs font-mono text-slate-500">
              {String(slide.number).padStart(2, '0')} / {String(PITCH_SLIDES.length).padStart(2, '0')}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
              {slide.title}
            </h1>
            <p className="text-sm text-slate-400">
              {slide.subtitle}
            </p>
          </div>

          {/* Slide Dynamic Body Content */}
          <div className="pt-2">
            {slide.content}
          </div>
        </div>

        {/* Slide Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-500 relative z-10">
          <span>MedLens Clinical Intelligence Platform</span>
          <span className="font-mono text-emerald-400">ABDM • FHIR R4 • DPDP Act 2023</span>
        </div>
      </div>
    </div>
  );
}
