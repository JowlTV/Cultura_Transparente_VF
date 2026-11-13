import React, { useState, useEffect } from 'react';
import { Menu, RefreshCw, Search } from './Icon';
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
  isDegraded?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  lastUpdated,
  onRefresh,
  isRefreshing,
  onOpenQuickSearch,
  syncStatusText = 'Consultando bases públicas…',
  latencyMs,
  isDegraded = false,
}) => {
  const [justRefreshed, setJustRefreshed] = useState(false);

  useEffect(() => {
    if (!isRefreshing && justRefreshed) {
      const timer = setTimeout(() => setJustRefreshed(false), 2200);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing, justRefreshed]);

  const handleRefreshClick = () => {
    setJustRefreshed(true);
    onRefresh();
  };

  return (
    <header className="border-b border-[#2D0652]/10 bg-[#FAF4EB]/95 backdrop-blur-md sticky top-0 z-30 shadow-tint-sm">
      {/* Top Bar: Ministério da Cultura News Ticker (Roxo Profundo #2D0652) */}
      <MincNewsTicker />

      {/* Sub-Header Bar: Controls, Brand Lockup & Sync Status */}
      <div className="px-4 sm:px-6 py-2.5 bg-[#F5EAD8]/85 border-b border-[#2D0652]/8 flex flex-wrap items-center justify-between gap-3 text-xs text-[#2D0652]">
        {/* Left Side: Mobile Menu Button & Platform Horizontal Lockup */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 text-[#2D0652] hover:text-[#6A0DAD] bg-white hover:bg-[#FAF4EB] rounded-pill border border-[#2D0652]/15 shadow-tint-sm transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            {/* Horizontal Brand Lockup (Seção 01 e 05 do Manual) */}
            <div className="hidden sm:flex items-center gap-2">
              <CultCircuitoLogo size="sm" variant="color" showLockup={true} lockupTheme="light" className="p-0" />
            </div>

            <span className="hidden xl:inline-block text-[#2D0652]/20">|</span>
            <div className="hidden lg:flex flex-col text-[11px] leading-tight text-[#2D0652]/80">
              <span className="font-semibold text-[#2D0652]">Portal de Controle Social & Transparência Cultural</span>
              <span className="text-[10px] text-[#2D0652]/65">Conformidade com a LAI (Lei nº 12.527/2011) e LC nº 131/2009 — Viamão/RS</span>
            </div>
          </div>
        </div>

        {/* Right Side: Data Sync & Quick Actions (Seção 04 e 05 do Manual) */}
        <div className="flex items-center gap-2.5">
          {/* Status Indicator Pill */}
          <div className="flex items-center gap-1.5 text-[#2D0652]">
            <span className="relative flex h-2 w-2">
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isDegraded ? 'bg-amber-500' : 'bg-emerald-600'}`}></span>
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-pill border hidden md:inline ${
                isDegraded
                  ? 'text-amber-900 bg-amber-50 border-amber-600/30'
                  : 'text-emerald-900 bg-[#E3F7E8] border-emerald-700/20'
              }`}
            >
              {syncStatusText}
            </span>
            {latencyMs !== undefined && (
              <span className="text-[10px] font-mono text-[#D33600] bg-[#FFE8E0] px-1.5 py-0.5 rounded-pill border border-[#FF4500]/25 hidden lg:inline font-semibold">
                {latencyMs}ms
              </span>
            )}
            <span className="text-[11px] text-[#2D0652]/70 font-medium hidden 2xl:inline">
              Consultado: {lastUpdated}
            </span>
          </div>

          {/* Botão Secundário: Outline Roxo (#6A0DAD) com transição de sincronização */}
          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Recarregar dados das APIs públicas"
            className="flex items-center gap-1.5 text-[#6A0DAD] hover:bg-[#6A0DAD]/10 bg-white px-3.5 py-1.5 rounded-pill transition-all disabled:opacity-50 border-2 border-[#6A0DAD] text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#6A0DAD] transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Consultando...' : justRefreshed ? 'Atualizado' : 'Atualizar'}</span>
          </button>

          {/* Botão Primário de Ação: Preenchido Laranja (#FF4500) */}
          <button
            onClick={onOpenQuickSearch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-white bg-[#FF4500] hover:bg-[#E03D00] rounded-pill transition-all text-xs font-bold cursor-pointer shadow-tint-sm"
          >
            <Search className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
