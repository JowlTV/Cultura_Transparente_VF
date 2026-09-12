import React from 'react';
import {
  Landmark,
  FileSpreadsheet,
  BarChart3,
  Coins,
  Building2,
  ShieldCheck,
  X,
  Search,
  ExternalLink
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
  { id: 'emendas', label: 'Planilha de Emendas', icon: '📋', lucideIcon: <FileSpreadsheet className="w-4 h-4" /> },
  { id: 'painel', label: 'Painel Orçamentário', icon: '📊', lucideIcon: <BarChart3 className="w-4 h-4" /> },
  { id: 'pnab', label: 'PNAB / Auditoria', icon: '💰', lucideIcon: <Coins className="w-4 h-4" /> },
  { id: 'acompanhe-cultura', label: 'Acompanhe a Cultura', icon: '🎭', lucideIcon: <Building2 className="w-4 h-4" /> },
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

      {/* Lateral Menu (Sidebar) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#10071e] border-r border-purple-900/40 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:translate-x-0'
        }`}
      >
        {/* Brand Color Ribbon (#6A0DAD, #FF4500, Branco, #6A0DAD) */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="h-full w-1/4 bg-[#6A0DAD]"></div>
          <div className="h-full w-1/4 bg-[#FF4500]"></div>
          <div className="h-full w-1/4 bg-white/20"></div>
          <div className="h-full w-1/4 bg-[#6A0DAD]"></div>
        </div>

        {/* Sidebar Header: Municipal Portal Identity */}
        <div className="p-5 border-b border-purple-900/30 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <CultCircuitoLogo size="lg" className="py-1" />
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block text-[11px] font-bold text-white bg-[#6A0DAD] px-2.5 py-0.5 rounded-md border border-purple-400/40">
                  Cultura Transparente
                </span>
                <span className="inline-block text-[11px] font-bold text-orange-200 bg-[#FF4500]/30 px-2 py-0.5 rounded-md border border-orange-500/40">
                  Viamão - RS
                </span>
              </div>
            </div>

            {/* Close Button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-purple-900/40"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle / Civic Mission */}
          <p className="text-[11px] font-medium text-purple-200/70 mt-2.5 leading-snug border-t border-purple-900/30 pt-2">
            Plataforma de acesso à informação, controle social e centralização de dados.
          </p>

          {/* Quick Search trigger in sidebar */}
          <button
            onClick={() => {
              onClose();
              onOpenQuickSearch();
            }}
            className="w-full mt-3 flex items-center justify-between px-3 py-2 text-xs text-slate-300 bg-[#170c2c] hover:bg-purple-900/40 rounded-xl border border-purple-900/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Busca Rápida</span>
            </div>
            <kbd className="text-[10px] font-mono bg-[#10071e] px-1.5 py-0.5 rounded border border-purple-800/40 text-purple-300">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold text-purple-400/60 uppercase tracking-wider">
            Menu de Navegação
          </div>

          {navTabs.map(tab => {
            const isActive =
              activeTab === tab.id ||
              (tab.id === 'centros-culturais' && (activeTab === 'mapa' || activeTab === 'redes'));
            return (
              <button
                key={tab.id}
                id={`sidebar-tab-${tab.id}`}
                onClick={() => handleSelect(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#6A0DAD] text-white shadow-lg shadow-purple-950/50 font-bold ring-1 ring-purple-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && (
                  <span className="w-2 h-2 rounded-full bg-[#FF4500] shrink-0 ring-2 ring-white/40"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Legal Grounding */}
        <div className="p-4 border-t border-purple-900/30 bg-[#0d0519] shrink-0 space-y-2 text-[11px] text-purple-300/60">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Transparência Pública Ativa</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Pautada na <strong>Lei nº 12.527/2011</strong> (LAI) e na <strong>LC nº 131/2009</strong>.
          </p>
          <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Município de Viamão / RS</span>
            <span className="font-mono text-[9px] bg-purple-950/80 px-1 py-0.5 rounded text-purple-200 border border-purple-800/40">v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
};
