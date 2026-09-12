import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, ExternalLink, Sparkles, Bell } from 'lucide-react';

export interface MincNewsItem {
  id: string;
  categoria: string;
  data: string;
  titulo: string;
  resumo: string;
  link: string;
  orgao: string;
}

export const MINC_NOTICIAS_OFICIAIS: MincNewsItem[] = [
  {
    id: 'minc-01',
    categoria: 'Política Nacional Aldir Blanc (PNAB)',
    data: '09/09/2026',
    orgao: 'Ministério da Cultura',
    titulo: 'MinC orienta municípios sobre acompanhamento de recursos da PNAB e prestação de contas no Transferegov',
    resumo: 'Diretrizes nacionais reforçam a obrigatoriedade de ampla publicidade aos editais municipais, cotas para agentes periféricos e fomento direto a Pontos de Cultura.',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/politica-nacional-aldir-blanc',
  },
  {
    id: 'minc-02',
    categoria: 'Cultura Viva & Pontos de Cultura',
    data: '08/09/2026',
    orgao: 'Secretaria de Cidadania e Diversidade Cultural / MinC',
    titulo: 'Rede Cultura Viva abre novo ciclo de certificação simplificada para coletivos comunitários e entidades',
    resumo: 'Iniciativas culturais comunitárias em periferias e zonas rurais podem obter a chancela oficial de Ponto de Cultura para habilitação em editais de premiação.',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/cultura-viva',
  },
  {
    id: 'minc-03',
    categoria: 'Transparência & Controle Social',
    data: '06/09/2026',
    orgao: 'MinC & Controladoria-Geral da União (CGU)',
    titulo: 'Painel da Transparência Cultural Federal integra dados de emendas e transferências fundo a fundo',
    resumo: 'Cidadãos e conselheiros municipais de cultura agora contam com cruzamento automatizado de emendas parlamentares e dotações do Fundo Nacional de Cultura.',
    link: 'https://portaldatransparencia.gov.br/',
  },
  {
    id: 'minc-04',
    categoria: 'Transparência Municipal & PNAB',
    data: '04/09/2026',
    orgao: 'Secretaria de Gestão e Fomento Cultural',
    titulo: 'Orientações aos municípios para aplicação dos rendimentos financeiros da conta PNAB',
    resumo: 'Recursos em conta fiduciária do Fundo Municipal de Cultura devem ter rendimentos reinvestidos integralmente nas metas do Plano Anual de Aplicação dos Recursos (PAAR).',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/politica-nacional-aldir-blanc',
  },
  {
    id: 'minc-05',
    categoria: 'Sistema Nacional de Cultura (SNC)',
    data: '02/09/2026',
    orgao: 'Conselho Nacional de Política Cultural (CNPC)',
    titulo: 'Fortalecimento dos Conselhos Municipais de Cultura: MinC promove capacitação para controle social',
    resumo: 'Encontros virtuais e guias práticos capacitam conselheiros e agentes culturais locais na fiscalização e aprovação de planos de aplicação de recursos.',
    link: 'https://www.gov.br/cultura/pt-br/assuntos/sistema-nacional-de-cultura',
  },
  {
    id: 'minc-06',
    categoria: 'Hip-Hop & Cultura Urbana',
    data: '28/08/2026',
    orgao: 'Ministério da Cultura',
    titulo: 'Decreto Federal de Valorização da Cultura Hip-Hop impulsiona ações formativas e mostras urbanas',
    resumo: 'Fomento a festivais, batalhas de rima, breaking e artes visuais como vetores prioritários de inclusão social e cidadania para as juventudes periféricas.',
    link: 'https://www.gov.br/cultura/pt-br',
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
      {/* Ticker Bar Container */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="w-full bg-[#18052E] text-slate-100 border-b border-purple-950/80 px-3 sm:px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-inner relative overflow-hidden"
      >
        {/* Left Badge: Informativos Oficiais */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#6A0DAD] to-[#FF4500] text-white px-2.5 py-1 rounded-md font-bold text-[11px] shadow-xs border border-purple-400/30">
            <span className="tracking-wide uppercase font-['Outfit']">Informativos Oficiais</span>
          </div>
        </div>

        {/* Central Rotating News Content */}
        <div
          onClick={() => handleOpenDetail(currentNews)}
          className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer group py-0.5"
          title="Clique para ler o informativo completo do Ministério da Cultura"
        >
          <span className="hidden lg:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700/50 shrink-0">
            {currentNews.categoria}
          </span>

          <span className="font-medium text-slate-200 group-hover:text-[#FF4500] transition-colors truncate text-xs">
            {currentNews.titulo}
          </span>

          <span className="hidden xl:inline-block text-[10px] text-slate-400 shrink-0">
            ({currentNews.data})
          </span>

          <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-[#FF4500] shrink-0 opacity-80" />
        </div>

        {/* Right Navigation & Status Controls */}
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          <span className="text-[10px] font-mono text-slate-300 hidden sm:inline">
            {currentIndex + 1}/{MINC_NOTICIAS_OFICIAIS.length}
          </span>

          <button
            onClick={handlePrev}
            aria-label="Notícia anterior do MinC"
            className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors text-slate-300"
            title="Anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            aria-label={isPaused ? 'Continuar rotação' : 'Pausar rotação'}
            className="p-1 hover:bg-slate-800 hover:text-amber-300 rounded transition-colors text-slate-300"
            title={isPaused ? 'Retomar rotação automática' : 'Pausar rotação'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>

          <button
            onClick={handleNext}
            aria-label="Próxima notícia do MinC"
            className="p-1 hover:bg-slate-800 hover:text-white rounded transition-colors text-slate-300"
            title="Próxima"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal with Full MinC Announcement Details */}
      {selectedModalNews && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedModalNews(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4 text-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-[#6A0DAD] border border-purple-200">
                    {selectedModalNews.categoria}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedModalNews.data}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] leading-snug">
                  {selectedModalNews.titulo}
                </h3>
              </div>
              <button
                onClick={() => setSelectedModalNews(null)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-800">
                Órgão Emissor: <strong>{selectedModalNews.orgao}</strong>
              </div>
              <p>{selectedModalNews.resumo}</p>
              <p className="text-xs text-slate-500">
                Esta publicação integra o monitoramento de transparência pública ativa do município de Viamão para acompanhamento de diretrizes federais de investimento e repasses orçamentários culturais.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedModalNews(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Fechar
              </button>

              <a
                href={selectedModalNews.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6A0DAD] hover:bg-[#580b91] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                <span>Acessar no Portal do MinC</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
