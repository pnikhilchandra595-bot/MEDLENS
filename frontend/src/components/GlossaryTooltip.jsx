import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

export default function GlossaryTooltip({ testName, glossary = {}, children }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!testName) return children;

  const key = testName.toLowerCase().trim();
  const explanation = glossary[key] || 
    Object.entries(glossary).find(([k]) => key.includes(k) || k.includes(key))?.[1];

  if (!explanation) {
    return <span className="inline-flex items-center">{children}</span>;
  }

  return (
    <div 
      className="relative inline-flex items-center group cursor-help"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      <span className="border-b border-dotted border-slate-400 group-hover:border-emerald-400 group-hover:text-emerald-300 transition-colors">
        {children}
      </span>
      <HelpCircle className="w-3.5 h-3.5 ml-1 text-slate-400 group-hover:text-emerald-400 transition-colors" />

      {isOpen && (
        <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 rounded-lg shadow-xl shadow-black/50 text-xs text-slate-200 leading-relaxed pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
            <span>💡 Plain-English Guide</span>
          </div>
          <p>{explanation}</p>
          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400">
            Click anywhere or move mouse away to close
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
