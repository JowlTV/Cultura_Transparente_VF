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
import { Emenda, PnabRecord } from '../types/culture';
import { formatBRL } from '../utils/formatters';
import { BUDGET_CHRONOLOGY } from '../data/initialData';

interface BudgetDashboardProps {
  emendas: Emenda[];
  pnabList: PnabRecord[];
  onNavigateToPoint?: (pontoId: string) => void;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  emendas,
  pnabList,
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

    const colors: Record<string, string> = {
      'Hip-Hop & Cultura Urbana': '#6A0DAD', // Roxo Identidade Visual
      'Audiovisual & Cinema': '#FF4500', // Laranja Acento
      'Patrimônio & Restauro': '#8b24d6', // Púrpura Médio
      'Tradição & Folclore': '#ea580c', // Laranja Queimado
      'Música & Artes Cênicas': '#a855f7', // Roxo Claro
      'Literatura & Leitura': '#fb923c', // Laranja Claro
      'Outras Ações Culturais': '#c084fc', // Lilás
    };

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#6A0DAD',
    })).sort((a, b) => b.value - a.value);
  }, [emendas]);

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
      return (
        <div className="bg-[#0e061b] text-slate-100 p-3.5 rounded-xl text-xs shadow-2xl border border-purple-900/60 space-y-1.5 font-['Plus_Jakarta_Sans']">
          <p className="font-bold text-[#FF4500] border-b border-purple-900/40 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Orçamento Alocado:</span>
            <span className="font-bold text-[#c084fc]">{formatBRL(alocado)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">Gastos Realizados:</span>
            <span className="font-bold text-[#FF4500]">{formatBRL(gasto)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomTooltipLine = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0e061b] text-slate-100 p-3 rounded-xl text-xs shadow-2xl border border-purple-900/60 space-y-1">
          <p className="font-bold text-[#FF4500] border-b border-purple-900/40 pb-1">{label}</p>
          <div className="text-[#c084fc]">
            Alocado Acumulado: <strong>{formatBRL(payload[0]?.value || 0)}</strong>
          </div>
          <div className="text-[#FF4500]">
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
      {/* Civic Header - Identidade Visual #6A0DAD e #FF4500 */}
      <div className="bg-gradient-to-br from-[#1a0830] via-[#2d0f50] to-[#FF4500]/70 rounded-2xl p-6 sm:p-8 text-white shadow-xs border border-purple-900/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-purple-200">
              <BarChart3 className="w-3.5 h-3.5 text-[#FF4500]" />
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
              className="flex items-center gap-2 px-4 py-2.5 bg-[#6A0DAD] hover:bg-[#590a94] text-white rounded-xl text-xs font-bold transition-all shadow-xs border border-purple-400/30"
            >
              <Download className="w-4 h-4 text-[#FF4500]" />
              <span>Exportar Dados (CSV)</span>
            </button>
          </div>
        </div>

        {/* Interactive Filters Bar */}
        <div className="mt-6 pt-5 border-t border-purple-900/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs relative z-10">
          {/* Filter Year */}
          <div>
            <label className="block text-purple-200 font-semibold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF4500]" />
              Exercício / Ano:
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-[#130722] border border-purple-900/40 text-slate-100 rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#6A0DAD]"
            >
              <option value="todos">Todos os Anos (2024 - 2026)</option>
              <option value="2026">2026 (Exercício Atual)</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Filter Secretaria */}
          <div>
            <label className="block text-purple-200 font-semibold mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#FF4500]" />
              Secretaria / Órgão:
            </label>
            <select
              value={selectedSecretaria}
              onChange={e => setSelectedSecretaria(e.target.value)}
              className="w-full bg-[#130722] border border-purple-900/40 text-slate-100 rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#6A0DAD]"
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
            <label className="block text-purple-200 font-semibold mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#FF4500]" />
              Tipo de Projeto Cultural:
            </label>
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="w-full bg-[#130722] border border-purple-900/40 text-slate-100 rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#6A0DAD]"
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
            <label className="block text-purple-200 font-semibold mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#FF4500]" />
              Escopo Orçamentário:
            </label>
            <div className="grid grid-cols-2 gap-1 bg-[#130722] p-1 rounded-xl border border-purple-900/40 text-[11px]">
              <button
                onClick={() => setViewMode('apenas_cultura')}
                className={`py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'apenas_cultura'
                    ? 'bg-[#6A0DAD] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Cultura
              </button>
              <button
                onClick={() => setViewMode('geral')}
                className={`py-1 rounded-lg font-bold transition-all ${
                  viewMode === 'geral'
                    ? 'bg-[#6A0DAD] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Todas Áreas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards (Identidade Visual #6A0DAD e #FF4500) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alocado */}
        <div className="bg-[#150b24] p-5 rounded-2xl border border-purple-900/40 shadow-xs hover:border-[#6A0DAD] transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/70 mb-1">
            <span>Orçamento Alocado (Dotação)</span>
            <span className="p-1 rounded-md bg-purple-900/40 text-[#c084fc] border border-purple-800/40">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-white tracking-tight">
            {formatBRL(totalAlocadoEmendas)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {emendasFiltradas.length} emendas no filtro selecionado.
          </p>
        </div>

        {/* Card 2: Gastos Realizados */}
        <div className="bg-[#150b24] p-5 rounded-2xl border border-purple-900/40 shadow-xs hover:border-[#FF4500] transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-orange-300/80 mb-1">
            <span>Gastos Realizados (Liquidados)</span>
            <span className="p-1 rounded-md bg-orange-950/50 text-[#FF4500] border border-orange-800/40">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-[#FF4500] tracking-tight">
            {formatBRL(totalGastoEmendas)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Valores devidamente empenhados e pagos aos proponentes.
          </p>
        </div>

        {/* Card 3: Saldo a Executar */}
        <div className="bg-[#150b24] p-5 rounded-2xl border border-purple-900/40 shadow-xs hover:border-[#6A0DAD] transition-colors">
          <div className="flex items-center justify-between text-xs font-semibold text-purple-300/70 mb-1">
            <span>Saldo a Executar</span>
            <span className="p-1 rounded-md bg-purple-900/40 text-[#c084fc] border border-purple-800/40">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-['Outfit'] text-slate-200 tracking-tight">
            {formatBRL(saldoEmendas)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Recursos em fase de convênio ou chamamento público.
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: BARRAS DUPLAS - Alocado vs Gasto por Secretaria */}
        <div className="lg:col-span-7 bg-[#150b24] p-5 sm:p-6 rounded-2xl border border-purple-900/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FF4500]" />
                Orçamento Alocado vs. Gastos Realizados por Secretaria
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#281145" />
                <XAxis
                  dataKey="secretaria"
                  tick={{ fill: '#c084fc', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: '#c084fc', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltipBar />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value: string) => (
                    <span className="text-slate-200 font-medium">
                      {value === 'alocado' ? 'Orçamento Alocado' : 'Gasto Realizado (Liquidado)'}
                    </span>
                  )}
                />
                <Bar
                  dataKey="alocado"
                  name="alocado"
                  fill="#6A0DAD"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="gasto"
                  name="gasto"
                  fill="#FF4500"
                  radius={[4, 4, 0, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: PIZZA / ROSCA - Distribuição por Tipo de Projeto Cultural */}
        <div className="lg:col-span-5 bg-[#150b24] p-5 sm:p-6 rounded-2xl border border-purple-900/40 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-900/30">
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#FF4500]" />
                Distribuição por Segmento Cultural
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
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
                    backgroundColor: '#0e061b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    borderColor: '#4c1d95',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom scannable legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-purple-900/30">
            {pieDataPorTipo.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <div className="truncate">
                  <span className="text-slate-200 font-medium truncate block">{item.name}</span>
                  <span className="text-[11px] text-purple-300 font-mono font-semibold">
                    {formatBRL(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico 3: Evolução Temporal de Alocação vs Liquidação */}
      <div className="bg-[#150b24] p-5 sm:p-6 rounded-2xl border border-purple-900/40 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/30">
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF4500]" />
              Evolução Cronológica: Orçamentos Alocados vs. Gastos Realizados
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rastreamento temporal mês a mês demonstrando o ritmo de liquidação.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/60 text-purple-200 border border-purple-800/40 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#6A0DAD]"></span>
              Alocação Acumulada
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-950/60 text-orange-200 border border-orange-800/40 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
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
                  <stop offset="5%" stopColor="#6A0DAD" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6A0DAD" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4500" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FF4500" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#281145" />
              <XAxis dataKey="mes" tick={{ fill: '#c084fc', fontSize: 11 }} />
              <YAxis
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#c084fc', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltipLine />} />
              <Area
                type="monotone"
                dataKey="alocado_acumulado"
                name="Alocado Acumulado"
                stroke="#6A0DAD"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAlocado)"
              />
              <Area
                type="monotone"
                dataKey="gasto_acumulado"
                name="Gasto Liquidado"
                stroke="#FF4500"
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
