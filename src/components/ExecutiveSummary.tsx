import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
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
      {/* KPI Cards Grid (3 Colunas em Fundo Areia Claro #FAF4EB / Branco) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Emendas Culturais */}
        <div className="bg-[#FAF4EB] rounded-2xl p-5 border border-[#E2D2BC] shadow-xs hover:border-[#6A0DAD] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0652]/70">Emendas Culturais</span>
            <div className="w-10 h-10 rounded-full bg-[#EFE6FD] text-[#6A0DAD] flex items-center justify-center border border-[#DCC7FB]">
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
        </div>

        {/* Status das Emendas */}
        <div className="bg-[#FAF4EB] rounded-2xl p-5 border border-[#E2D2BC] shadow-xs hover:border-[#FF4500] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0652]/70">Execução Orçamentária</span>
            <div className="w-10 h-10 rounded-full bg-[#FFE8E0] text-[#FF4500] flex items-center justify-center border border-[#FFC2B2]">
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
        </div>

        {/* PNAB Painel Oficial */}
        <div 
          onClick={() => onNavigateTab('pnab')}
          className="bg-[#FAF4EB] rounded-2xl p-5 border border-[#E2D2BC] shadow-xs hover:border-[#6A0DAD] transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D0652]/70">Painel Oficial PNAB</span>
            <div className="w-10 h-10 rounded-full bg-[#EFE6FD] text-[#6A0DAD] flex items-center justify-center border border-[#DCC7FB] group-hover:bg-[#6A0DAD] group-hover:text-white transition-colors">
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
        </div>
      </div>

      {/* Banner de Destaque: Auxílio ao Fazedor de Cultura (IA) */}
      <div className="bg-[#2D0652] rounded-3xl p-6 sm:p-7 text-white shadow-md border border-[#3D0B6D] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 border border-purple-400/40 shadow-xs mt-0.5">
            <Sparkles className="w-6 h-6 text-[#FF4500]" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Recurso Cidadão
              </span>
              <span className="text-[10px] font-black bg-[#FF4500] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                Consultor IA
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Auxílio ao Fazedor de Cultura · Estruturador de Projetos
            </h3>
            <p className="text-xs text-purple-100/80 max-w-2xl leading-relaxed">
              Elabore propostas técnicas para PNAB, FAC-RS, Rouanet e editais municipais com auxílio inteligente passo a passo, cronograma, planilha orçamentária e exportação em PDF.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('auxilio-fazedor')}
          className="shrink-0 px-5 py-2.5 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <span>Elaborar Projeto</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Feed de Notícias e Atualizações Oficiais */}
      <div className="space-y-4">
        {/* Header do Feed, Barra de Busca e Filtros */}
        <div className="bg-[#FAF4EB] rounded-3xl p-5 sm:p-6 border border-[#E2D2BC] shadow-xs space-y-4">
          <div className="border-b border-[#E2D2BC] pb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#2D0652]/70 font-semibold">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#FF4500] tracking-wider uppercase">Jornal da Cultura de Viamão</span>
              <span>•</span>
              <span>FEED DE NOTÍCIAS & PESQUISA GOOGLE</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#6A0DAD] text-white shadow-2xs">
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
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2D2BC] rounded-full focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD] text-[#2D0652] placeholder-[#2D0652]/40"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePesquisarGoogle()}
                  disabled={isSearchingGoogle}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold rounded-full transition-all shadow-xs disabled:opacity-50 cursor-pointer"
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
                  className="p-2 bg-white hover:bg-[#F5EAD8] text-[#2D0652] rounded-full border border-[#E2D2BC] transition-colors text-xs font-semibold cursor-pointer"
                  title="Restaurar notícias auditadas iniciais"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#6A0DAD]" />
                </button>

                <button
                  onClick={() => setMostrarPesquisaAvancada(!mostrarPesquisaAvancada)}
                  className={`p-2 rounded-full border transition-colors text-xs font-semibold cursor-pointer ${
                    mostrarPesquisaAvancada
                      ? 'bg-[#6A0DAD] text-white border-[#6A0DAD]'
                      : 'bg-white hover:bg-[#F5EAD8] text-[#2D0652] border-[#E2D2BC]'
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
                className="px-3 py-1 bg-white hover:bg-[#6A0DAD] hover:text-white text-[#2D0652] rounded-full border border-[#E2D2BC] transition-colors text-xs font-semibold cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Feedback de Pesquisa */}
          {searchFeedback && (
            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
                searchFeedback.tipo === 'success'
                  ? 'bg-[#E3F7E8] border-[#B7ECC3] text-[#166534]'
                  : searchFeedback.tipo === 'alert'
                  ? 'bg-[#FFE8E0] border-[#FFC2B2] text-[#D33600]'
                  : 'bg-[#EFE6FD] border-[#DCC7FB] text-[#6A0DAD]'
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
                className="text-slate-500 hover:text-slate-800 text-xs px-1 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Painel Expansível de Fontes Oficiais */}
          {mostrarPesquisaAvancada && (
            <div className="p-4 bg-white border border-[#E2D2BC] rounded-2xl space-y-3 text-xs">
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
                  className="p-3 bg-[#FAF4EB] border border-[#E2D2BC] rounded-xl hover:border-[#6A0DAD] hover:bg-white transition-all flex items-center justify-between group"
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
                  className="p-3 bg-[#FAF4EB] border border-[#E2D2BC] rounded-xl hover:border-[#6A0DAD] hover:bg-white transition-all flex items-center justify-between group"
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
                  className="p-3 bg-[#FAF4EB] border border-[#E2D2BC] rounded-xl hover:border-[#6A0DAD] hover:bg-white transition-all flex items-center justify-between group"
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
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E2D2BC]">
            {[
              { id: 'todos', label: 'Todas as Notícias', count: noticias.length },
              { id: 'viamao', label: 'Cultura Viamão', count: noticias.filter(n => n.jurisdicao === 'Municipal (Viamão)' || n.categoria_filtro === 'viamao').length },
              { id: 'editais', label: 'Editais & Fomento', count: noticias.filter(n => n.categoria_filtro === 'editais').length },
              { id: 'eventos', label: 'Festejos & Eventos', count: noticias.filter(n => n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira')).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroCategoria(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                  filtroCategoria === tab.id
                    ? 'bg-[#6A0DAD] text-white shadow-xs'
                    : 'bg-white text-[#2D0652] hover:bg-[#F5EAD8] border border-[#E2D2BC]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full ${
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
          <article className="bg-[#2D0652] text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-[#3D0B6D] relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#FF4500] text-white font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3 text-white" />
                    Manchete da Edição
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/15 text-purple-200 font-semibold text-xs border border-white/20">
                    {manchete.origem}
                  </span>
                  {manchete.veiculo_imprensa && (
                    <span className="px-2.5 py-1 rounded-full bg-[#E3F7E8] text-[#166534] font-bold text-xs flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      {manchete.veiculo_imprensa}
                    </span>
                  )}
                  <span className="text-white/80 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FF4500]" />
                    {manchete.data}
                  </span>
                </div>

                <div className="text-xs text-white bg-white/15 px-3 py-1 rounded-full border border-white/20 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fonte Verificada</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {manchete.imagem && (
                  <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 border border-white/20 flex items-center justify-center overflow-hidden">
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
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#E03D00] text-white rounded-full text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
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
          <div className="bg-[#FAF4EB] rounded-3xl border border-[#E2D2BC] p-8 text-center text-[#2D0652] space-y-3">
            <div className="p-3 bg-[#EFE6FD] rounded-full w-12 h-12 flex items-center justify-center mx-auto text-[#6A0DAD] border border-[#DCC7FB]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-[#2D0652] text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                Nenhum comunicado oficial encontrado
              </h4>
              <p className="text-xs text-[#2D0652]/70 max-w-md mx-auto leading-relaxed">
                Apenas notícias e editais devidamente verificados em fontes públicas e de imprensa consolidada de Viamão e do RS são exibidos.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={handleRestaurarAcervo}
                className="px-5 py-2 bg-[#6A0DAD] text-white text-xs font-bold rounded-full hover:bg-[#580B91] transition-all shadow-xs"
              >
                Restaurar Acervo Oficial
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {demaisNoticias.map(item => {
              const isMinC = item.origem === 'Federal (MinC)';
              const isSedac = item.origem === 'Estadual (SEDAC-RS)';

              return (
                <article
                  key={item.id}
                  className="bg-white rounded-3xl border border-[#E2D2BC] overflow-hidden shadow-xs hover:shadow-md hover:border-[#6A0DAD] transition-all flex flex-col justify-between group"
                >
                  {/* Topo Institucional do Card */}
                  <div className={`p-4 border-b border-[#E2D2BC] ${
                    isMinC
                      ? 'bg-[#FAF4EB] text-[#2D0652]'
                      : isSedac
                      ? 'bg-[#FAF4EB] text-[#2D0652]'
                      : 'bg-[#FAF4EB] text-[#2D0652]'
                  }`}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 font-bold min-w-0">
                        {item.imagem ? (
                          <div className="w-5 h-5 rounded-md bg-white p-0.5 border border-[#E2D2BC] flex items-center justify-center shrink-0 overflow-hidden">
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
                      <div className="flex items-center gap-1 text-xs text-[#2D0652]/70 font-medium">
                        <Calendar className="w-3 h-3 text-[#2D0652]/50" />
                        <span>{item.data}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-bold bg-[#EFE6FD] text-[#6A0DAD] px-2.5 py-0.5 rounded-full border border-[#DCC7FB]">
                        {item.etiqueta}
                      </span>
                      {item.veiculo_imprensa ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3F7E8] text-[#166534] flex items-center gap-1 border border-[#B7ECC3]">
                          <Check className="w-3 h-3 text-emerald-600" />
                          {item.veiculo_imprensa}
                        </span>
                      ) : item.fonte_confiavel ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E3F7E8] text-[#166534] flex items-center gap-1 border border-[#B7ECC3]">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Fonte Verificada
                        </span>
                      ) : item.jurisdicao ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FAF4EB] text-[#2D0652] border border-[#E2D2BC]">
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
                    <div className="pt-3 border-t border-[#E2D2BC] flex items-center justify-end gap-1 text-xs">
                      <a
                        href={
                          item.url_pesquisa_google ||
                          `https://www.google.com/search?q=${encodeURIComponent(`"${item.titulo}" Viamão`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#FF4500] hover:bg-[#E03D00] px-3.5 py-1.5 rounded-full transition-all shadow-xs cursor-pointer"
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
