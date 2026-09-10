import React from 'react';
import { Menu, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import { MincNewsTicker } from './MincNewsTicker';

interface HeaderProps {
  onToggleSidebar: () => void;
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenQuickSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onOpenQuickSearch,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-2xs">
      {/* Top Bar: Ministério da Cultura News Ticker (Alternando novidades do MinC) */}
      <MincNewsTicker />

      {/* Sub-Header Bar: Controls, Civic Welcome & Sync Status */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Mobile Menu Button & Platform Label */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-['Outfit'] hidden sm:inline">
              MUNICÍPIO DE VIAMÃO / RS
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-[11px] font-semibold text-slate-600">
              Plataforma de Acesso à Informação, Controle Social e Isenção Orçamentária
            </span>
          </div>
        </div>

        {/* Right Side: Data Sync & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden md:inline">
              Dados CGU / ALRS / FPE Sincronizados
            </span>
            <span className="text-[11px] text-slate-500 hidden xl:inline">
              Checagem: {lastUpdated}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Recarregar dados das APIs públicas"
            className="flex items-center gap-1 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-xl transition-colors disabled:opacity-50 border border-slate-200 shadow-2xs text-[11px] font-semibold"
          >
            <RefreshCw className={`w-3 h-3 text-[#1e40af] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Consultando...' : 'Atualizar'}</span>
          </button>

          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-1.5 px-3 py-1 text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition-colors text-[11px] font-semibold"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Busca</span>
          </button>
        </div>
      </div>
    </header>
  );
};
