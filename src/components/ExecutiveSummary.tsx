import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Landmark,
  FileText,
  MapPin,
  ExternalLink,
  ArrowRight,
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
  Building2,
  Search,
  RefreshCw,
  Award
} from 'lucide-react';
import { Emenda, PnabRecord, LeiIncentivo, PontoCultural, NewsItem } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface ExecutiveSummaryProps {
  emendas: Emenda[];
  pnabList: PnabRecord[];
  leisIncentivo: LeiIncentivo[];
  pontosCulturais: PontoCultural[];
  noticias: NewsItem[];
  onNavigateTab: (tab: string) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  emendas,
  pnabList,
  leisIncentivo,
  pontosCulturais,
  noticias,
  onNavigateTab,
}) => {
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [buscaTexto, setBuscaTexto] = useState<string>('');
  const [noticiaSelecionada, setNoticiaSelecionada] = useState<NewsItem | null>(null);

  // KPIs
  const emendasCulturais = emendas.filter(e => e.is_cultura);
  const totalEmendasCulturais = emendasCulturais.reduce((acc, curr) => acc + curr.valor, 0);
  const totalEmendasGastas = emendasCulturais.reduce((acc, curr) => acc + (curr.valor_gasto || 0), 0);

  const totalPnabEmCaixa = pnabList.reduce((acc, curr) => acc + curr.valor_exato, 0);
  const totalLeisIncentivo = leisIncentivo.reduce((acc, curr) => acc + curr.valor_aprovado, 0);
  const volumeTotalCultura = totalEmendasCulturais + totalPnabEmCaixa + totalLeisIncentivo;

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

  return (
    <div className="space-y-6">
      {/* Hero Header - Cores Cívicas e Foco em Transparência */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-xs border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Portal de Transparência, Editais e Fomento Cultural de Viamão
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white leading-snug">
            Cultura Transparente & Central Oficial de Editais
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
            Acompanhe em tempo real oportunidades de fomento, orientações técnicas de elegibilidade e a destinação de recursos públicos para a cultura em Viamão e no Rio Grande do Sul através de dados auditados e fontes oficiais primárias.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('pnab')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs"
            >
              <Landmark className="w-4 h-4" />
              <span>Painel PNAB Viamão</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('fac')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs sm:text-sm border border-white/20 transition-all"
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>FAC / SEDAC-RS (Pró-Cultura)</span>
            </button>
            <button
              onClick={() => onNavigateTab('rouanet')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs sm:text-sm border border-white/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Consultar SalicNet (Lei Rouanet)</span>
            </button>
            <button
              onClick={() => onNavigateTab('acompanhe-cultura')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl font-medium text-xs sm:text-sm border border-white/20 transition-all"
            >
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>Espaços & Redes Culturais</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (3 Colunas Equilibradas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Verbas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Volume Total Rastreado</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e40af] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-['Outfit']">
              {formatBRL(volumeTotalCultura)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Soma de PNAB, Emendas e Leis de Fomento em Viamão
            </p>
          </div>
        </div>

        {/* Emendas Culturais */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Emendas para Cultura</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e40af] flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-['Outfit']">
              {emendasCulturais.length} Registros
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {formatBRL(totalEmendasCulturais)} alocados ({formatBRL(totalEmendasGastas)} liquidados)
            </p>
          </div>
        </div>

        {/* Espaços Culturais */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Espaços Mapeados</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-['Outfit']">
              {pontosCulturais.length} Entidades
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Pontos e espaços culturais validados em Viamão
            </p>
          </div>
        </div>
      </div>

      {/* Diretriz Técnica e Alerta de Jurisdição Territorial */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
              Radar Técnico de Elegibilidade: Porto Alegre vs. Viamão & Estado do RS
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              <strong>Atenção Fazedores de Cultura de Viamão:</strong> Editais municipais do <strong>Fumproarte (SMC Porto Alegre)</strong> exigem comprovação estrita de domicílio fiscal na capital, gerando <em>inabilitação sumária</em> para proponentes residentes em Viamão. No entanto, os editais do <strong>FAC/SEDAC-RS (Pró-Cultura RS)</strong>, da <strong>PNAB Federal</strong> e da <strong>Lei Rouanet</strong> acolhem plenamente agentes e coletivos de Viamão.
            </p>
          </div>
        </div>
        <button
          onClick={() => setFiltroCategoria('editais')}
          className="shrink-0 px-3.5 py-2 bg-amber-200/80 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl transition-all border border-amber-300"
        >
          Filtrar Oportunidades
        </button>
      </div>

      {/* MOTOR DO FEED DE NOTÍCIAS E ATUALIZAÇÕES OFICIAIS */}
      <div className="space-y-4">
        {/* Header do Feed, Barra de Busca e Filtros Oficiais */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg font-['Outfit']">
                  Jornal Cultural de Viamão
                </h3>
                <span className="bg-blue-50 text-[#1e40af] text-[11px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  Resumos da Web / Notícias
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Giro de notícias gerado através das últimas atualizações, eventos e movimentações da cultura na cidade de Viamão (Google Search)
              </p>
            </div>

            {/* Campo de Busca Rápida no Feed */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaTexto}
                onChange={e => setBuscaTexto(e.target.value)}
                placeholder="Buscar notícias ou editais..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>
          </div>

          {/* Abas por Fonte Primária Oficial */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {[
              { id: 'todos', label: 'Últimas Notícias', count: noticias.length },
              { id: 'viamao', label: 'Cultura Viamão', count: noticias.filter(n => n.jurisdicao === 'Municipal (Viamão)').length },
              { id: 'editais', label: 'Editais & Fomento', count: noticias.filter(n => n.categoria_filtro === 'editais').length },
              { id: 'eventos', label: 'Festejos & Eventos', count: noticias.filter(n => n.etiqueta.includes('Evento') || n.etiqueta.includes('Tradição') || n.etiqueta.includes('Feira')).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroCategoria(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                  filtroCategoria === tab.id
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filtroCategoria === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Feed Cards Grid */}
        {noticiasFiltradas.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium">Nenhum comunicado encontrado para o filtro selecionado.</p>
            <button
              onClick={() => { setFiltroCategoria('todos'); setBuscaTexto(''); }}
              className="mt-3 text-xs text-[#1e40af] font-semibold hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {noticiasFiltradas.map(item => {
              // Estilização do cabeçalho institucional por órgão
              const isMinC = item.origem === 'Federal (MinC)';
              const isSedac = item.origem === 'Estadual (SEDAC-RS)';
              const isViamao = item.origem === 'Municipal (Viamão)';

              return (
                <article
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-blue-300"
                >
                  {/* Topo Institucional do Card */}
                  <div className={`p-4 border-b ${
                    isMinC
                      ? 'bg-blue-50/60 border-blue-100 text-blue-950'
                      : isSedac
                      ? 'bg-emerald-50/60 border-emerald-100 text-emerald-950'
                      : 'bg-amber-50/60 border-amber-100 text-amber-950'
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
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold bg-white px-2 py-0.5 rounded-full border shadow-2xs">
                        {item.etiqueta}
                      </span>
                      {item.jurisdicao && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          item.jurisdicao.includes('Alerta')
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.jurisdicao}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Corpo do Card */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug font-['Outfit'] group-hover:text-[#1e40af] transition-colors">
                        {item.titulo}
                      </h4>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {item.resumo}
                      </p>
                    </div>

                    {/* Destaques Técnicos Rápidos */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 text-[11px]">
                      {item.prazo && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-[#1e40af] shrink-0" />
                          <span>Prazo: <strong>{item.prazo}</strong></span>
                        </div>
                      )}

                      {item.plataforma && (
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Layers className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="truncate">Plataforma: <strong>{item.plataforma}</strong></span>
                        </div>
                      )}

                      {item.elegibilidade && (
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          Elegibilidade: <strong>{item.elegibilidade}</strong>
                        </div>
                      )}
                    </div>

                    {/* Footer do Card com Links Oficiais Seguros */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => setNoticiaSelecionada(item)}
                        className="font-bold text-[#1e40af] hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>Ver Requisitos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-[#1e40af] bg-slate-100 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                        title="Acessar página oficial do órgão público"
                      >
                        <span>Acessar Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Notícia / Edital Oficial */}
      {noticiaSelecionada && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-[#1e40af] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  {noticiaSelecionada.etiqueta}
                </span>
                <h3 className="font-bold text-slate-900 text-lg font-['Outfit'] mt-2">
                  {noticiaSelecionada.titulo}
                </h3>
              </div>
              <button
                onClick={() => setNoticiaSelecionada(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{noticiaSelecionada.resumo}</p>

              {noticiaSelecionada.alerta_inabilitacao && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-950">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Alerta de Risco de Inabilitação
                  </div>
                  <p className="text-xs">{noticiaSelecionada.alerta_inabilitacao}</p>
                </div>
              )}

              {noticiaSelecionada.requisitos_praticos && noticiaSelecionada.requisitos_praticos.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Requisitos Práticos & Orientações de Submissão:
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {noticiaSelecionada.requisitos_praticos.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1e40af] shrink-0 mt-1.5"></span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Órgão Emissor</span>
                  <span className="font-semibold text-slate-800">{noticiaSelecionada.origem}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Data do Comunicado</span>
                  <span className="font-semibold text-slate-800">{noticiaSelecionada.data}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setNoticiaSelecionada(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Fechar
              </button>

              <a
                href={noticiaSelecionada.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <span>Acessar Portal Oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
