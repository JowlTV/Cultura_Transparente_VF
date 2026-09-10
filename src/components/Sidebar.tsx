import React from 'react';
import {
  Landmark,
  FileSpreadsheet,
  BarChart3,
  Coins,
  Scale,
  Building2,
  Radio,
  Code2,
  ShieldCheck,
  X,
  Search,
  ExternalLink,
  Film,
  Sparkles
} from 'lucide-react';

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
  { id: 'fac', label: 'Fundo de Apoio à Cultura (FAC)', icon: '🏛️', lucideIcon: <Landmark className="w-4 h-4" /> },
  { id: 'lpg', label: 'Lei Paulo Gustavo (LPG)', icon: '🎬', lucideIcon: <Film className="w-4 h-4" /> },
  { id: 'rouanet', label: 'Lei Rouanet (SalicNet)', icon: '✨', lucideIcon: <Sparkles className="w-4 h-4" /> },
  { id: 'acompanhe-cultura', label: 'Acompanhe a Cultura', icon: '🎭', lucideIcon: <Building2 className="w-4 h-4" /> },
  { id: 'apis', label: 'APIs & Fontes Oficiais', icon: '🔌', lucideIcon: <Code2 className="w-4 h-4" /> },
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-white border-r border-slate-200 shadow-xl lg:shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:translate-x-0'
        }`}
      >
        {/* Flag Color Ribbon (Azul, Branco, Vermelho, Verde de Viamão) */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="h-full w-1/4 bg-[#1e40af]"></div>
          <div className="h-full w-1/4 bg-white"></div>
          <div className="h-full w-1/4 bg-[#dc2626]"></div>
          <div className="h-full w-1/4 bg-[#15803d]"></div>
        </div>

        {/* Sidebar Header: Municipal Portal Identity */}
        <div className="p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1e40af] via-[#1d4ed8] to-[#dc2626] text-white flex items-center justify-center text-xl shadow-xs border border-blue-900/20 shrink-0">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-900 font-['Outfit'] tracking-tight">
                    Cultura Transparente
                  </span>
                </div>
                <span className="inline-block text-[11px] font-bold text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Viamão - RS
                </span>
              </div>
            </div>

            {/* Close Button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              aria-label="Fechar menu lateral"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle / Civic Mission */}
          <p className="text-[11px] font-medium text-slate-500 mt-2.5 leading-snug border-t border-slate-100 pt-2">
            Plataforma de Acesso à Informação, Controle Social e Isenção Orçamentária
          </p>

          {/* Quick Search trigger in sidebar */}
          <button
            onClick={() => {
              onClose();
              onOpenQuickSearch();
            }}
            className="w-full mt-3 flex items-center justify-between px-3 py-2 text-xs text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Busca Rápida</span>
            </div>
            <kbd className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-300 text-slate-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                    ? 'bg-[#1e40af] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-base shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300 shrink-0"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Legal Grounding */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Transparência Pública Ativa</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Pautada na <strong>Lei nº 12.527/2011</strong> (LAI) e na <strong>LC nº 131/2009</strong>.
          </p>
          <div className="pt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Município de Viamão / RS</span>
            <span className="font-mono text-[9px] bg-slate-200/80 px-1 py-0.5 rounded text-slate-600">v2.4</span>
          </div>
        </div>
      </aside>
    </>
  );
};
