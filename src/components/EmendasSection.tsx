import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import {
  Search,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShieldCheck,
  ArrowUpDown,
  Table as TableIcon,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Building2,
  Info
} from 'lucide-react';
import { Emenda } from '../types/culture';
import { formatBRL, exportEmendasToCSV } from '../utils/formatters';
import { BUDGET_CHRONOLOGY } from '../data/initialData';

interface EmendasSectionProps {
  emendas: Emenda[];
  onSimulateApiFetch: () => void;
  isFetchingApi: boolean;
}

type SortField = 'valor' | 'valor_gasto' | 'ano' | 'parlamentar';
type SortOrder = 'asc' | 'desc';

export const EmendasSection: React.FC<EmendasSectionProps> = ({
  emendas,
  onSimulateApiFetch,
  isFetchingApi,
}) => {
  const [showBudgetSummary, setShowBudgetSummary] = useState<boolean>(false);
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  const [filtroEsfera, setFiltroEsfera] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPartido, setFiltroPartido] = useState<string>('todos');
  const [filtroSegmento, setFiltroSegmento] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('valor');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Available filter options
  const anosDisponiveis = useMemo(() => {
    return Array.from(new Set(emendas.map(e => e.ano))).sort((a: number, b: number) => b - a);
  }, [emendas]);

  const esferasDisponiveis = useMemo(() => {
    return Array.from(new Set(emendas.map(e => e.esfera))).sort();
  }, [emendas]);

  const partidosDisponiveis = useMemo(() => {
    return Array.from(
      new Set(emendas.map(e => e.partido_sigla || e.partido).filter(Boolean))
    ).sort();
  }, [emendas]);

  const segmentosDisponiveis = useMemo(() => {
    return Array.from(
      new Set(emendas.filter(e => e.is_cultura && e.tipo_projeto_cultural).map(e => e.tipo_projeto_cultural as string))
    ).sort();
  }, [emendas]);

  // Filtering (strictly Cultural & Viamão)
  const emendasFiltradas = useMemo(() => {
    const list = emendas.filter(item => {
      if (!item.is_cultura) return false;
      if (filtroAno !== 'todos' && item.ano !== Number(filtroAno)) return false;
      if (filtroEsfera !== 'todas' && item.esfera !== filtroEsfera) return false;
      if (filtroStatus !== 'todos' && item.status !== filtroStatus) return false;
      if (filtroPartido !== 'todos') {
        const p = (item.partido_sigla || item.partido || '').toLowerCase();
        if (!p.includes(filtroPartido.toLowerCase())) return false;
      }
      if (filtroSegmento !== 'todos' && item.tipo_projeto_cultural !== filtroSegmento) {
        return false;
      }
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const matchParlamentar = item.parlamentar.toLowerCase().includes(q);
        const matchSub = item.subprojeto.toLowerCase().includes(q);
        const matchProj = item.projeto.toLowerCase().includes(q);
        const matchOrgao = item.orgao.toLowerCase().includes(q);
        const matchNum = item.numeroEmenda?.toLowerCase().includes(q) || false;
        const matchBenef = item.beneficiario?.toLowerCase().includes(q) || false;
        const matchProcesso = item.processo_administrativo?.toLowerCase().includes(q) || false;
        const matchEmpenho = item.empenho_numero?.toLowerCase().includes(q) || false;

        if (
          !matchParlamentar &&
          !matchSub &&
          !matchProj &&
          !matchOrgao &&
          !matchNum &&
          !matchBenef &&
          !matchProcesso &&
          !matchEmpenho
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      if (sortField === 'valor') {
        valA = a.valor;
        valB = b.valor;
      } else if (sortField === 'valor_gasto') {
        valA = a.valor_gasto || 0;
        valB = b.valor_gasto || 0;
      } else if (sortField === 'ano') {
        valA = a.ano;
        valB = b.ano;
      } else if (sortField === 'parlamentar') {
        valA = a.parlamentar.toLowerCase();
        valB = b.parlamentar.toLowerCase();
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB as string) : (valB as string).localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return list;
  }, [
    emendas,
    filtroAno,
    filtroEsfera,
    filtroStatus,
    filtroPartido,
    filtroSegmento,
    busca,
    sortField,
    sortOrder,
  ]);

  // Aggregate stats
  const totalAlocado = useMemo(() => {
    return emendasFiltradas.reduce((acc, curr) => acc + curr.valor, 0);
  }, [emendasFiltradas]);

  const totalGasto = useMemo(() => {
    return emendasFiltradas.reduce((acc, curr) => acc + (curr.valor_gasto || 0), 0);
  }, [emendasFiltradas]);

  const saldoPendente = totalAlocado - totalGasto;
  const taxaExecucaoNum = totalAlocado > 0 ? (totalGasto / totalAlocado) * 100 : 0;
  const percentualGeral = taxaExecucaoNum.toFixed(1);

  // Chart 1: Alocado vs Liquidado por Órgão
  const barDataResumido = useMemo(() => {
    const map: Record<string, { nome: string; alocado: number; gasto: number }> = {};

    emendasFiltradas.forEach(e => {
      let label = 'Outros';
      if (e.esfera.includes('Estadual') || e.secretaria?.includes('SEDAC')) {
        label = 'SEDAC / RS';
      } else if (e.esfera.includes('Federal') || e.secretaria?.includes('MinC')) {
        label = 'MinC / Fed';
      } else if (e.esfera.includes('Municipal')) {
        label = 'Municipal';
      } else {
        label = e.secretaria?.split(' ')[0] || 'Outros';
      }

      if (!map[label]) {
        map[label] = { nome: label, alocado: 0, gasto: 0 };
      }
      map[label].alocado += e.valor;
      map[label].gasto += e.valor_gasto || 0;
    });

    return Object.values(map).sort((a, b) => b.alocado - a.alocado);
  }, [emendasFiltradas]);

  // Chart 2: Distribuição por Segmento Cultural
  const pieDataResumido = useMemo(() => {
    const map: Record<string, number> = {};

    emendasFiltradas.forEach(e => {
      const tipo = e.tipo_projeto_cultural || 'Outras Ações';
      map[tipo] = (map[tipo] || 0) + e.valor;
    });

    const colorsMap: Record<string, string> = {
      'Hip-Hop & Cultura Urbana': '#6A0DAD',
      'Audiovisual & Cinema': '#FF4500',
      'Patrimônio & Restauro': '#2D0652',
      'Tradição & Folclore': '#D33600',
      'Música & Artes Cênicas': '#9333EA',
      'Literatura & Leitura': '#E03D00',
      'Outras Ações Culturais': '#7E22CE',
    };

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colorsMap[name] || '#6A0DAD',
    })).sort((a, b) => b.value - a.value);
  }, [emendasFiltradas]);

  // Chart 3: Chronology Chart Data
  const areaDataResumido = useMemo(() => {
    if (filtroAno === 'todos') {
      return BUDGET_CHRONOLOGY;
    }
    return BUDGET_CHRONOLOGY.filter(p => p.ano === Number(filtroAno));
  }, [filtroAno]);

  const hasActiveFilters = filtroAno !== 'todos' || filtroEsfera !== 'todas' || filtroStatus !== 'todos' || filtroPartido !== 'todos' || filtroSegmento !== 'todos' || busca.trim().length > 0;

  const resetFilters = () => {
    setFiltroAno('todos');
    setFiltroEsfera('todas');
    setFiltroStatus('todos');
    setFiltroPartido('todos');
    setFiltroSegmento('todos');
    setBusca('');
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleCopyFicha = (emenda: Emenda, e: React.MouseEvent) => {
    e.stopPropagation();
    const texto = `[AUDITORIA ORÇAMENTÁRIA - CULT CIRCUITO VIAMÃO]
Código: ${emenda.numeroEmenda || emenda.id} (${emenda.ano})
Esfera: ${emenda.esfera}
Proponente: ${emenda.parlamentar} [${emenda.partido_sigla || emenda.partido}]
Objeto: ${emenda.subprojeto}
Beneficiário: ${emenda.beneficiario || 'Prefeitura de Viamão'}
Dotação Alocada: ${formatBRL(emenda.valor)}
Valor Liquidado: ${formatBRL(emenda.valor_gasto || 0)}
Status: ${emenda.status}
Nota de Empenho: ${emenda.empenho_numero || 'Não informado'}
Processo: ${emenda.processo_administrativo || 'Não informado'}
Fontes: ${emenda.fontes_cruzadas?.join(' | ') || emenda.fonte}`;

    navigator.clipboard.writeText(texto);
    setCopiedId(emenda.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Spreadsheet & Dashboard Header */}
      <div className="bg-[#FAF4EB] rounded-3xl p-5 sm:p-6 border border-[#E2D2BC] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2D2BC]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF4500]"></span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#2D0652] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <span>Planilha & Painel de Emendas Parlamentares</span>
                <span className="text-xs bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB] font-bold px-2.5 py-0.5 rounded-full">
                  {emendasFiltradas.length} emendas
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#2D0652]/75 mt-1 font-medium">
              Painel integrado com auditoria contábil, detalhamento das notas de empenho e prestação de contas dos recursos destinados a Viamão.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowBudgetSummary(!showBudgetSummary)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border transition-all shadow-xs cursor-pointer ${
                showBudgetSummary
                  ? 'bg-[#6A0DAD] text-white border-[#6A0DAD] hover:bg-[#580B91]'
                  : 'bg-white text-[#6A0DAD] border-2 border-[#6A0DAD] hover:bg-[#EFE6FD]'
              }`}
              title={showBudgetSummary ? 'Ocultar resumo gráfico e indicadores' : 'Exibir painel orçamentário resumido'}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>{showBudgetSummary ? 'Ocultar Gráficos' : 'Ver Gráficos & Indicadores'}</span>
            </button>

            <button
              onClick={onSimulateApiFetch}
              disabled={isFetchingApi}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#6A0DAD] bg-white hover:bg-[#EFE6FD] border-2 border-[#6A0DAD] rounded-full transition-colors disabled:opacity-50 cursor-pointer"
              title="Consultar API Federal da CGU e ALRS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingApi ? 'animate-spin' : ''}`} />
              <span>{isFetchingApi ? 'Sincronizando...' : 'Atualizar'}</span>
            </button>

            <button
              onClick={() => exportEmendasToCSV(emendasFiltradas)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF4500] hover:bg-[#E03D00] rounded-full transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Exportar (CSV)</span>
            </button>
          </div>
        </div>

        {/* Search & Dynamic Filter Controls */}
        <div className="mt-4 pt-4 border-t border-[#E2D2BC] space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#2D0652]/50" />
            <input
              type="text"
              placeholder="Filtrar por parlamentar, número da emenda, beneficiário, órgão ou subprojeto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E2D2BC] rounded-full text-xs text-[#2D0652] placeholder-[#2D0652]/40 focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD] transition-colors"
            />
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            {/* Year */}
            <div>
              <label className="text-[11px] text-[#2D0652]/70 block mb-0.5 font-bold">Exercício / Ano:</label>
              <select
                value={filtroAno}
                onChange={e => setFiltroAno(e.target.value)}
                className="w-full bg-white border border-[#E2D2BC] rounded-xl p-2 text-xs text-[#2D0652] focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
              >
                <option value="todos">Todos os Anos</option>
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>

            {/* Esfera */}
            <div>
              <label className="text-[11px] text-[#2D0652]/70 block mb-0.5 font-bold">Esfera:</label>
              <select
                value={filtroEsfera}
                onChange={e => setFiltroEsfera(e.target.value)}
                className="w-full bg-white border border-[#E2D2BC] rounded-xl p-2 text-xs text-[#2D0652] focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
              >
                <option value="todas">Todas as Esferas</option>
                {esferasDisponiveis.map(esf => (
                  <option key={esf} value={esf}>{esf}</option>
                ))}
              </select>
            </div>

            {/* Segmento Cultural */}
            <div>
              <label className="text-[11px] text-[#2D0652]/70 block mb-0.5 font-bold">Segmento Cultural:</label>
              <select
                value={filtroSegmento}
                onChange={e => setFiltroSegmento(e.target.value)}
                className="w-full bg-white border border-[#E2D2BC] rounded-xl p-2 text-xs text-[#2D0652] focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
              >
                <option value="todos">Todos os Segmentos</option>
                {segmentosDisponiveis.map(seg => (
                  <option key={seg} value={seg}>{seg}</option>
                ))}
              </select>
            </div>

            {/* Partido */}
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label htmlFor="filtro-partido-select" className="text-[11px] text-[#2D0652]/70 font-bold">
                  Partido Político:
                </label>
                <div className="group relative flex items-center">
                  <Info className="w-3.5 h-3.5 text-[#6A0DAD] cursor-help" />
                  <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block z-40 w-64 p-2.5 bg-[#2D0652] border border-purple-400/40 rounded-xl text-[11px] leading-relaxed text-white shadow-2xl">
                    <span className="font-bold text-white block mb-0.5">Base Dinâmica:</span>
                    Esta lista reflete apenas os partidos com emendas ativas e sincronizadas no acervo auditado.
                  </div>
                </div>
              </div>
              <select
                id="filtro-partido-select"
                value={filtroPartido}
                onChange={e => setFiltroPartido(e.target.value)}
                className="w-full bg-white border border-[#E2D2BC] rounded-xl p-2 text-xs text-[#2D0652] focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
              >
                <option value="todos">Todos os Partidos</option>
                {partidosDisponiveis.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Situação */}
            <div>
              <label className="text-[11px] text-[#2D0652]/70 block mb-0.5 font-bold">Situação / Execução:</label>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="w-full bg-white border border-[#E2D2BC] rounded-xl p-2 text-xs text-[#2D0652] focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
              >
                <option value="todos">Todas as Situações</option>
                <option value="Em Execução / Vigente">Em Execução / Vigente</option>
                <option value="Concluída">Concluída</option>
                <option value="Execução não iniciada">Execução não iniciada</option>
              </select>
            </div>
          </div>

          {/* Active Filter Clear Helper */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 text-xs text-[#2D0652]/80 font-medium">
              <span>Filtros aplicados ({emendasFiltradas.length} de {emendas.filter(e => e.is_cultura).length} emendas culturais)</span>
              <button
                onClick={resetFilters}
                className="text-[11px] text-[#FF4500] hover:underline font-bold cursor-pointer"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PAINEL ORÇAMENTÁRIO RESUMIDO (Charts) */}
      {showBudgetSummary && (
        <div className="bg-[#FAF4EB] rounded-3xl p-5 sm:p-6 border border-[#E2D2BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2D2BC]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#FF4500]" />
              <h3 className="text-sm font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
                Painel Orçamentário Resumido
              </h3>
              <span className="text-[10px] bg-[#EFE6FD] text-[#6A0DAD] font-bold px-2.5 py-0.5 rounded-full border border-[#DCC7FB]">
                Visão Executiva
              </span>
            </div>
            <div className="text-xs text-[#2D0652]/70 font-semibold">
              Taxa de Execução Geral: <strong className="text-[#FF4500]">{percentualGeral}%</strong>
            </div>
          </div>

          {/* 4 Compact KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Alocado */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC]">
              <span className="text-[10px] text-[#2D0652]/70 uppercase tracking-wider font-bold block">Dotação Total Alocada</span>
              <span className="text-lg sm:text-xl font-bold text-[#6A0DAD] block mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {formatBRL(totalAlocado)}
              </span>
              <span className="text-[10px] text-[#2D0652]/60 mt-1 block">{emendasFiltradas.length} emendas culturais</span>
            </div>

            {/* Total Liquidado */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC]">
              <span className="text-[10px] text-[#2D0652]/70 uppercase tracking-wider font-bold block">Total Liquidado (Pago)</span>
              <span className="text-lg sm:text-xl font-bold text-[#FF4500] block mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {formatBRL(totalGasto)}
              </span>
              <span className="text-[10px] text-[#2D0652]/60 mt-1 block">Recursos repassados</span>
            </div>

            {/* Saldo Pendente */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC]">
              <span className="text-[10px] text-[#2D0652]/70 uppercase tracking-wider font-bold block">Saldo a Executar</span>
              <span className="text-lg sm:text-xl font-bold text-[#2D0652] block mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {formatBRL(saldoPendente)}
              </span>
              <span className="text-[10px] text-[#2D0652]/60 mt-1 block">Em tramitação contábil</span>
            </div>

            {/* Taxa de Execução */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC] flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-[#2D0652]/70 uppercase tracking-wider font-bold block">Ritmo de Liquidação</span>
                <span className="text-lg sm:text-xl font-bold text-[#166534] block mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {percentualGeral}% <span className="text-[11px] font-normal text-[#2D0652]/70">executado</span>
                </span>
              </div>
              <div className="w-full bg-[#FAF4EB] h-2 rounded-full overflow-hidden border border-[#E2D2BC] mt-2">
                <div
                  className="h-full bg-gradient-to-r from-[#6A0DAD] to-[#FF4500] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, taxaExecucaoNum))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Analytical Charts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* Chart 1 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#2D0652] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#6A0DAD]" />
                  Por Órgão / Esfera
                </span>
                <span className="text-[10px] text-[#2D0652]/60 font-semibold">Alocado vs Pago</span>
              </div>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barDataResumido} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D2BC" vertical={false} />
                    <XAxis dataKey="nome" stroke="#6A0DAD" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6A0DAD" fontSize={10} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#2D0652] text-white p-2.5 rounded-xl text-xs border border-purple-400/40 shadow-xl space-y-1">
                              <p className="font-bold text-[#FF4500] border-b border-purple-400/30 pb-1">{data.nome}</p>
                              <div>Alocado: <strong>{formatBRL(data.alocado)}</strong></div>
                              <div>Liquidado: <strong>{formatBRL(data.gasto)}</strong></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="alocado" name="Alocado" fill="#6A0DAD" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="gasto" name="Liquidado" fill="#FF4500" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#2D0652] flex items-center gap-1.5">
                  <PieIcon className="w-3.5 h-3.5 text-[#FF4500]" />
                  Segmentos Culturais
                </span>
                <span className="text-[10px] text-[#2D0652]/60 font-semibold">{pieDataResumido.length} áreas</span>
              </div>
              <div className="h-[150px] w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataResumido}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={52}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieDataResumido.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0];
                          const pct = totalAlocado > 0 ? ((Number(item.value) / totalAlocado) * 100).toFixed(1) : 0;
                          return (
                            <div className="bg-[#2D0652] text-white p-2.5 rounded-xl text-xs border border-purple-400/40 shadow-xl space-y-0.5">
                              <p className="font-bold text-white">{item.name}</p>
                              <p className="text-[#FF4500] font-bold">{formatBRL(Number(item.value))}</p>
                              <p className="text-[10px] text-purple-200">{pct}% do total alocado</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3 */}
            <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC] flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#2D0652] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  Evolução Temporal
                </span>
                <span className="text-[10px] text-[#2D0652]/60 font-semibold">2024 - 2026</span>
              </div>
              <div className="h-[150px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaDataResumido} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAlocadoRes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6A0DAD" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6A0DAD" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorGastoRes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4500" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#FF4500" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2D2BC" vertical={false} />
                    <XAxis dataKey="mes" stroke="#6A0DAD" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6A0DAD" fontSize={10} tickFormatter={v => `R$${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-[#2D0652] text-white p-2.5 rounded-xl text-xs border border-purple-400/40 shadow-xl space-y-1">
                              <p className="font-bold text-[#FF4500] border-b border-purple-400/30 pb-1">{label}</p>
                              <div>Alocado: <strong>{formatBRL(payload[0]?.value as number || 0)}</strong></div>
                              <div>Pago: <strong>{formatBRL(payload[1]?.value as number || 0)}</strong></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="alocado_acumulado" stroke="#6A0DAD" strokeWidth={2} fillOpacity={1} fill="url(#colorAlocadoRes)" />
                    <Area type="monotone" dataKey="gasto_acumulado" stroke="#FF4500" strokeWidth={2} fillOpacity={1} fill="url(#colorGastoRes)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spreadsheet Table View */}
      <div className="bg-white rounded-3xl border border-[#E2D2BC] shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-[#FAF4EB] border-b border-[#E2D2BC] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-[#2D0652]">
            <TableIcon className="w-4 h-4 text-[#FF4500]" />
            <span>Grade de Registros de Emendas</span>
            <span className="text-xs font-normal text-[#2D0652]/70 hidden sm:inline">
              (Clique em qualquer linha para ver os dados de empenho e processo)
            </span>
          </div>
          <div className="text-xs text-[#2D0652]/70 font-semibold">
            Ordenação: <strong className="text-[#6A0DAD] capitalize">{sortField} ({sortOrder.toUpperCase()})</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5EAD8] text-[#2D0652] font-bold border-b border-[#E2D2BC] select-none">
                <th
                  onClick={() => handleSort('ano')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-[#EAE0CD] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Código / Ano</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6A0DAD]" />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Esfera</th>
                <th
                  onClick={() => handleSort('parlamentar')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-[#EAE0CD] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Proponente / Autor</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6A0DAD]" />
                  </div>
                </th>
                <th className="py-3 px-2.5 whitespace-nowrap text-center">Partido</th>
                <th className="py-3 px-3.5 min-w-[240px]">Objeto / Projeto Cultural</th>
                <th className="py-3 px-3 whitespace-nowrap">Órgão / Secretaria</th>
                <th
                  onClick={() => handleSort('valor')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-[#EAE0CD] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Dotação (R$)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6A0DAD]" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valor_gasto')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-[#EAE0CD] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Liquidado (R$)</span>
                    <ArrowUpDown className="w-3 h-3 text-[#6A0DAD]" />
                  </div>
                </th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Situação</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D2BC]">
              {emendasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#2D0652]/70">
                    <p className="font-bold text-[#2D0652] text-sm">Nenhum registro localizado para os filtros atuais.</p>
                    <p className="text-xs mt-1">Altere o termo de busca ou redefina os parâmetros da planilha.</p>
                  </td>
                </tr>
              ) : (
                emendasFiltradas.map((emenda, idx) => {
                  const isExpanded = expandedId === emenda.id;
                  const isCopied = copiedId === emenda.id;

                  return (
                    <React.Fragment key={emenda.id}>
                      <tr
                        onClick={() => toggleExpand(emenda.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-[#EFE6FD] border-l-4 border-l-[#FF4500]'
                            : idx % 2 === 0
                            ? 'bg-white hover:bg-[#FAF4EB]'
                            : 'bg-[#FAF4EB] hover:bg-[#F5EAD8]'
                        }`}
                      >
                        {/* Código / Ano */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">
                          <div className="font-bold text-[#2D0652]">
                            {emenda.numeroEmenda || 'Emenda Direta'}
                          </div>
                          <div className="text-[10px] text-[#2D0652]/60 font-sans font-medium">{emenda.ano}</div>
                        </td>

                        {/* Esfera */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            emenda.esfera.includes('Estadual')
                              ? 'bg-[#EFE6FD] text-[#6A0DAD] border-[#DCC7FB]'
                              : 'bg-[#E3F7E8] text-[#166534] border-[#B7ECC3]'
                          }`}>
                            {emenda.esfera.replace(/\(.*?\)/g, '').trim()}
                          </span>
                        </td>

                        {/* Proponente / Parlamentar */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <div className="font-bold text-[#2D0652] leading-tight">
                            {emenda.parlamentar}
                          </div>
                          {emenda.beneficiario && (
                            <div className="text-[10px] text-[#2D0652]/70 truncate max-w-[180px]" title={emenda.beneficiario}>
                              Dest: {emenda.beneficiario}
                            </div>
                          )}
                        </td>

                        {/* Partido (Badge) */}
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FAF4EB] text-[#2D0652] border border-[#E2D2BC]">
                            {emenda.partido_sigla || emenda.partido}
                          </span>
                        </td>

                        {/* Objeto */}
                        <td className="py-2.5 px-3.5">
                          <div className="font-medium text-[#2D0652] leading-snug line-clamp-2" title={emenda.subprojeto}>
                            <span>{emenda.subprojeto}</span>
                            {emenda.tipo_projeto_cultural && (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#FFE8E0] text-[#FF4500] border border-[#FFC2B2] whitespace-nowrap ml-1.5 align-middle">
                                {emenda.tipo_projeto_cultural}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Órgão / Secretaria */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-[#2D0652]/80 text-[11px] font-medium">
                          <span className="truncate max-w-[140px] block" title={emenda.secretaria || emenda.orgao}>
                            {emenda.secretaria || emenda.orgao}
                          </span>
                        </td>

                        {/* Dotação Alocada */}
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#2D0652] whitespace-nowrap">
                          {formatBRL(emenda.valor)}
                        </td>

                        {/* Valor Liquidado */}
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-[#FF4500] whitespace-nowrap">
                          {formatBRL(emenda.valor_gasto || 0)}
                        </td>

                        {/* Situação */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              emenda.status === 'Concluída'
                                ? 'bg-[#E3F7E8] text-[#166534] border-[#B7ECC3]'
                                : emenda.status === 'Em Execução / Vigente'
                                ? 'bg-[#FFE8E0] text-[#D33600] border-[#FFC2B2]'
                                : 'bg-[#FAF4EB] text-[#2D0652] border-[#E2D2BC]'
                            }`}
                          >
                            {emenda.status}
                          </span>
                        </td>

                        {/* Ficha Button */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(emenda.id);
                            }}
                            className="p-1.5 rounded-full hover:bg-white text-[#6A0DAD] transition-colors cursor-pointer"
                            title={isExpanded ? 'Recolher detalhes' : 'Ver detalhes técnicos'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#FF4500]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#6A0DAD]" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Technical Audit Row */}
                      {isExpanded && (
                        <tr className="bg-[#FAF4EB] border-b border-[#E2D2BC]">
                          <td colSpan={10} className="p-4 sm:p-5">
                            <div className="bg-white rounded-2xl p-4 border border-[#E2D2BC] shadow-xs space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2D2BC]">
                                <div>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#6A0DAD]">
                                    Auditoria e Detalhamento Fiscal • ID: {emenda.id}
                                  </span>
                                  <h4 className="text-sm font-bold text-[#2D0652] mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                                    {emenda.subprojeto}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={e => handleCopyFicha(emenda, e)}
                                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF4EB] hover:bg-[#F5EAD8] text-[#2D0652] rounded-full text-xs font-bold transition-colors border border-[#E2D2BC] cursor-pointer"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{isCopied ? 'Copiado!' : 'Copiar Registro'}</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-[#2D0652]/70 block text-[11px] font-bold">Proponente & Partido:</span>
                                    <span className="font-bold text-[#2D0652]">
                                      {emenda.parlamentar} ({emenda.partido_sigla || emenda.partido})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#2D0652]/70 block text-[11px] font-bold">Entidade Beneficiária:</span>
                                    <span className="font-medium text-[#2D0652]">
                                      {emenda.beneficiario || 'Município de Viamão / Secretaria Municipal'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#2D0652]/70 block text-[11px] font-bold">Programa Orçamentário:</span>
                                    <span className="text-[#2D0652]/80">{emenda.projeto}</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-[#2D0652]/70 block text-[11px] font-bold">Nota de Empenho:</span>
                                    <span className="font-mono font-bold text-[#2D0652]">
                                      {emenda.empenho_numero || 'Em tramitação contábil'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#2D0652]/70 block text-[11px] font-bold">Processo Administrativo:</span>
                                    <span className="font-mono text-[#6A0DAD] font-bold">
                                      {emenda.processo_administrativo || 'Não informado'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[#2D0652]/70 block text-[11px] font-bold">Esfera & Instrumento:</span>
                                    <span className="text-[#2D0652]/80">{emenda.esfera} • Fomento / Repasse</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-[#2D0652] font-bold block text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
                                    Fontes Oficiais Verificadas:
                                  </span>
                                  <div className="bg-[#FAF4EB] p-2.5 rounded-xl border border-[#E2D2BC] space-y-1">
                                    {emenda.fontes_cruzadas && emenda.fontes_cruzadas.length > 0 ? (
                                      emenda.fontes_cruzadas.map((f, i) => (
                                        <div key={i} className="text-[11px] text-[#2D0652] flex items-start gap-1">
                                          <span className="text-emerald-600 font-bold">✓</span>
                                          <span>{f}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-[11px] text-[#2D0652]">{emenda.fonte}</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {emenda.justificativa && (
                                <div className="pt-2 border-t border-[#E2D2BC] text-xs text-[#2D0652]">
                                  <span className="font-bold text-[#2D0652] block mb-0.5">Descrição Técnica do Objeto:</span>
                                  <p className="leading-relaxed bg-[#FAF4EB] p-2.5 rounded-xl border border-[#E2D2BC]">
                                    {emenda.justificativa}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>

            {/* Total Row */}
            {emendasFiltradas.length > 0 && (
              <tfoot>
                <tr className="bg-[#FAF4EB] font-bold text-[#2D0652] border-t-2 border-[#E2D2BC]">
                  <td colSpan={6} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs">
                    Totais da Planilha ({emendasFiltradas.length} linhas):
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs text-[#6A0DAD]">
                    {formatBRL(totalAlocado)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs text-[#FF4500]">
                    {formatBRL(totalGasto)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs text-[#2D0652]">
                    {percentualGeral}%
                  </td>
                  <td className="py-3 px-3.5 text-[#2D0652]/70 text-[11px] font-medium whitespace-nowrap">
                    Saldo: {formatBRL(saldoPendente)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
