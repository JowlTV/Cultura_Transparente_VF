import React, { useState } from 'react';
import {
  Landmark,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  X,
  Search,
  Film,
  Sparkles,
  Code2,
  Palette,
  Theater,
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
  const [isHovered, setIsHovered] = useState(false);

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  // Expanded on desktop if hovered, or on mobile if isOpen
  const isExpandedDesktop = isHovered;

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

      {/* Lateral Menu (Sidebar in Roxo Profundo #2D0652) with Auto-Minimize on Hover */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#2D0652] text-white border-r border-[#3D0B6D] shadow-2xl flex flex-col justify-between transition-all duration-300 ease-in-out overflow-x-hidden ${
          isOpen
            ? 'w-72 sm:w-80 translate-x-0'
            : `-translate-x-full lg:sticky lg:top-0 lg:h-screen lg:self-start lg:translate-x-0 ${
                isExpandedDesktop ? 'lg:w-80' : 'lg:w-20'
              }`
        }`}
      >
        {/* Sidebar Header: Brand Logo & Context Badges */}
        <div className="p-4 sm:p-5 border-b border-[#3D0B6D]/80 shrink-0 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-2 min-w-0">
              {/* White monochrome logo over Roxo Profundo background */}
              <div className="transition-all duration-300 flex items-center">
                {isExpandedDesktop || isOpen ? (
                  <CultCircuitoLogo size="lg" variant="white" className="p-0 transition-opacity duration-300 opacity-100" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6A0DAD] to-[#FF4500] flex items-center justify-center border border-purple-400/40 shadow-xs shrink-0 cursor-pointer group" title="Cult Circuito Viamão · Cultura & Artes">
                    <Palette className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
                  </div>
                )}
              </div>
              
              {/* Context Badges */}
              {(isExpandedDesktop || isOpen) && (
                <div className="flex items-center gap-2 mt-1 animate-in fade-in duration-200">
                  <span className="inline-flex items-center text-[11px] font-bold text-white bg-[#6A0DAD] px-2.5 py-0.5 rounded-full border border-purple-400/40 whitespace-nowrap">
                    Cultura Transparente
                  </span>
                  <span className="inline-flex items-center text-[11px] font-bold text-[#FF4500] bg-[#FFE8E0] px-2 py-0.5 rounded-full border border-[#FF4500]/40 whitespace-nowrap">
                    Viamão · RS
                  </span>
                </div>
              )}
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
          {(isExpandedDesktop || isOpen) && (
            <p className="text-[11px] font-medium text-purple-200/80 mt-3 leading-snug border-t border-[#3D0B6D]/60 pt-2.5 animate-in fade-in duration-200">
              Plataforma cidadã de transparência pública, editais e fomento cultural.
            </p>
          )}

          {/* Quick Search trigger in sidebar */}
          <button
            onClick={() => {
              onClose();
              onOpenQuickSearch();
            }}
            title="Busca Rápida (Ctrl+K)"
            className={`mt-3 flex items-center rounded-xl border border-purple-500/30 transition-all cursor-pointer ${
              isExpandedDesktop || isOpen
                ? 'w-full justify-between px-3 py-2 text-xs text-purple-100 bg-[#21043D] hover:bg-[#6A0DAD]/30'
                : 'w-10 h-10 justify-center p-0 bg-[#21043D] hover:bg-[#6A0DAD]/40 mx-auto'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-4 h-4 text-[#FF4500] shrink-0" />
              {(isExpandedDesktop || isOpen) && (
                <span className="font-medium truncate">Busca Rápida</span>
              )}
            </div>
            {(isExpandedDesktop || isOpen) && (
              <kbd className="text-[10px] font-mono bg-[#2D0652] px-1.5 py-0.5 rounded border border-purple-400/40 text-purple-200 shrink-0">
                Ctrl+K
              </kbd>
            )}
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-1.5 scrollbar-thin overflow-x-hidden">
          {(isExpandedDesktop || isOpen) && (
            <div className="px-3 py-1 text-[10px] font-bold text-white/70 uppercase tracking-wider animate-in fade-in duration-200">
              Navegação Principal
            </div>
          )}

          {navTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => handleSelect(tab.id)}
                title={tab.label}
                className={`w-full flex items-center rounded-xl text-xs transition-all duration-200 group cursor-pointer ${
                  isExpandedDesktop || isOpen
                    ? 'justify-between px-3.5 py-2.5'
                    : 'justify-center p-2.5'
                } ${
                  isActive
                    ? 'bg-[#6A0DAD] text-white font-bold shadow-lg shadow-purple-950/40 border border-white/20'
                    : 'text-purple-100/80 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <div className={`flex items-center gap-2.5 ${isExpandedDesktop || isOpen ? 'truncate' : 'justify-center'}`}>
                  <span className="text-base shrink-0 transition-transform group-hover:scale-110">{tab.icon}</span>
                  {(isExpandedDesktop || isOpen) && (
                    <span className="truncate whitespace-nowrap">{tab.label}</span>
                  )}
                  {(isExpandedDesktop || isOpen) && tab.badge && (
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
        <div className="p-3 sm:p-4 border-t border-[#3D0B6D]/80 bg-[#21043D] shrink-0 space-y-2 text-[11px] text-purple-200/70 overflow-hidden">
          {isExpandedDesktop || isOpen ? (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 font-bold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Controle Social Ativo</span>
              </div>
              <p className="text-[10px] text-purple-200/80 leading-tight">
                Em conformidade com a <strong>Lei nº 12.527/2011</strong> (LAI) e <strong>LC nº 131/2009</strong>.
              </p>
              <div className="pt-1 text-[10px] text-white/70 flex items-center justify-between">
                <span className="truncate">Município de Viamão / RS</span>
                <span className="font-mono text-[9px] bg-[#2D0652] px-1.5 py-0.5 rounded text-purple-200 border border-purple-500/30 shrink-0">v2.5</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-1 gap-1" title="Controle Social Ativo (LAI / LC 131)">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="text-[9px] font-bold text-white/60">LAI</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

