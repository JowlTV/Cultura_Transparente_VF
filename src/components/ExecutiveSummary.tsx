import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  FileText,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Search,
  RefreshCw,
  Award,
  Newspaper,
  Globe,
  Check,
  HelpCircle,
  ArrowRight
} from './Icon';
import { LottieStateAnimation } from './lottie/LottieStateAnimation';
import { Emenda, NewsItem } from '../types/culture';
import { formatBRL, sortNewsByDateDesc } from '../utils/formatters';
import { apiClient } from '../services/apiClient';

interface ExecutiveSummaryProps {
  emendas: Emenda[];
  noticias: NewsItem[];
  onNavigateTab: (tab: string) => void;
  onUpdateNoticias?: (items: NewsItem[]) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  emendas,
  noticias,
  onNavigateTab,
  onUpdateNoticias,
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
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
        onUpdateNoticias(sortNewsByDateDesc(res.data));
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
        onUpdateNoticias(sortNewsByDateDesc(res.data));
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
  const volumeTotalCultura = totalEmendasCulturais;

  // Filtragem e Motor do Feed de Notícias Oficiais (sempre ordenadas cronologicamente da mais recente para a mais antiga)
  const noticiasFiltradas = useMemo(() => {
    const filtradas = noticias.filter(n => {
      let matchesCategoria = true;
      if (filtroCategoria === 'editais') {
        matchesCategoria = n.categoria_filtro === 'editais' || Boolean(n.prazo) || n.etiqueta.toLowerCase().includes('edital');
      } else if (filtroCategoria === 'viamao') {
        matchesCategoria = n.jurisdicao === 'Municipal (Viamão)' || n.categoria_filtro === 'viamao';
      } else if (filtroCategoria === 'eventos') {
        matchesCategoria = n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira');
      }

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

    return sortNewsByDateDesc(filtradas);
  }, [noticias, filtroCategoria, buscaTexto]);

  // Manchete Principal da Edição (mais recente)
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
      {/* KPI Cards Grid com entrada suave orquestrada */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Total Emendas Culturais */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
          className="bg-[#FAF4EB] rounded-card p-5 border border-[#2D0652]/10 shadow-tint-sm hover:border-[#6A0DAD] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D0652]/80">Emendas Culturais</span>
            <div className="w-10 h-10 rounded-pill bg-[#EFE6FD] text-[#6A0DAD] flex items-center justify-center border border-[#6A0DAD]/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
              {formatBRL(volumeTotalCultura)}
            </div>
            <p className="text-xs text-[#2D0652]/70 mt-1 font-medium">
              Total consolidado em emendas destinadas a Viamão
            </p>
          </div>
        </motion.div>

        {/* Status das Emendas */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06 }}
          className="bg-[#FAF4EB] rounded-card p-5 border border-[#2D0652]/10 shadow-tint-sm hover:border-[#FF4500] transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D0652]/80">Execução Orçamentária</span>
            <div className="w-10 h-10 rounded-pill bg-[#FFE8E0] text-[#FF4500] flex items-center justify-center border border-[#FF4500]/25">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
              {emendasCulturais.length} Registros
            </div>
            <p className="text-xs text-[#2D0652]/70 mt-1 font-medium">
              {formatBRL(totalEmendasCulturais)} alocados ({formatBRL(totalEmendasGastas)} liquidados)
            </p>
          </div>
        </motion.div>

        {/* PNAB Painel Oficial */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.12 }}
          onClick={() => onNavigateTab('pnab')}
          className="bg-[#FAF4EB] rounded-card p-5 border border-[#2D0652]/10 shadow-tint-sm hover:border-[#6A0DAD] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#2D0652]/80">Painel Oficial PNAB</span>
            <div className="w-10 h-10 rounded-pill bg-[#EFE6FD] text-[#6A0DAD] flex items-center justify-center border border-[#6A0DAD]/20 group-hover:bg-[#6A0DAD] group-hover:text-white transition-colors">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#2D0652] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <span>Painel MinC</span>
              <ArrowRight className="w-5 h-5 text-[#FF4500] group-hover:translate-x-1.5 transition-transform" />
            </div>
            <p className="text-xs text-[#2D0652]/70 mt-1 font-medium">
              Consulta interativa oficial do Ministério da Cultura
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Banner de Destaque: Auxílio ao Fazedor de Cultura (IA) */}
      <div className="bg-[#2D0652] rounded-container p-6 sm:p-7 text-white shadow-tint-md border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-card bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 border border-white/20 mt-0.5">
            <Sparkles className="w-6 h-6 text-[#FF4500]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-200">
                Recurso Cidadão
              </span>
              <span className="text-[11px] font-bold bg-[#FF4500] text-white px-2.5 py-0.5 rounded-pill">
                Consultor IA
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Auxílio ao Fazedor de Cultura · Estruturador de Projetos
            </h3>
            <p className="text-xs text-purple-100/80 max-w-2xl leading-relaxed">
              Elabore propostas técnicas para PNAB, Lei Paulo Gustavo, Emendas Parlamentares e editais municipais com auxílio inteligente passo a passo, cronograma, planilha orçamentária e exportação em PDF.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('auxilio-fazedor')}
          className="shrink-0 px-5 py-2.5 rounded-pill bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs flex items-center gap-2 shadow-tint-sm transition-all cursor-pointer"
        >
          <span>Elaborar Projeto</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Feed de Notícias e Atualizações Oficiais: Gazeta Cultural de Viamão */}
      <div className="space-y-4">
        {/* Header do Feed, Barra de Busca e Filtros */}
        <div className="bg-[#FAF4EB] rounded-container p-5 sm:p-6 border border-[#2D0652]/10 shadow-tint-sm space-y-4">
          <div className="border-hand-drawn-bottom pb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#2D0652]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FF4500] text-sm" style={{ fontFamily: 'var(--font-display)' }}>Gazeta Cultural de Viamão</span>
              <span className="text-[#2D0652]/30">·</span>
              <span className="text-xs text-[#2D0652]/80 font-medium">Edição Semanal de Fomento, Notícias & Editais</span>
            </div>
            <div className="text-[11px] text-[#2D0652]/65 font-medium">
              Fontes Institucionais: Prefeitura de Viamão · SEDAC-RS · MinC
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-card bg-[#6A0DAD] text-white">
                  <Newspaper className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-[#2D0652] text-lg sm:text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                  Notícias, Editais & Fomento
                </h3>
              </div>
              <p className="text-xs text-[#2D0652]/70 mt-1 font-medium">
                Consulta em tempo real com validação institucional nos canais da Prefeitura, SEDAC-RS e MinC.
              </p>
            </div>

            {/* Ações de Busca */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-[#2D0652]/50 absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#2D0652]/15 rounded-pill focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD] text-[#2D0652] placeholder-[#2D0652]/40"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePesquisarGoogle()}
                  disabled={isSearchingGoogle}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold rounded-pill transition-all shadow-tint-sm disabled:opacity-50 cursor-pointer"
                  title="Pesquisar no Google Notícias"
                >
                  {isSearchingGoogle ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span>{isSearchingGoogle ? 'Consultando...' : 'Buscar'}</span>
                </button>

                <button
                  onClick={handleRestaurarAcervo}
                  disabled={isSearchingGoogle}
                  className="p-2 bg-white hover:bg-[#F5EAD8] text-[#2D0652] rounded-pill border border-[#2D0652]/15 transition-colors text-xs font-semibold cursor-pointer"
                  title="Restaurar notícias auditadas iniciais"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#6A0DAD]" />
                </button>

                <button
                  onClick={() => setMostrarPesquisaAvancada(!mostrarPesquisaAvancada)}
                  className={`p-2 rounded-pill border transition-colors text-xs font-semibold cursor-pointer ${
                    mostrarPesquisaAvancada
                      ? 'bg-[#6A0DAD] text-white border-[#6A0DAD]'
                      : 'bg-white hover:bg-[#F5EAD8] text-[#2D0652] border-[#2D0652]/15'
                  }`}
                  title="Abrir ferramentas de busca avançada oficial"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Sugestões de Pesquisas Rápidas (Chips) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="text-[#2D0652]/70 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
              Sugestões Rápidas:
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
                className="px-3 py-1 bg-white hover:bg-[#6A0DAD] hover:text-white text-[#2D0652] rounded-pill border border-[#2D0652]/15 transition-colors text-xs font-semibold cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Feedback de Pesquisa */}
          {searchFeedback && (
            <div
              className={`p-3 rounded-card border text-xs flex items-center justify-between gap-2 ${
                searchFeedback.tipo === 'success'
                  ? 'bg-[#E3F7E8] border-emerald-600/20 text-emerald-900'
                  : searchFeedback.tipo === 'alert'
                  ? 'bg-[#FFE8E0] border-[#FF4500]/25 text-[#D33600]'
                  : 'bg-[#EFE6FD] border-[#6A0DAD]/20 text-[#6A0DAD]'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {searchFeedback.tipo === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                {searchFeedback.tipo === 'alert' && <AlertTriangle className="w-4 h-4 text-[#FF4500] shrink-0" />}
                {searchFeedback.tipo === 'info' && <Info className="w-4 h-4 text-[#6A0DAD] shrink-0" />}
                <span>{searchFeedback.msg}</span>
              </div>
              <button
                onClick={() => setSearchFeedback(null)}
                className="text-slate-500 hover:text-slate-800 text-xs px-1 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Painel Expansível de Fontes Oficiais */}
          {mostrarPesquisaAvancada && (
            <div className="p-4 bg-white border border-[#2D0652]/10 rounded-card space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#2D0652]">
                  <Globe className="w-4 h-4 text-[#FF4500]" />
                  <span>Canais Oficiais Verificados</span>
                </div>
                <span className="text-xs text-[#2D0652]/70 font-semibold">Portais Oficiais</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:viamao.rs.gov.br "cultura" OR "edital"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#FAF4EB] border border-[#2D0652]/10 rounded-card hover:border-[#6A0DAD] hover:bg-white transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2D0652] group-hover:text-[#6A0DAD]">Prefeitura de Viamão</strong>
                    <span className="text-[11px] text-[#2D0652]/60">viamao.rs.gov.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#2D0652]/60 group-hover:text-[#6A0DAD]" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:procultura.rs.gov.br "Viamão"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#FAF4EB] border border-[#2D0652]/10 rounded-card hover:border-[#6A0DAD] hover:bg-white transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2D0652] group-hover:text-[#6A0DAD]">Pró-Cultura RS / SEDAC</strong>
                    <span className="text-[11px] text-[#2D0652]/60">procultura.rs.gov.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#2D0652]/60 group-hover:text-[#6A0DAD]" />
                </a>

                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent('site:camaraviamao.rs.gov.br "cultura"')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-[#FAF4EB] border border-[#2D0652]/10 rounded-card hover:border-[#6A0DAD] hover:bg-white transition-all flex items-center justify-between group"
                >
                  <div>
                    <strong className="block text-[#2D0652] group-hover:text-[#6A0DAD]">Câmara de Viamão</strong>
                    <span className="text-[11px] text-[#2D0652]/60">camaraviamao.rs.gov.br</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#2D0652]/60 group-hover:text-[#6A0DAD]" />
                </a>
              </div>
            </div>
          )}

          {/* Abas por Categoria (Segmented Control com Pill Roxo Cult) */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#2D0652]/10">
            {[
              { id: 'todos', label: 'Todas as Notícias', count: noticias.length },
              { id: 'viamao', label: 'Cultura Viamão', count: noticias.filter(n => n.jurisdicao === 'Municipal (Viamão)' || n.categoria_filtro === 'viamao').length },
              { id: 'editais', label: 'Editais & Fomento', count: noticias.filter(n => n.categoria_filtro === 'editais').length },
              { id: 'eventos', label: 'Festejos & Eventos', count: noticias.filter(n => n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira')).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroCategoria(tab.id)}
                className={`px-3.5 py-1.5 rounded-pill text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  filtroCategoria === tab.id
                    ? 'bg-[#6A0DAD] text-white shadow-tint-sm'
                    : 'bg-white text-[#2D0652] hover:bg-[#F5EAD8] border border-[#2D0652]/15'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-pill ${
                  filtroCategoria === tab.id ? 'bg-white/20 text-white' : 'bg-[#EFE6FD] text-[#6A0DAD]'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* MANCHETE PRINCIPAL DA SEMANA */}
        {manchete && (
          <article className="bg-[#2D0652] text-white rounded-container p-6 sm:p-7 shadow-tint-lg border border-white/10 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              {/* Metadados em linha única no topo */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-pill bg-[#FF4500] text-white font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    Manchete da Edição
                  </span>
                  <span className="px-2.5 py-1 rounded-pill bg-white/10 text-purple-200 font-semibold text-xs border border-white/15">
                    {manchete.origem}
                  </span>
                  {manchete.veiculo_imprensa && (
                    <span className="px-2.5 py-1 rounded-pill bg-[#E3F7E8] text-[#166534] font-bold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {manchete.veiculo_imprensa}
                    </span>
                  )}
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FF4500]" />
                    {manchete.data}
                  </span>
                </div>

                <div className="text-xs text-white bg-white/10 px-3 py-1 rounded-pill border border-white/15 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fonte Verificada</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {manchete.imagem && (
                  <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-card bg-white p-2 border border-white/20 flex items-center justify-center overflow-hidden">
                    <img
                      src={manchete.imagem}
                      alt={manchete.veiculo_imprensa || manchete.origem || 'Fonte'}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                    {manchete.titulo}
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-purple-100/90 leading-relaxed max-w-4xl">
                    {manchete.resumo}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <a
                  href={
                    manchete.url_pesquisa_google ||
                    `https://www.google.com/search?q=${encodeURIComponent(`"${manchete.titulo}" Viamão`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white rounded-pill text-xs font-bold transition-all shadow-tint-sm flex items-center gap-1.5"
                  title="Pesquisar esta notícia no Google"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Pesquisar no Google</span>
                </a>
              </div>
            </div>
          </article>
        )}

        {/* Demais Notícias Grid */}
        {demaisNoticias.length === 0 && !manchete ? (
          <div className="bg-[#FAF4EB] rounded-container border border-[#2D0652]/10 p-8 text-center text-[#2D0652] space-y-3">
            <LottieStateAnimation
              type="empty-list"
              altText="Nenhuma publicação encontrada para os filtros selecionados"
              size={110}
            />
            <div className="space-y-1">
              <h4 className="font-bold text-[#2D0652] text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                Nenhuma publicação encontrada para os filtros selecionados
              </h4>
              <p className="text-xs text-[#2D0652]/70 max-w-md mx-auto leading-relaxed">
                Apenas notícias e editais devidamente verificados em fontes públicas e de imprensa consolidada de Viamão e do RS são exibidos.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleRestaurarAcervo}
                className="px-5 py-2 bg-[#6A0DAD] text-white text-xs font-bold rounded-pill hover:bg-[#580B91] transition-all shadow-tint-sm cursor-pointer"
              >
                Restaurar Acervo Oficial
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {demaisNoticias.map(item => {
              return (
                <article
                  key={item.id}
                  className="bg-white rounded-card border border-[#2D0652]/10 overflow-hidden shadow-tint-sm hover:shadow-tint-md hover:border-[#6A0DAD] transition-all flex flex-col justify-between group"
                >
                  {/* Topo Institucional do Card - Metadados em linha única */}
                  <div className="p-3.5 border-b border-[#2D0652]/8 bg-[#FAF4EB] text-[#2D0652]">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold min-w-0">
                        {item.imagem ? (
                          <div className="w-5 h-5 rounded-md bg-white p-0.5 border border-[#2D0652]/10 flex items-center justify-center shrink-0 overflow-hidden">
                            <img
                              src={item.imagem}
                              alt={item.origem}
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget.parentElement as HTMLElement)?.classList.add('hidden');
                              }}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <Building className="w-3.5 h-3.5 shrink-0 text-[#6A0DAD]" />
                        )}
                        <span className="truncate">{item.origem}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-[#2D0652]/70 font-medium">
                        <Calendar className="w-3 h-3 text-[#2D0652]/50" />
                        <span>{item.data}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-bold bg-[#EFE6FD] text-[#6A0DAD] px-2.5 py-0.5 rounded-pill border border-[#6A0DAD]/20">
                        {item.etiqueta}
                      </span>
                      {item.veiculo_imprensa ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-pill bg-[#E3F7E8] text-[#166534] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {item.veiculo_imprensa}
                        </span>
                      ) : item.fonte_confiavel ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-pill bg-[#E3F7E8] text-[#166534] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Fonte Verificada
                        </span>
                      ) : item.jurisdicao ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-white text-[#2D0652] border border-[#2D0652]/10">
                          {item.jurisdicao}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#2D0652] text-sm sm:text-base leading-snug group-hover:text-[#6A0DAD] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                        {item.titulo}
                      </h4>

                      <p className="text-xs text-[#2D0652]/80 leading-relaxed line-clamp-3 font-normal">
                        {item.resumo}
                      </p>
                    </div>

                    {/* Footer do Card com Botão de Ação */}
                    <div className="pt-3 border-t border-[#2D0652]/8 flex items-center justify-end gap-1 text-xs">
                      <a
                        href={
                          item.url_pesquisa_google ||
                          `https://www.google.com/search?q=${encodeURIComponent(`"${item.titulo}" Viamão`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#FF4500] hover:bg-[#E03D00] px-3.5 py-1.5 rounded-pill transition-all shadow-tint-sm cursor-pointer"
                        title="Pesquisar esta notícia no Google"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Pesquisar no Google</span>
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
