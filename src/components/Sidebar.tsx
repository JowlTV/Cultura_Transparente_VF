import React from 'react';
import {
  Landmark,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  X,
  Search,
  Film,
  Sparkles,
  Code2
} from 'lucide-react';
import { CultCircuitoLogo } from './CultCircuitoLogo';

export interface NavTabItem {
  id: string;
  label: string;
  icon: string;
  lucideIcon?: React.ReactNode;
  badge?: string;
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickSearch: () => void;
}

export const navTabs: NavTabItem[] = [
  { id: 'visao-geral', label: 'Visão Geral & Editais', icon: '🏛️', lucideIcon: <Landmark className="w-4 h-4" /> },
  { id: 'emendas', label: 'Emendas Parlamentares', icon: '📋', lucideIcon: <FileSpreadsheet className="w-4 h-4" /> },
  { id: 'pnab', label: 'PNAB / Auditoria', icon: '💰', lucideIcon: <Coins className="w-4 h-4" /> },
  { id: 'lpg', label: 'Lei Paulo Gustavo (LPG)', icon: '🎬', lucideIcon: <Film className="w-4 h-4" /> },
  { id: 'auxilio-fazedor', label: 'Auxílio ao Fazedor de Cultura', icon: '✨', lucideIcon: <Sparkles className="w-4 h-4" />, badge: 'Novo' },
  { id: 'apis', label: 'APIs & Dados Abertos', icon: '⚡', lucideIcon: <Code2 className="w-4 h-4" /> },
  { id: 'controle-social', label: 'Controle Social & LAI', icon: '🛡️', lucideIcon: <ShieldCheck className="w-4 h-4" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onOpenQuickSearch,
}) => {
  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Lateral Menu (Sidebar in Roxo Profundo #2D0652) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#2D0652] text-white border-r border-[#3D0B6D] shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header: Brand Logo & Context Badges */}
        <div className="p-5 border-b border-[#3D0B6D]/80 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2">
              {/* White monochrome logo over Roxo Profundo background */}
              <CultCircuitoLogo size="lg" variant="white" className="p-0" />
              
              {/* Context Badges (Seção 05 do Manual) */}
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center text-[11px] font-bold text-white bg-[#6A0DAD] px-2.5 py-0.5 rounded-full border border-purple-400/40">
                  Cultura Transparente
                </span>
                <span className="inline-flex items-center text-[11px] font-bold text-[#FF4500] bg-[#FFE8E0] px-2 py-0.5 rounded-full border border-[#FF4500]/40">
                  Viamão · RS
                </span>
              </div>
            </div>

            {/* Close Button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-purple-200 hover:text-white rounded-lg hover:bg-white/10"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle / Civic Mission */}
          <p className="text-[11px] font-medium text-purple-200/80 mt-3 leading-snug border-t border-[#3D0B6D]/60 pt-2.5">
            Plataforma cidadã de transparência pública, editais e fomento cultural.
          </p>

          {/* Quick Search trigger in sidebar */}
          <button
            onClick={() => {
              onClose();
              onOpenQuickSearch();
            }}
            className="w-full mt-3 flex items-center justify-between px-3 py-2 text-xs text-purple-100 bg-[#21043D] hover:bg-[#6A0DAD]/30 rounded-xl border border-purple-500/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#FF4500]" />
              <span className="font-medium">Busca Rápida</span>
            </div>
            <kbd className="text-[10px] font-mono bg-[#2D0652] px-1.5 py-0.5 rounded border border-purple-400/40 text-purple-200">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <div className="px-3 py-1 text-[10px] font-bold text-white/70 uppercase tracking-wider">
            Navegação Principal
          </div>

          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => handleSelect(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#6A0DAD] text-white font-bold shadow-lg shadow-purple-950/40 border border-white/20'
                    : 'text-purple-100/80 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-bold bg-[#FF4500] text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider shrink-0">
                      {tab.badge}
                    </span>
                  )}
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#FF4500] shrink-0 ring-2 ring-white/60"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Legal Grounding */}
        <div className="p-4 border-t border-[#3D0B6D]/80 bg-[#21043D] shrink-0 space-y-2 text-[11px] text-purple-200/70">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Controle Social Ativo</span>
          </div>
          <p className="text-[10px] text-purple-200/80 leading-tight">
            Em conformidade com a <strong>Lei nº 12.527/2011</strong> (LAI) e <strong>LC nº 131/2009</strong>.
          </p>
          <div className="pt-1 text-[10px] text-white/70 flex items-center justify-between">
            <span>Município de Viamão / RS</span>
            <span className="font-mono text-[9px] bg-[#2D0652] px-1.5 py-0.5 rounded text-purple-200 border border-purple-500/30">v2.5</span>
          </div>
        </div>
      </aside>
    </>
  );
};
