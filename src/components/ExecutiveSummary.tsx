import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  FileText,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Scale,
  Clock,
  Filter,
  Layers,
  ChevronRight,
  Info,
  Search,
  RefreshCw,
  Award,
  Newspaper,
  Globe,
  Check,
  Lock,
  FileCheck,
  HelpCircle
} from 'lucide-react';
import { Emenda, PnabRecord, PontoCultural, NewsItem } from '../types/culture';
import { formatBRL } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

interface ExecutiveSummaryProps {
  emendas: Emenda[];
  pnabList: PnabRecord[];
  pontosCulturais: PontoCultural[];
  noticias: NewsItem[];
  onNavigateTab: (tab: string) => void;
  onUpdateNoticias?: (items: NewsItem[]) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  emendas,
  pnabList,
  pontosCulturais,
  noticias,
  onNavigateTab,
  onUpdateNoticias,
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [noticiaSelecionada, setNoticiaSelecionada] = useState<NewsItem | null>(null);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<{ tipo: 'info' | 'success' | 'alert'; msg: string } | null>(null);
  const [mostrarPesquisaAvancada, setMostrarPesquisaAvancada] = useState<boolean>(false);

  // Executa pesquisa ativa no Google Notícias com filtro de integridade
  const handlePesquisarGoogle = async (termoPersonalizado?: string) => {
    const termo = (termoPersonalizado !== undefined ? termoPersonalizado : buscaTexto).trim();
    setIsSearchingGoogle(true);
    setSearchFeedback(null);

    try {
      const res = await apiClient.fetchNews(termo || 'cultura', filtroCategoria);
      if (onUpdateNoticias && res.data) {
        onUpdateNoticias(res.data);
      }
      if (res.data.length > 0) {
        setSearchFeedback({
          tipo: 'success',
          msg: `${res.data.length} publicação(ões) com fontes oficiais/jornalísticas verificadas para "${termo || 'cultura'}".`
        });
      } else {
        setSearchFeedback({
          tipo: 'alert',
          msg: `Nenhuma notícia com fonte oficial encontrada para "${termo}".`
        });
      }
    } catch {
      setSearchFeedback({
        tipo: 'alert',
        msg: 'Acesso à pesquisa Google temporariamente indisponível. Exibindo acervo auditado de Viamão.'
      });
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // Restaura o acervo verificado inicial
  const handleRestaurarAcervo = async () => {
    setBuscaTexto('');
    setFiltroCategoria('todos');
    setIsSearchingGoogle(true);
    try {
      const res = await apiClient.fetchNews('cultura');
      if (onUpdateNoticias && res.data) {
        onUpdateNoticias(res.data);
      }
      setSearchFeedback({
        tipo: 'info',
        msg: 'Acervo auditado oficial de Viamão e do RS restaurado.'
      });
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // KPIs
  const emendasCulturais = emendas.filter(e => e.is_cultura);
  const totalEmendasCulturais = emendasCulturais.reduce((acc, curr) => acc + curr.valor, 0);
  const totalEmendasGastas = emendasCulturais.reduce((acc, curr) => acc + (curr.valor_gasto || 0), 0);

  const totalPnabEmCaixa = pnabList.reduce((acc, curr) => acc + curr.valor_exato, 0);
  const volumeTotalCultura = totalEmendasCulturais + totalPnabEmCaixa;

  // Filtragem e Motor do Feed de Notícias Oficiais
  const noticiasFiltradas = useMemo(() => {
    return noticias.filter(n => {
      // Filtro por Categoria / Origem
      let matchesCategoria = true;
      if (filtroCategoria === 'editais') {
        matchesCategoria = n.categoria_filtro === 'editais' || Boolean(n.prazo) || n.etiqueta.toLowerCase().includes('edital');
      } else if (filtroCategoria === 'viamao') {
        matchesCategoria = n.jurisdicao === 'Municipal (Viamão)' || n.categoria_filtro === 'viamao';
      } else if (filtroCategoria === 'eventos') {
        matchesCategoria = n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira');
      }

      // Filtro por Texto de Busca
      let matchesBusca = true;
      if (buscaTexto.trim()) {
        const query = buscaTexto.toLowerCase();
        matchesBusca =
          n.titulo.toLowerCase().includes(query) ||
          n.resumo.toLowerCase().includes(query) ||
          n.etiqueta.toLowerCase().includes(query) ||
          Boolean(n.elegibilidade && n.elegibilidade.toLowerCase().includes(query));
      }

      return matchesCategoria && matchesBusca;
    });
  }, [noticias, filtroCategoria, buscaTexto]);

  // Manchete Principal da Edição (Lead Editorial Story)
  const manchete = useMemo(() => {
    if (filtroCategoria === 'todos' && !buscaTexto.trim() && noticiasFiltradas.length > 0) {
      return noticiasFiltradas[0];
    }
    return null;
  }, [filtroCategoria, buscaTexto, noticiasFiltradas]);

  const demaisNoticias = useMemo(() => {
    return manchete ? noticiasFiltradas.slice(1) : noticiasFiltradas;
  }, [manchete, noticiasFiltradas]);

  return (
    <div className="space-y-6">
      {/* Hero Header - Identidade Visual #6A0DAD e #FF4500 */}
      <div className="bg-gradient-to-br from-[#2D0652] via-[#6A0DAD] to-[#FF4500] rounded-2xl p-6 sm:p-8 text-white shadow-xs border border-purple-500/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 px-3 py-1 rounded-full text-xs font-semibold text-white mb-3 backdrop-blur-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            Portal de Transparência, Editais e Fomento Cultural de Viamão
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white leading-snug">
            Cultura Transparente & Central Oficial de Editais
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-100 leading-relaxed">
            Acompanhe em tempo real oportunidades de fomento, orientações técnicas de elegibilidade e a destinação de recursos públicos para a cultura em Viamão e no Rio Grande do Sul através de dados auditados e fontes oficiais primárias.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid (3 Colunas Equilibradas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Verbas */}
        <div className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs hover:border-[#6A0DAD] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Volume Total Rastreado</span>
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 text-[#c084fc] flex items-center justify-center border border-purple-700/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-['Outfit']">
              {formatBRL(volumeTotalCultura)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Soma de recursos PNAB e Emendas Culturais em Viamão
            </p>
          </div>
        </div>

        {/* Emendas Culturais */}
        <div className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs hover:border-[#FF4500] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Emendas para Cultura</span>
            <div className="w-9 h-9 rounded-xl bg-orange-950/50 text-[#FF4500] flex items-center justify-center border border-orange-800/40">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-['Outfit']">
              {emendasCulturais.length} Registros
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {formatBRL(totalEmendasCulturais)} alocados ({formatBRL(totalEmendasGastas)} liquidados)
            </p>
          </div>
        </div>

        {/* Espaços Culturais */}
        <div className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs hover:border-[#6A0DAD] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Espaços Mapeados</span>
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 text-[#c084fc] flex items-center justify-center border border-purple-700/40">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-['Outfit']">
              {pontosCulturais.length} Entidades
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pontos e espaços culturais validados em Viamão
            </p>
          </div>
        </div>
      </div>

      {/* MOTOR DO FEED DE NOTÍCIAS E ATUALIZAÇÕES OFICIAIS - ESTILO JORNAL / GAZETA */}
      <div className="space-y-4">
        {/* Header do Feed, Barra de Busca e Filtros Oficiais */}
        <div className="bg-[#150b24] rounded-2xl p-4 sm:p-5 border border-purple-900/40 shadow-xs space-y-4">
          <div className="border-b border-purple-900/30 pb-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-purple-300/70 font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FF4500] tracking-wider">GAZETA CULTURAL DE VIAMÃO</span>
              <span>•</span>
              <span className="text-purple-300/70">FEED DE NOTÍCIAS & PESQUISA GOOGLE</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#6A0DAD] text-white shadow-2xs">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base sm:text-lg font-['Outfit']">
                  Jornal da Cultura & Pesquisa Google
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Consulta em tempo real no Google Notícias e veículos regionais de Viamão com fontes oficiais e imprensa consolidada.
              </p>
            </div>

            {/* Ações de Busca no Feed */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-purple-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={buscaTexto}
                  onChange={e => setBuscaTexto(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handlePesquisarGoogle();
                    }
                  }}
                  placeholder="Pesquisar notícias ou editais..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#1e1037] border border-purple-900/40 rounded-xl focus:bg-[#251443] focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD] text-slate-100 placeholder-purple-300/40"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePesquisarGoogle()}
                  disabled={isSearchingGoogle}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#FF4500] hover:bg-[#e03d00] text-white text-xs font-bold rounded-xl transition-all shadow-xs disabled:opacity-50"
                  title="Pesquisar no Google Notícias"
                >
                  {isSearchingGoogle ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span>{isSearchingGoogle ? 'Consultando...' : 'Buscar no Google'}</span>
                </button>

                <button
                  onClick={handleRestaurarAcervo}
                  disabled={isSearchingGoogle}
                  className="p-2 bg-[#1e1037] hover:bg-purple-900/40 text-slate-300 rounded-xl border border-purple-900/40 transition-colors text-xs font-semibold"
                  title="Restaurar notícias auditadas iniciais"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
                </button>

                <button
                  onClick={() => setMostrarPesquisaAvancada(!mostrarPesquisaAvancada)}
                  className={`p-2 rounded-xl border transition-colors text-xs font-semibold ${
                    mostrarPesquisaAvancada
                      ? 'bg-amber-950/60 text-amber-300 border-amber-700/50'
                      : 'bg-[#1e1037] hover:bg-purple-900/40 text-slate-300 border-purple-900/40'
                  }`}
                  title="Abrir ferramentas de busca avançada oficial no Google"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sugestões de Pesquisas Rápidas no Google (Chips de Viamão) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
            <span className="text-purple-300/70 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#FF4500]" />
              Pesquisas Rápidas:
            </span>
            {[
              { label: 'Cultura Viamão', query: 'cultura viamao' },
              { label: 'Editais PNAB Viamão', query: 'pnab viamao' },
              { label: 'Sarau & IFRS Viamão', query: 'sarau ifrs viamao' },
              { label: 'Patrimônio Histórico', query: 'patrimonio historico viamao' },
              { label: 'Pró-Cultura RS / SEDAC', query: 'pro-cultura sedac rs' },
            ].map(chip => (
              <button
                key={chip.query}
                onClick={() => {
                  setBuscaTexto(chip.label);
                  handlePesquisarGoogle(chip.query);
                }}
                disabled={isSearchingGoogle}
                className="px-2.5 py-1 bg-[#1e1037] hover:bg-[#281648] text-slate-300 hover:text-white rounded-lg border border-purple-900/40 transition-colors text-[11px] font-medium"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Feedback de Pesquisa / Status de Integridade */}
          {searchFeedback && (
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                searchFeedback.tipo === 'success'
                  ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-200'
                  : searchFeedback.tipo === 'alert'
                  ? 'bg-amber-950/60 border-amber-800/50 text-amber-200'
                  : 'bg-purple-950/60 border-purple-800/50 text-purple-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {searchFeedback.tipo === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {searchFeedback.tipo === 'alert' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                {searchFeedback.tipo === 'info' && <Info className="w-4 h-4 text-purple-300 shrink-0" />}
                <span>{searchFeedback.msg}</span>
              </div>
              <button
                onClick={() => setSearchFeedback(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Painel Expansível de Pesquisa Direta no Google com Fontes Oficiais (Google Dorks) */}
          {mostrarPesquisaAvancada && (
            <div className="p-4 bg-[#1a0f30] border border-purple-900/40 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Globe className="w-4 h-4 text-[#FF4500]" />
                  <span>Canais Verificados no Google (Pesquisa com Operadores Oficiais)</span>
                </div>
                <span className="text-[11px] text-purple-300/60 font-mono">Fontes Oficiais</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Utilize as buscas pré-formatadas diretamente nos portais governamentais e de imprensa:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:viamao.rs.gov.br "cultura" OR "edital"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#150b24] border border-purple-900/40 rounded-lg hover:border-[#6A0DAD] hover:bg-[#20103b] transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-white group-hover:text-[#c084fc]">Prefeitura de Viamão</strong>
                    <span className="text-[10px] text-purple-300/60 font-mono">site:viamao.rs.gov.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-[#c084fc]" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:procultura.rs.gov.br "Viamão"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#150b24] border border-purple-900/40 rounded-lg hover:border-[#6A0DAD] hover:bg-[#20103b] transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-white group-hover:text-[#c084fc]">Pró-Cultura RS / SEDAC</strong>
                    <span className="text-[10px] text-purple-300/60 font-mono">site:procultura.rs.gov.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-[#c084fc]" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:camaraviamao.rs.gov.br "cultura"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#150b24] border border-purple-900/40 rounded-lg hover:border-[#6A0DAD] hover:bg-[#20103b] transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-white group-hover:text-[#c084fc]">Câmara de Viamão</strong>
                    <span className="text-[10px] text-purple-300/60 font-mono">site:camaraviamao.rs.gov.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-[#c084fc]" />
                </a>

                <a
                  href={`https://news.google.com/search?q=${encodeURIComponent('Viamão cultura OR edital')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#150b24] border border-purple-900/40 rounded-lg hover:border-[#6A0DAD] hover:bg-[#20103b] transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-white group-hover:text-[#c084fc]">Google Notícias (Viamão)</strong>
                    <span className="text-[10px] text-purple-300/60 font-mono">news.google.com</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-[#c084fc]" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:diariomunicipal.com.br/famurs "Viamão" "cultura"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#150b24] border border-purple-900/40 rounded-lg hover:border-[#6A0DAD] hover:bg-[#20103b] transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-white group-hover:text-[#c084fc]">Diário Oficial FAMURS</strong>
                    <span className="text-[10px] text-purple-300/60 font-mono">diariomunicipal.com.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-[#c084fc]" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:gauchazh.clicrbs.com.br "Viamão" "cultura"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 bg-[#150b24] border border-purple-900/40 rounded-lg hover:border-[#6A0DAD] hover:bg-[#20103b] transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-white group-hover:text-[#c084fc]">GZH / Diário Gaúcho</strong>
                    <span className="text-[10px] text-purple-300/60 font-mono">gauchazh.clicrbs.com.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400/60 group-hover:text-[#c084fc]" />
                </a>
              </div>
            </div>
          )}

          {/* Abas por Categoria e Origem */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-purple-900/30">
            {[
              { id: 'todos', label: 'Todas as Notícias', count: noticias.length },
              { id: 'viamao', label: 'Cultura Viamão', count: noticias.filter(n => n.jurisdicao === 'Municipal (Viamão)' || n.categoria_filtro === 'viamao').length },
              { id: 'editais', label: 'Editais & Fomento', count: noticias.filter(n => n.categoria_filtro === 'editais').length },
              { id: 'eventos', label: 'Festejos & Eventos', count: noticias.filter(n => n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira')).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroCategoria(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                  filtroCategoria === tab.id
                    ? 'bg-[#6A0DAD] text-white shadow-xs font-bold'
                    : 'bg-[#1e1037] text-slate-300 hover:bg-purple-900/30 hover:text-white border border-purple-900/40'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filtroCategoria === tab.id ? 'bg-white/20 text-white' : 'bg-purple-900/60 text-purple-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MANCHETE PRINCIPAL DA SEMANA (Lead Editorial Story) */}
        {manchete && (
          <article className="bg-gradient-to-br from-[#1E0538] via-[#350A5E] to-[#1E0538] text-white rounded-2xl p-6 sm:p-7 shadow-md border border-purple-800/40 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-[#FF4500] text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    Manchete da Edição
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-purple-200 font-semibold text-[11px] border border-white/15">
                    {manchete.origem}
                  </span>
                  {manchete.veiculo_imprensa && (
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-semibold text-[11px] border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      {manchete.veiculo_imprensa}
                    </span>
                  )}
                  <span className="text-slate-300 text-[11px] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {manchete.data}
                  </span>
                </div>

                <div className="text-[11px] text-purple-200 bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-700/50 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Fonte Confiável</span>
                </div>
              </div>

              <div>
                <h4 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white group-hover:text-purple-200 transition-colors leading-snug">
                  {manchete.titulo}
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
                  {manchete.resumo}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/10 text-xs">
                {manchete.prazo && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Prazo de Inscrição:</span>
                    <strong className="text-white font-mono mt-0.5 block">{manchete.prazo}</strong>
                  </div>
                )}
                {manchete.plataforma && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Plataforma Oficial:</span>
                    <strong className="text-purple-200 mt-0.5 block truncate">{manchete.plataforma}</strong>
                  </div>
                )}
                {manchete.elegibilidade && (
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Elegibilidade Territorial:</span>
                    <strong className="text-amber-300 mt-0.5 block truncate">{manchete.elegibilidade}</strong>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => setNoticiaSelecionada(manchete)}
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#e03d00] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Ler Resumo Completo & Requisitos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <a
                    href={
                      manchete.url_pesquisa_google ||
                      `https://www.google.com/search?q=${encodeURIComponent(`"${manchete.titulo}" Viamão`)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all border border-white/20 flex items-center gap-1.5"
                    title="Verificar a repercussão desta notícia no Google Search"
                  >
                    <Globe className="w-3.5 h-3.5 text-purple-300" />
                    <span>Verificar no Google</span>
                  </a>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Feed Cards Grid (Demais Notícias) */}
        {demaisNoticias.length === 0 && !manchete ? (
          <div className="bg-[#150b24] rounded-2xl border border-purple-900/40 p-8 text-center text-slate-400 space-y-3">
            <div className="p-3 bg-purple-900/40 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-[#c084fc] border border-purple-700/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-white text-base font-['Outfit']">
                Nenhum comunicado oficial encontrado
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Apenas notícias e editais devidamente verificados em fontes públicas e de imprensa consolidada de Viamão e do RS são exibidos.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleRestaurarAcervo}
                className="px-4 py-2 bg-[#6A0DAD] text-white text-xs font-bold rounded-xl hover:bg-[#580b91] transition-all shadow-xs"
              >
                Restaurar Acervo Oficial
              </button>
              <a
                href={`https://news.google.com/search?q=${encodeURIComponent(buscaTexto || 'Viamão cultura')}&hl=pt-BR&gl=BR&ceid=BR:pt-419`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[#1e1037] hover:bg-purple-900/40 text-slate-200 text-xs font-bold rounded-xl transition-all border border-purple-900/40 inline-flex items-center gap-1.5"
              >
                <Globe className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>Pesquisar Diretamente no Google Notícias</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {demaisNoticias.map(item => {
              // Estilização do cabeçalho institucional por órgão
              const isMinC = item.origem === 'Federal (MinC)';
              const isSedac = item.origem === 'Estadual (SEDAC-RS)';

              return (
                <article
                  key={item.id}
                  className="bg-[#150b24] rounded-2xl border border-purple-900/40 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#6A0DAD] transition-all flex flex-col justify-between group"
                >
                  {/* Topo Institucional do Card */}
                  <div className={`p-4 border-b ${
                    isMinC
                      ? 'bg-[#1c0e35] border-purple-900/40 text-purple-200'
                      : isSedac
                      ? 'bg-[#18112c] border-emerald-900/40 text-emerald-300'
                      : 'bg-[#230f30] border-orange-900/40 text-orange-200'
                  }`}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Building className="w-3.5 h-3.5" />
                        <span>{item.origem}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] opacity-80">
                        <Calendar className="w-3 h-3" />
                        <span>{item.data}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-semibold bg-[#10071e] text-purple-200 px-2 py-0.5 rounded-full border border-purple-800/40">
                        {item.etiqueta}
                      </span>
                      {item.veiculo_imprensa ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 flex items-center gap-1 border border-emerald-800/50">
                          <Check className="w-3 h-3 text-emerald-400" />
                          {item.veiculo_imprensa}
                        </span>
                      ) : item.fonte_confiavel ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/70 text-emerald-300 flex items-center gap-1 border border-emerald-800/50">
                          <Check className="w-3 h-3 text-emerald-400" />
                          Fonte Confiável
                        </span>
                      ) : item.jurisdicao ? (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.jurisdicao.includes('Alerta')
                            ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                            : 'bg-purple-950/70 text-purple-300 border border-purple-800/40'
                        }`}>
                          {item.jurisdicao}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-white text-sm sm:text-base leading-snug font-['Outfit'] group-hover:text-[#FF4500] transition-colors">
                        {item.titulo}
                      </h4>

                      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {item.resumo}
                      </p>
                    </div>

                    {/* Destaques Técnicos Rápidos */}
                    <div className="space-y-2 pt-3 border-t border-purple-900/30 text-[11px]">
                      {item.prazo && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
                          <span>Prazo: <strong className="text-white font-mono">{item.prazo}</strong></span>
                        </div>
                      )}

                      {item.plataforma && (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Layers className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                          <span className="truncate">Plataforma: <strong className="text-purple-200">{item.plataforma}</strong></span>
                        </div>
                      )}

                      {item.elegibilidade && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          Elegibilidade: <strong className="text-amber-300">{item.elegibilidade}</strong>
                        </div>
                      )}
                    </div>

                    {/* Footer do Card com Links Oficiais Seguros */}
                    <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between gap-1 text-xs">
                      <button
                        onClick={() => setNoticiaSelecionada(item)}
                        className="font-bold text-[#c084fc] hover:text-[#FF4500] hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>Requisitos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={
                            item.url_pesquisa_google ||
                            `https://www.google.com/search?q=${encodeURIComponent(`"${item.titulo}" Viamão`)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-[#1e1037] hover:bg-purple-900/40 px-2.5 py-1 rounded-md transition-colors border border-purple-900/40"
                          title="Verificar autenticidade no Google Search"
                        >
                          <Globe className="w-3 h-3 text-[#FF4500]" />
                          <span>Google</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Notícia / Edital Oficial com Auditoria Completa */}
      {noticiaSelecionada && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#150b24] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-purple-900/50 max-h-[90vh] overflow-y-auto text-slate-200">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-purple-900/30">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white bg-[#6A0DAD] px-2.5 py-1 rounded-full border border-purple-500/40">
                    {noticiaSelecionada.etiqueta}
                  </span>
                  {noticiaSelecionada.veiculo_imprensa && (
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {noticiaSelecionada.veiculo_imprensa}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-white text-lg font-['Outfit'] mt-2">
                  {noticiaSelecionada.titulo}
                </h3>
              </div>
              <button
                onClick={() => setNoticiaSelecionada(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-purple-900/40 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>{noticiaSelecionada.resumo}</p>

              {noticiaSelecionada.alerta_inabilitacao && (
                <div className="p-3 bg-rose-950/60 border border-rose-800/50 rounded-xl text-rose-200 font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-300">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Alerta de Risco de Inabilitação
                  </div>
                  <p className="text-xs">{noticiaSelecionada.alerta_inabilitacao}</p>
                </div>
              )}

              {noticiaSelecionada.requisitos_praticos && noticiaSelecionada.requisitos_praticos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Requisitos Práticos & Orientações de Submissão:
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {noticiaSelecionada.requisitos_praticos.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#1e1037] p-2.5 rounded-lg border border-purple-900/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500] shrink-0 mt-1.5"></span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-[#1e1037] p-2.5 rounded-lg border border-purple-900/40">
                  <span className="text-[10px] text-purple-300/60 uppercase font-bold block">Órgão Emissor / Veículo</span>
                  <span className="font-semibold text-slate-100">
                    {noticiaSelecionada.veiculo_imprensa || noticiaSelecionada.origem}
                  </span>
                </div>
                <div className="bg-[#1e1037] p-2.5 rounded-lg border border-purple-900/40">
                  <span className="text-[10px] text-purple-300/60 uppercase font-bold block">Data do Comunicado</span>
                  <span className="font-semibold text-slate-100">{noticiaSelecionada.data}</span>
                </div>
                <div className="bg-[#1e1037] p-2.5 rounded-lg border border-purple-900/40">
                  <span className="text-[10px] text-purple-300/60 uppercase font-bold block">Status de Auditoria</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Fonte Oficial
                  </span>
                </div>
                <div className="bg-[#1e1037] p-2.5 rounded-lg border border-purple-900/40">
                  <span className="text-[10px] text-purple-300/60 uppercase font-bold block">Jurisdição Territorial</span>
                  <span className="font-semibold text-slate-100">{noticiaSelecionada.jurisdicao || 'Rio Grande do Sul'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-900/30 flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => setNoticiaSelecionada(null)}
                className="px-4 py-2 bg-[#1e1037] hover:bg-purple-900/40 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-purple-900/40"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={
                    noticiaSelecionada.url_pesquisa_google ||
                    `https://www.google.com/search?q=${encodeURIComponent(`"${noticiaSelecionada.titulo}" Viamão`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1e1037] hover:bg-purple-900/40 text-slate-200 rounded-xl text-xs font-semibold transition-all border border-purple-900/40"
                >
                  <Globe className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>Conferir no Google</span>
                </a>

                <a
                  href={noticiaSelecionada.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF4500] hover:bg-[#e03d00] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span>Acessar Portal Oficial</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
