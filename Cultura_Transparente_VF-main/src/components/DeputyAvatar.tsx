import React from 'react';
import { User, Landmark } from 'lucide-react';

interface DeputyAvatarProps {
  nome: string;
  partido?: string;
  partidoSigla?: string;
  fotoUrl?: string; // Kept in interface for backward compatibility, but deliberately unused for neutrality
  layout?: 'compact' | 'vertical' | 'card' | 'badge';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Neutral civic party style matching transparency guidelines
export const getPartyStyle = (partido?: string) => {
  const p = (partido || '').toUpperCase();
  if (p.includes('PT')) {
    return {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      dot: 'bg-red-600',
    };
  }
  if (p.includes('PSDB')) {
    return {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
      dot: 'bg-blue-600',
    };
  }
  if (p.includes('PSOL')) {
    return {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
      dot: 'bg-amber-600',
    };
  }
  if (p.includes('REPUBLICANOS') || p.includes('REP')) {
    return {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      badgeBg: 'bg-sky-50 text-sky-900 border-sky-200',
      dot: 'bg-sky-600',
    };
  }
  if (p.includes('MDB')) {
    return {
      border: 'border-slate-300',
      bg: 'bg-slate-50',
      text: 'text-slate-800',
      badgeBg: 'bg-emerald-50 text-emerald-900 border-emerald-200',
      dot: 'bg-emerald-600',
    };
  }
  return {
    border: 'border-slate-300',
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
    dot: 'bg-slate-600',
  };
};

/**
 * Institutional Parliamentary Component
 * Completely neutral, transparent, without personal photos/images of politicians.
 */
export const DeputyAvatar: React.FC<DeputyAvatarProps> = ({
  nome,
  partido = 'Independente',
  partidoSigla,
  layout = 'compact',
  className = '',
}) => {
  const partyStyle = getPartyStyle(partido);
  const partyDisplay = partidoSigla || partido.replace(/\(.*?\)/g, '').trim();

  // Purely textual & institutional representation (Zero photos/images)
  if (layout === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs bg-slate-100 text-slate-800 border border-slate-200 font-medium ${className}`}>
        <Landmark className="w-3 h-3 text-slate-500" />
        <span>{nome}</span>
        <span className="font-bold text-slate-900 font-mono">({partyDisplay})</span>
      </span>
    );
  }

  if (layout === 'vertical' || layout === 'card') {
    return (
      <div className={`flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 ${className}`}>
        <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
          <Landmark className="w-3.5 h-3.5 text-[#1e40af]" />
        </div>
        <div className="min-w-0 leading-tight text-left">
          <div className="text-xs font-semibold text-slate-900 truncate" title={nome}>
            {nome}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Partido:</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${partyStyle.badgeBg}`}>
              {partyDisplay}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Compact layout for tables / spreadsheets
  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="text-xs font-medium text-slate-800 truncate" title={nome}>
        {nome}
      </span>
      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-mono">
        {partyDisplay}
      </span>
    </div>
  );
};
