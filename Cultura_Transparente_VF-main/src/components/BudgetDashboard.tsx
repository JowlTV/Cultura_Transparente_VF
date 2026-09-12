import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Filter,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Sparkles,
  Download,
} from 'lucide-react';
import { Emenda, PnabRecord, LeiIncentivo } from '../types/culture';
import { formatBRL } from '../utils/formatters';
import { BUDGET_CHRONOLOGY } from '../data/initialData';

interface BudgetDashboardProps {
  emendas: Emenda[];
  pnabList: PnabRecord[];
  leisIncentivo: LeiIncentivo[];
  onNavigateToPoint?: (pontoId: string) => void;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  emendas,
  pnabList,
  leisIncentivo,
  onNavigateToPoint,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('todos');
  const [selectedSecretaria, setSelectedSecretaria] = useState<string>('todas');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'geral' | 'apenas_cultura'>('apenas_cultura');

  // Available filters
  const secretariasDisponiveis = useMemo(() => {
    const list = Array.from(new Set(emendas.map(e => e.secretaria))).filter(Boolean).sort();
    return list;
  }, [emendas]);

  const tiposDisponiveis = useMemo(() => {
    const list = Array.from(
      new Set(emendas.map(e => e.tipo_projeto_cultural).filter(Boolean))
    ) as string[];
    return list.sort();
  }, [emendas]);

  // Filtered Emendas
  const emendasFiltradas = useMemo(() => {
    return emendas.filter(e => {
      if (viewMode === 'apenas_cultura' && !e.is_cultura) return false;
      if (selectedYear !== 'todos' && e.ano !== Number(selectedYear)) return false;
      if (selectedSecretaria !== 'todas' && e.secretaria !== selectedSecretaria) return false;
      if (selectedTipo !== 'todos' && e.tipo_projeto_cultural !== selectedTipo) return false;
      return true;
    });
  }, [emendas, viewMode, selectedYear, selectedSecretaria, selectedTipo]);

  // Aggregated KPIs
  const totalAlocadoEmendas = useMemo(() => {
    return emendasFiltradas.reduce((acc, curr) => acc + curr.valor, 0);
  }, [emendasFiltradas]);

  const totalGastoEmendas = useMemo(() => {
    return emendasFiltradas.reduce((acc, curr) => acc + (curr.valor_gasto || 0), 0);
  }, [emendasFiltradas]);

  const saldoEmendas = totalAlocadoEmendas - totalGastoEmendas;
  const taxaExecucao = totalAlocadoEmendas > 0 ? (totalGastoEmendas / totalAlocadoEmendas) * 100 : 0;

  // 1. Data for Bar Chart: Alocado vs Gasto por Secretaria
  const barDataPorSecretaria = useMemo(() => {
    const map: Record<string, { secretaria: string; alocado: number; gasto: number }> = {};

    emendasFiltradas.forEach(e => {
      const secNome = e.secretaria
        .replace('Secretaria de Estado da Cultura', 'SEDAC-RS')
        .replace('Ministério da Cultura', 'MinC (Federal)')
        .replace('Secretaria de Justiça, Cidadania e Direitos Humanos', 'Justiça/Direitos')
        .replace('Secretaria de Esporte e Lazer', 'Esporte/Lazer')
        .replace('Secretaria de Obras e Habitação', 'Obras/Habitação');

      if (!map[secNome]) {
        map[secNome] = { secretaria: secNome, alocado: 0, gasto: 0 };
      }
      map[secNome].alocado += e.valor;
      map[secNome].gasto += e.valor_gasto || 0;
    });

    return Object.values(map).sort((a, b) => b.alocado - a.alocado);
  }, [emendasFiltradas]);

  // 2. Data for Pie Chart: Distribuição por Tipo de Projeto Cultural
  const pieDataPorTipo = useMemo(() => {
    const map: Record<string, number> = {};

    // From cultural emendas
    emendas
      .filter(e => e.is_cultura)
      .forEach(e => {
        const tipo = e.tipo_projeto_cultural || 'Outras Ações Culturais';
        map[tipo] = (map[tipo] || 0) + e.valor;
      });

    // Also include LPG and Rouanet
    leisIncentivo.forEach(l => {
      if (l.mecanismo.includes('Paulo Gustavo')) {
        map['Audiovisual & Cinema'] = (map['Audiovisual & Cinema'] || 0) + l.valor_aprovado;
      } else if (l.mecanismo.includes('Rouanet')) {
        map['Patrimônio & Restauro'] = (map['Patrimônio & Restauro'] || 0) + (l.valor_captado || l.valor_aprovado);
      }
    });

    const colors: Record<string, string> = {
      'Hip-Hop & Cultura Urbana': '#1e40af', // Azul Viamão
      'Patrimônio & Restauro': '#dc2626', // Vermelho Cruz de Cristo
      'Audiovisual & Cinema': '#d97706', // Dourado
      'Tradição & Folclore': '#15803d', // Verde Campos
      'Literatura & Leitura': '#0284c7', // Azul Claro
      'Música & Artes Cênicas': '#6b21a8', // Púrpura
      'Outras Ações Culturais': '#64748b', // Slate
    };

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#1e40af',
    })).sort((a, b) => b.value - a.value);
  }, [emendas, leisIncentivo]);

  // 3. Data for Line Chart: Evolução Temporal
  const lineData = useMemo(() => {
    if (selectedYear === 'todos') {
      return BUDGET_CHRONOLOGY;
    }
    return BUDGET_CHRONOLOGY.filter(p => p.ano === Number(selectedYear));
  }, [selectedYear]);

  // Custom tooltips
  const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const alocado = payload[0]?.value || 0;
      const gasto = payload[1]?.value || 0;
      const pct = alocado > 0 ? ((gasto / alocado) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1.5 font-['Plus_Jakarta_Sans']">
          <p className="font-bold text-amber-300 border-b border-slate-700 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Orçamento Alocado:</span>
            <span className="font-bold text-blue-300">{formatBRL(alocado)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Gastos Realizados:</span>
            <span className="font-bold text-emerald-400">{formatBRL(gasto)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800">
            <span className="text-slate-400">Taxa de Execução:</span>
            <span className="font-bold text-amber-400 font-mono">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipLine = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl text-xs shadow-xl border border-slate-800 space-y-1">
          <p className="font-bold text-amber-300 border-b border-slate-700 pb-1">{label}</p>
          <div className="text-blue-300">
            Alocado Acumulado: <strong>{formatBRL(payload[0]?.value || 0)}</strong>
          </div>
          <div className="text-emerald-400">
            Liquidado Acumulado: <strong>{formatBRL(payload[1]?.value || 0)}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const exportBudgetCSV = () => {
    const headers = [
      'Ano',
      'Numero_Emenda',
      'Autor_Parlamentar',
      'Secretaria_Orgao',
      'Subprojeto_Descricao',
      'Beneficiario',
      'Valor_Alocado',
      'Valor_Liquidado',
      'Status',
    ];

    const rows = emendasFiltradas.map(e => [
      e.ano,
      `"${e.numeroEmenda || e.id}"`,
      `"${e.parlamentar}"`,
      `"${e.secretaria}"`,
      `"${e.subprojeto.replace(/"/g, '""')}"`,
      `"${e.beneficiario}"`,
      e.valor,
      e.valor_gasto || 0,
      `"${e.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `painel_orcamento_viamao_${selectedYear}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Civic Header - Cores da Bandeira de Viamão */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-xs border border-blue-900/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
              Observatório Orçamentário da Cultura de Viamão / RS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
              Painel Interativo de Orçamentos e Execução Financeira
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Acompanhamento detalhado da alocação de dotações, empenhos, liquidações e saldos do setor cultural e áreas afins de Viamão. Dados auditáveis extraídos do Fundo Municipal de Cultura, SEDAC-RS, MinC e ALRS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportBudgetCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all shadow-xs border border-white/20"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Dados (CSV)</span>
            </button>
          </div>
        </div>

        {/* Interactive Filters Bar */}
        <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Filter Year */}
          <div>
            <label className="block text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              Exercício / Ano:
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/20 text-white rounded-xl px-3 py-2 focus:outline-hidden focus:border-blue-400"
            >
              <option value="todos">Todos os Anos (2024 - 2026)</option>
              <option value="2026">2026 (Exercício Atual)</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Filter Secretaria */}
          <div>
            <label className="block text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              Secretaria / Órgão:
            </label>
            <select
              value={selectedSecretaria}
              onChange={e => setSelectedSecretaria(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/20 text-white rounded-xl px-3 py-2 focus:outline-hidden focus:border-blue-400"
            >
              <option value="todas">Todas as Secretarias</option>
              {secretariasDisponiveis.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tipo de Projeto */}
          <div>
            <label className="block text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              Tipo de Projeto Cultural:
            </label>
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/20 text-white rounded-xl px-3 py-2 focus:outline-hidden focus:border-blue-400"
            >
              <option value="todos">Todos os Segmentos Culturais</option>
              {tiposDisponiveis.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Scope Toggle */}
          <div>
            <label className="block text-slate-200 font-semibold mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-300" />
              Escopo Orçamentário:
            </label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/20 text-[11px]">
              <button
                onClick={() => setViewMode('apenas_cultura')}
                className={`py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'apenas_cultura'
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Cultura
              </button>
              <button
                onClick={() => setViewMode('geral')}
                className={`py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'geral'
                    ? 'bg-[#1e40af] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Todas Áreas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Cores da Bandeira de Viamão) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Alocado */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Orçamento Alocado (Dotação)</span>
            <span className="p-1 rounded-md bg-blue-50 text-[#1e40af]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-slate-900 tracking-tight">
            {formatBRL(totalAlocadoEmendas)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {emendasFiltradas.length} emendas no filtro selecionado.
          </p>
        </div>

        {/* Card 2: Gastos Realizados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-[#15803d] mb-1">
            <span>Gastos Realizados (Liquidados)</span>
            <span className="p-1 rounded-md bg-emerald-50 text-[#15803d]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-[#15803d] tracking-tight">
            {formatBRL(totalGastoEmendas)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Valores devidamente empenhados e pagos aos proponentes.
          </p>
        </div>

        {/* Card 3: Saldo a Executar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Saldo a Executar</span>
            <span className="p-1 rounded-md bg-blue-50 text-[#1e40af]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-slate-800 tracking-tight">
            {formatBRL(saldoEmendas)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Recursos em fase de convênio ou chamamento público.
          </p>
        </div>

        {/* Card 4: Taxa de Execução */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
            <span>Taxa Geral de Execução</span>
            <span className="text-xs font-bold text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              {taxaExecucao.toFixed(1)}%
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-[#1e40af] tracking-tight">
            {taxaExecucao.toFixed(1)}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-[#1e40af] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, taxaExecucao)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: BARRAS DUPLAS - Alocado vs Gasto por Secretaria */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1e40af]" />
                Orçamento Alocado vs. Gastos Realizados por Secretaria
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparativo de dotação aprovada versus valor liquidado/pago (R$)
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barDataPorSecretaria}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="secretaria"
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltipBar />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value: string) => (
                    <span className="text-slate-700 font-medium">
                      {value === 'alocado' ? 'Orçamento Alocado' : 'Gasto Realizado (Liquidado)'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="alocado"
                  name="alocado"
                  fill="#1e40af"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="gasto"
                  name="gasto"
                  fill="#15803d"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: PIZZA / ROSCA - Distribuição por Tipo de Projeto Cultural */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#1e40af]" />
                Distribuição por Segmento Cultural
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proporção das verbas por linguagem e modalidade
              </p>
            </div>
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataPorTipo}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieDataPorTipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatBRL(Number(val) || 0), 'Valor']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    borderColor: '#1e293b',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom scannable legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            {pieDataPorTipo.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <div className="truncate">
                  <span className="text-slate-700 font-medium truncate block">{item.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono font-semibold">
                    {formatBRL(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico 3: Evolução Temporal de Alocação vs Liquidação */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#15803d]" />
              Evolução Cronológica: Orçamentos Alocados vs. Gastos Realizados
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rastreamento temporal mês a mês demonstrando o ritmo de liquidação.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-[#1e40af] border border-blue-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#1e40af]"></span>
              Alocação Acumulada
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-[#15803d] border border-emerald-200 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#15803d]"></span>
              Gastos Liquidados
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={lineData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAlocado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1e40af" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1e40af" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltipLine />} />
              <Area
                type="monotone"
                dataKey="alocado_acumulado"
                name="Alocado Acumulado"
                stroke="#1e40af"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAlocado)"
              />
              <Area
                type="monotone"
                dataKey="gasto_acumulado"
                name="Gasto Liquidado"
                stroke="#15803d"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorGasto)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
