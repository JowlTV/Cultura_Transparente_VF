import React from 'react';
import { Menu, ShieldCheck, RefreshCw, Search } from 'lucide-react';
import { MincNewsTicker } from './MincNewsTicker';

interface HeaderProps {
  onToggleSidebar: () => void;
  lastUpdated: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenQuickSearch: () => void;
  syncStatusText?: string;
  latencyMs?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onOpenQuickSearch,
  syncStatusText = 'Dados Oficiais Sincronizados',
  latencyMs,
}) => {
  return (
    <header className="border-b border-purple-900/40 bg-[#120822]/95 backdrop-blur-md sticky top-0 z-30 shadow-md">
      {/* Top Bar: Ministério da Cultura News Ticker (Alternando novidades do MinC) */}
      <MincNewsTicker />

      {/* Sub-Header Bar: Controls, Civic Welcome & Sync Status */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#170c2c]/90 border-b border-purple-900/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Side: Mobile Menu Button & Platform Label */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 text-slate-300 hover:text-white bg-[#1e1037] hover:bg-purple-900/40 rounded-xl border border-purple-900/40 shadow-2xs transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-['Outfit'] hidden sm:inline">
              Cultura Transparente
            </span>
            <span className="hidden sm:inline text-purple-400/40">|</span>
            <span className="text-[11px] font-semibold text-purple-200/70">
              Desenvolvido em conformidade estrita com a Lei de Acesso à Informação (Lei nº 12.527/2011) e a Lei da Transparência (LC nº 131/2009).
            </span>
          </div>
        </div>

        {/* Right Side: Data Sync & Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 hidden md:inline">
              {syncStatusText}
            </span>
            {latencyMs !== undefined && (
              <span className="text-[10px] font-mono text-[#FF4500] bg-orange-950/40 px-1.5 py-0.5 rounded border border-orange-800/40 hidden lg:inline">
                {latencyMs}ms
              </span>
            )}
            <span className="text-[11px] text-purple-300/60 hidden xl:inline">
              Auditado: {lastUpdated}
            </span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Recarregar dados das APIs públicas"
            className="flex items-center gap-1 text-slate-200 hover:text-[#c084fc] bg-[#1e1037] hover:bg-purple-900/40 px-2.5 py-1 rounded-xl transition-colors disabled:opacity-50 border border-purple-900/40 shadow-2xs text-[11px] font-semibold"
          >
            <RefreshCw className={`w-3 h-3 text-[#FF4500] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Consultando...' : 'Atualizar'}</span>
          </button>

          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-1.5 px-3 py-1 text-slate-200 hover:text-[#FF4500] bg-[#1e1037] hover:bg-orange-950/30 rounded-xl border border-purple-900/40 shadow-2xs transition-colors text-[11px] font-semibold"
          >
            <Search className="w-3.5 h-3.5 text-[#FF4500]" />
            <span className="hidden sm:inline">Busca</span>
          </button>
        </div>
      </div>
    </header>
  );
};
