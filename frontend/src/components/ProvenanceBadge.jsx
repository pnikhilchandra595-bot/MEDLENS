import React from 'react';
import { User, FileText, Sparkles } from 'lucide-react';

export default function ProvenanceBadge({ source = 'Extracted from report', size = 'sm' }) {
  let badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let Icon = FileText;
  let label = 'Extracted from report';

  if (source.includes('Patient') || source === 'Patient-reported') {
    badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    Icon = User;
    label = 'Patient-reported';
  } else if (source.includes('AI') || source === 'AI-generated') {
    badgeStyle = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    Icon = Sparkles;
    label = 'AI-generated';
  }

  const sizeClasses = size === 'xs' 
    ? 'text-[10px] px-1.5 py-0.5 gap-1' 
    : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      title={`Provenance Source: ${label}`}
      className={`inline-flex items-center font-medium rounded-full border transition-all duration-200 ${badgeStyle} ${sizeClasses}`}
    >
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      <span>{label}</span>
    </span>
  );
}
