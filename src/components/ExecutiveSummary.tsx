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
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { Emenda, NewsItem } from '../types/culture';
import { formatBRL } from '../utils/formatters';
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

  const volumeTotalCultura = totalEmendasCulturais;

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
        {/* Total Emendas Culturais */}
        <div className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs hover:border-[#6A0DAD] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Emendas Culturais</span>
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 text-[#c084fc] flex items-center justify-center border border-purple-700/40">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-['Outfit']">
              {formatBRL(volumeTotalCultura)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Total consolidado em emendas parlamentares para Viamão
            </p>
          </div>
        </div>

        {/* Status das Emendas */}
        <div className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs hover:border-[#FF4500] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Execução das Emendas</span>
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

        {/* PNAB Painel Oficial */}
        <div 
          onClick={() => onNavigateTab('pnab')}
          className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-300/70">Painel Oficial PNAB</span>
            <div className="w-9 h-9 rounded-xl bg-purple-900/40 text-[#c084fc] flex items-center justify-center border border-purple-700/40 group-hover:bg-purple-800/50 transition-colors">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-['Outfit'] flex items-center gap-2">
              <span>Painel MinC</span>
              <ArrowRight className="w-4 h-4 text-[#FF4500] group-hover:translate-x-1 transition-transform" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Consulta interativa via Power BI oficial do Ministério da Cultura
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Destaque: Auxílio ao Fazedor de Cultura (IA) */}
      <div className="bg-gradient-to-r from-[#17082e] via-[#1f0b3d] to-[#120524] rounded-2xl p-5 sm:p-6 border border-purple-800/50 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 border border-purple-400/40 shadow-xs mt-0.5">
            <Sparkles className="w-5 h-5 text-[#FF4500]" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-['Outfit']">
                Novo Recurso de Apoio
              </span>
              <span className="text-[10px] font-bold bg-[#FF4500] text-white px-2 py-0.2 rounded-full uppercase">
                Consultor IA
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Auxílio ao Fazedor de Cultura • Estruturador de Projetos
            </h3>
            <p className="text-xs text-purple-200/70 max-w-2xl leading-relaxed">
              Elabore sua proposta técnica para a PNAB, FAC-RS, Rouanet e LPG com auxílio inteligente passo a passo, plano de acessibilidade, cronograma, planilha orçamentária e exportação direta em PDF.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('auxilio-fazedor')}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-[#6A0DAD] hover:bg-[#7e12cf] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-950/40 border border-purple-400/30 transition-all cursor-pointer"
        >
          <span>Elaborar Meu Projeto</span>
          <ArrowRight className="w-4 h-4 text-[#FF4500]" />
        </button>
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

              <div className="flex flex-col sm:flex-row gap-4 items-start">
                {manchete.imagem && (
                  <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white/10 p-2 border border-purple-500/30 flex items-center justify-center shadow-inner overflow-hidden">
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
                  <h4 className="text-xl sm:text-2xl font-black font-['Outfit'] text-white group-hover:text-purple-200 transition-colors leading-snug">
                    {manchete.titulo}
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed max-w-4xl">
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
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#e03d00] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  title="Pesquisar esta notícia no Google Search"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Pesquisar no Google</span>
                </a>
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
                      <div className="flex items-center gap-2 font-bold min-w-0">
                        {item.imagem ? (
                          <div className="w-5 h-5 rounded-md bg-white/10 p-0.5 border border-white/15 flex items-center justify-center shrink-0 overflow-hidden">
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
                          <Building className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span className="truncate">{item.origem}</span>
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

                    {/* Footer do Card com Botão de Pesquisa no Google */}
                    <div className="pt-3 border-t border-purple-900/30 flex items-center justify-end gap-1 text-xs">
                      <a
                        href={
                          item.url_pesquisa_google ||
                          `https://www.google.com/search?q=${encodeURIComponent(`"${item.titulo}" Viamão`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-white bg-[#FF4500] hover:bg-[#e03d00] px-3 py-1.5 rounded-xl transition-all shadow-xs"
                        title="Pesquisar esta notícia no Google Search"
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
