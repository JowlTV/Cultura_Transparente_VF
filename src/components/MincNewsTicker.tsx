import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, ExternalLink } from './Icon';

export interface MincNewsItem {
  id: string;
  categoria: string;
  titulo: string;
  resumo: string;
  link: string;
  orgao: string;
}

/**
 * Atalhos para páginas oficiais (sem manchetes nem datas).
 * Auditoria v13: a versão anterior exibia "informativos" datados de set/2026 que não
 * correspondiam a publicações localizáveis — os links levavam apenas às páginas gerais do MinC.
 * Para notícias reais, use o feed de /api/news (RSS oficial da Prefeitura de Viamão).
 */
export const MINC_NOTICIAS_OFICIAIS: MincNewsItem[] = [
  {
    id: 'minc-pnab',
    categoria: 'PNAB',
    orgao: 'Ministério da Cultura',
    titulo: 'Política Nacional Aldir Blanc (PNAB) — página oficial do MinC',
    resumo: 'Normas, orientações aos entes federativos e materiais oficiais da Política Nacional Aldir Blanc de Fomento à Cultura (Lei nº 14.399/2022).',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/politica-nacional-aldir-blanc',
  },
  {
    id: 'minc-cultura-viva',
    categoria: 'Cultura Viva',
    orgao: 'Ministério da Cultura',
    titulo: 'Política Nacional de Cultura Viva — página oficial do MinC',
    resumo: 'Informações oficiais sobre Pontos e Pontões de Cultura e a certificação da Rede Cultura Viva.',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/cultura-viva',
  },
  {
    id: 'cgu-transparencia',
    categoria: 'Transparência',
    orgao: 'Controladoria-Geral da União (CGU)',
    titulo: 'Portal da Transparência — consulta de emendas parlamentares',
    resumo: 'Consulta pública oficial de emendas parlamentares federais por autor, localidade e função orçamentária.',
    link: 'https://portaldatransparencia.gov.br/emendas',
  },
  {
    id: 'minc-snc',
    categoria: 'Sistema Nacional de Cultura',
    orgao: 'Ministério da Cultura',
    titulo: 'Sistema Nacional de Cultura (SNC) — página oficial do MinC',
    resumo: 'Informações oficiais sobre conselhos, planos e fundos de cultura dos entes federativos.',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/sistema-nacional-de-cultura',
  },
  {
    id: 'minc-noticias',
    categoria: 'Notícias',
    orgao: 'Ministério da Cultura',
    titulo: 'Notícias oficiais do Ministério da Cultura',
    resumo: 'Canal oficial de notícias e comunicados do Ministério da Cultura.',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/noticias',
  },
];

interface MincNewsTickerProps {
  onSelectNews?: (news: MincNewsItem) => void;
}

export const MincNewsTicker: React.FC<MincNewsTickerProps> = ({ onSelectNews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedModalNews, setSelectedModalNews] = useState<MincNewsItem | null>(null);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % MINC_NOTICIAS_OFICIAIS.length);
    }, 4800);

    return () => clearInterval(interval);
  }, [isPaused]);

  const currentNews = MINC_NOTICIAS_OFICIAIS[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + MINC_NOTICIAS_OFICIAIS.length) % MINC_NOTICIAS_OFICIAIS.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % MINC_NOTICIAS_OFICIAIS.length);
  };

  const handleOpenDetail = (news: MincNewsItem) => {
    if (onSelectNews) {
      onSelectNews(news);
    } else {
      setSelectedModalNews(news);
    }
  };

  return (
    <>
      {/* Ticker Bar Container in Roxo Profundo */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full bg-[#2D0652] text-white border-b border-[#3D0B6D] px-3 sm:px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-inner relative overflow-hidden"
      >
        {/* Left Badge: Informativos Oficiais */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#FF4500] text-white px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wide uppercase shadow-xs">
            <span>Links oficiais</span>
          </div>
        </div>

        {/* Central Rotating News Content */}
        <div
          onClick={() => handleOpenDetail(currentNews)}
          className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer group py-0.5"
          title="Clique para ver a descrição e abrir a página oficial"
        >
          <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#3D0B6D] text-purple-200 border border-purple-400/30 shrink-0">
            {currentNews.categoria}
          </span>

          <span className="font-medium text-purple-100 group-hover:text-[#FF4500] transition-colors truncate text-xs">
            {currentNews.titulo}
          </span>

          <ExternalLink className="w-3 h-3 text-white/70 group-hover:text-[#FF4500] shrink-0 opacity-80" />
        </div>

        {/* Right Navigation & Status Controls */}
        <div className="flex items-center gap-1.5 shrink-0 text-white/80">
          <span className="text-[10px] font-mono text-white/70 hidden sm:inline">
            {currentIndex + 1}/{MINC_NOTICIAS_OFICIAIS.length}
          </span>

          <button
            onClick={handlePrev}
            aria-label="Link anterior"
            className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors text-purple-200"
            title="Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Continuar rotação' : 'Pausar rotação'}
            className="p-1 hover:bg-white/10 hover:text-[#FF4500] rounded transition-colors text-purple-200"
            title={isPaused ? 'Retomar rotação automática' : 'Pausar rotação'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          <button
            onClick={handleNext}
            aria-label="Próximo link"
            className="p-1 hover:bg-white/10 hover:text-white rounded transition-colors text-purple-200"
            title="Próxima"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal with Full MinC Announcement Details */}
      {selectedModalNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedModalNews(null)}
        >
          <div
            className="bg-[#FAF4EB] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#E2D2BC] space-y-4 text-[#2D0652]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E2D2BC] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB]">
                    {selectedModalNews.categoria}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg text-[#2D0652] leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                  {selectedModalNews.titulo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedModalNews(null)}
                className="text-[#2D0652]/60 hover:text-[#2D0652] font-bold p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-[#2D0652]/80 leading-relaxed">
              <div className="p-3 bg-white rounded-xl border border-[#E2D2BC] font-medium text-[#2D0652]">
                Órgão Emissor: <strong>{selectedModalNews.orgao}</strong>
              </div>
              <p>{selectedModalNews.resumo}</p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E2D2BC]">
              <button
                onClick={() => setSelectedModalNews(null)}
                className="px-4 py-2 bg-white hover:bg-[#F5EAD8] text-[#2D0652] text-xs font-semibold rounded-full border border-[#E2D2BC] transition-colors"
              >
                Fechar
              </button>

              <a
                href={selectedModalNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6A0DAD] hover:bg-[#580B91] text-white text-xs font-bold rounded-full transition-colors shadow-xs"
              >
                <span>Abrir página oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
