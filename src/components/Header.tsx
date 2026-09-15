import React from 'react';
import { Menu, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { MincNewsTicker } from './MincNewsTicker';
import { CultCircuitoLogo } from './CultCircuitoLogo';

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
  syncStatusText = 'Bases Oficiais Sincronizadas',
  latencyMs,
}) => {
  return (
    <header className="border-b border-[#E2D2BC] bg-[#FAF4EB]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      {/* Top Bar: Ministério da Cultura News Ticker (Roxo Profundo #2D0652) */}
      <MincNewsTicker />

      {/* Sub-Header Bar: Controls, Brand Lockup & Sync Status */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#F5EAD8]/80 border-b border-[#E2D2BC]/60 flex flex-wrap items-center justify-between gap-3 text-xs text-[#2D0652]">
        {/* Left Side: Mobile Menu Button & Platform Horizontal Lockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 text-[#2D0652] hover:text-[#6A0DAD] bg-white hover:bg-[#FAF4EB] rounded-xl border border-[#E2D2BC] shadow-2xs transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            {/* Horizontal Brand Lockup (Seção 01 e 05 do Manual) */}
            <div className="hidden sm:flex items-center gap-2">
              <CultCircuitoLogo size="sm" variant="color" showLockup={true} lockupTheme="light" className="p-0" />
            </div>

            <span className="hidden xl:inline-block text-[#2D0652]/30">|</span>
            <span className="text-[11px] font-medium text-[#2D0652]/75 hidden lg:inline max-w-xl truncate">
              Conformidade LAI (Lei nº 12.527/2011) e LC nº 131/2009 · Viamão/RS
            </span>
          </div>
        </div>

        {/* Right Side: Data Sync & Quick Actions (Seção 04 e 05 do Manual) */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-1.5 text-[#2D0652]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-[#E3F7E8] px-2.5 py-0.5 rounded-full border border-[#B7ECC3] hidden md:inline">
              {syncStatusText}
            </span>
            {latencyMs !== undefined && (
              <span className="text-[10px] font-mono text-[#D33600] bg-[#FFE8E0] px-1.5 py-0.5 rounded-full border border-[#FFC2B2] hidden lg:inline font-semibold">
                {latencyMs}ms
              </span>
            )}
            <span className="text-[11px] text-[#2D0652]/70 font-medium hidden 2xl:inline">
              Auditado: {lastUpdated}
            </span>
          </div>

          {/* Botão Secundário: Outline Roxo (#6A0DAD) */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Recarregar dados das APIs públicas"
            className="flex items-center gap-1.5 text-[#6A0DAD] hover:bg-[#6A0DAD]/10 bg-white px-3 py-1.5 rounded-full transition-all disabled:opacity-50 border-2 border-[#6A0DAD] shadow-2xs text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6A0DAD] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Consultando...' : 'Atualizar'}</span>
          </button>

          {/* Botão Primário de Ação: Preenchido Laranja (#FF4500) */}
          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-white bg-[#FF4500] hover:bg-[#E03D00] rounded-full border border-[#FF4500] shadow-xs transition-all text-xs font-bold cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
