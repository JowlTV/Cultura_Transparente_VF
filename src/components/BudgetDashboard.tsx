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
  CheckCircle2,
  Calendar,
  Building2,
  Download,
} from 'lucide-react';
import { Emenda } from '../types/culture';
import { formatBRL } from '../utils/formatters';
import { BUDGET_CHRONOLOGY } from '../data/initialData';

interface BudgetDashboardProps {
  emendas: Emenda[];
  onNavigateToPoint?: (pontoId: string) => void;
}

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  emendas,
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

    emendas
      .filter(e => e.is_cultura)
      .forEach(e => {
        const tipo = e.tipo_projeto_cultural || 'Outras Ações Culturais';
        map[tipo] = (map[tipo] || 0) + e.valor;
      });

    const colors: Record<string, string> = {
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
        <div className="bg-[#2D0652] text-white p-3.5 rounded-xl text-xs shadow-2xl border border-purple-400/40 space-y-1.5">
          <p className="font-bold text-[#FF4500] border-b border-purple-400/30 pb-1">{label}</p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-purple-200">Orçamento Alocado:</span>
            <span className="font-bold text-white">{formatBRL(alocado)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-purple-200">Gastos Realizados:</span>
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
        <div className="bg-[#2D0652] text-white p-3 rounded-xl text-xs shadow-2xl border border-purple-400/40 space-y-1">
          <p className="font-bold text-[#FF4500] border-b border-purple-400/30 pb-1">{label}</p>
          <div>
            Alocado Acumulado: <strong>{formatBRL(payload[0]?.value || 0)}</strong>
          </div>
          <div>
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
      {/* Header Container */}
      <div className="bg-[#FAF4EB] rounded-3xl p-6 sm:p-8 border border-[#E2D2BC] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#EFE6FD] border border-[#DCC7FB] px-3.5 py-1 rounded-full text-xs font-bold text-[#6A0DAD]">
              <BarChart3 className="w-3.5 h-3.5 text-[#FF4500]" />
              Observatório Orçamentário da Cultura de Viamão / RS
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
              Painel Interativo de Orçamentos e Execução Financeira
            </h2>
            <p className="text-xs sm:text-sm text-[#2D0652]/80 leading-relaxed font-medium">
              Acompanhamento detalhado da alocação de dotações, empenhos, liquidações e saldos do setor cultural e áreas afins de Viamão. Dados auditáveis extraídos do Fundo Municipal de Cultura, SEDAC-RS, MinC e ALRS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportBudgetCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF4500] hover:bg-[#E03D00] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Exportar Dados (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="mt-6 pt-5 border-t border-[#E2D2BC] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Year */}
          <div>
            <label className="block text-[#2D0652] font-bold mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FF4500]" />
              Exercício / Ano:
            </label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full bg-white border border-[#E2D2BC] text-[#2D0652] rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
            >
              <option value="todos">Todos os Anos (2024 - 2026)</option>
              <option value="2026">2026 (Exercício Atual)</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          {/* Secretaria */}
          <div>
            <label className="block text-[#2D0652] font-bold mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#FF4500]" />
              Secretaria / Órgão:
            </label>
            <select
              value={selectedSecretaria}
              onChange={e => setSelectedSecretaria(e.target.value)}
              className="w-full bg-white border border-[#E2D2BC] text-[#2D0652] rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
            >
              <option value="todas">Todas as Secretarias</option>
              {secretariasDisponiveis.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Projeto */}
          <div>
            <label className="block text-[#2D0652] font-bold mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#FF4500]" />
              Tipo de Projeto Cultural:
            </label>
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="w-full bg-white border border-[#E2D2BC] text-[#2D0652] rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
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
            <label className="block text-[#2D0652] font-bold mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#FF4500]" />
              Escopo Orçamentário:
            </label>
            <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-[#E2D2BC] text-xs">
              <button
                onClick={() => setViewMode('apenas_cultura')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'apenas_cultura'
                    ? 'bg-[#6A0DAD] text-white shadow-xs'
                    : 'text-[#2D0652]/70 hover:text-[#2D0652]'
                }`}
              >
                Cultura
              </button>
              <button
                onClick={() => setViewMode('geral')}
                className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'geral'
                    ? 'bg-[#6A0DAD] text-white shadow-xs'
                    : 'text-[#2D0652]/70 hover:text-[#2D0652]'
                }`}
              >
                Todas Áreas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alocado */}
        <div className="bg-[#FAF4EB] p-6 rounded-3xl border border-[#E2D2BC] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#2D0652]/70 mb-1">
            <span>Orçamento Alocado (Dotação)</span>
            <span className="p-1.5 rounded-full bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB]">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#6A0DAD] tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {formatBRL(totalAlocadoEmendas)}
          </div>
          <p className="text-xs text-[#2D0652]/60 mt-1 font-medium">
            {emendasFiltradas.length} emendas no filtro selecionado.
          </p>
        </div>

        {/* Card 2: Gastos Realizados */}
        <div className="bg-[#FAF4EB] p-6 rounded-3xl border border-[#E2D2BC] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#2D0652]/70 mb-1">
            <span>Gastos Realizados (Liquidados)</span>
            <span className="p-1.5 rounded-full bg-[#FFE8E0] text-[#FF4500] border border-[#FFC2B2]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#FF4500] tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {formatBRL(totalGastoEmendas)}
          </div>
          <p className="text-xs text-[#2D0652]/60 mt-1 font-medium">
            Valores devidamente empenhados e pagos aos proponentes.
          </p>
        </div>

        {/* Card 3: Saldo a Executar */}
        <div className="bg-[#FAF4EB] p-6 rounded-3xl border border-[#E2D2BC] shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-[#2D0652]/70 mb-1">
            <span>Saldo a Executar</span>
            <span className="p-1.5 rounded-full bg-white text-[#2D0652] border border-[#E2D2BC]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#2D0652] tracking-tight mt-1" style={{ fontFamily: 'var(--font-display)' }}>
            {formatBRL(saldoEmendas)}
          </div>
          <p className="text-xs text-[#2D0652]/60 mt-1 font-medium">
            Recursos em fase de convênio ou chamamento público.
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: BARRAS DUPLAS */}
        <div className="lg:col-span-7 bg-[#FAF4EB] p-6 sm:p-7 rounded-3xl border border-[#E2D2BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2D2BC]">
            <div>
              <h3 className="font-bold text-[#2D0652] text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <BarChart3 className="w-4 h-4 text-[#FF4500]" />
                Orçamento Alocado vs. Gastos por Secretaria
              </h3>
              <p className="text-xs text-[#2D0652]/70 mt-0.5 font-medium">
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2D2BC" />
                <XAxis
                  dataKey="secretaria"
                  tick={{ fill: '#6A0DAD', fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                  tick={{ fill: '#6A0DAD', fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltipBar />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
                  formatter={(value: string) => (
                    <span className="text-[#2D0652] font-semibold">
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

        {/* Gráfico 2: PIZZA / ROSCA */}
        <div className="lg:col-span-5 bg-[#FAF4EB] p-6 sm:p-7 rounded-3xl border border-[#E2D2BC] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2D2BC]">
            <div>
              <h3 className="font-bold text-[#2D0652] text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <PieIcon className="w-4 h-4 text-[#FF4500]" />
                Distribuição por Segmento Cultural
              </h3>
              <p className="text-xs text-[#2D0652]/70 mt-0.5 font-medium">
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
                    backgroundColor: '#2D0652',
                    borderRadius: '1rem',
                    color: '#fff',
                    fontSize: '12px',
                    borderColor: '#6A0DAD',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#E2D2BC]">
            {pieDataPorTipo.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                ></span>
                <div className="truncate">
                  <span className="text-[#2D0652] font-semibold truncate block">{item.name}</span>
                  <span className="text-[11px] text-[#6A0DAD] font-mono font-bold">
                    {formatBRL(item.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico 3: Evolução Temporal */}
      <div className="bg-[#FAF4EB] p-6 sm:p-7 rounded-3xl border border-[#E2D2BC] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2D2BC]">
          <div>
            <h3 className="font-bold text-[#2D0652] text-sm sm:text-base flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <TrendingUp className="w-4 h-4 text-[#FF4500]" />
              Evolução Cronológica: Orçamentos Alocados vs. Gastos Realizados
            </h3>
            <p className="text-xs text-[#2D0652]/70 mt-0.5 font-medium">
              Rastreamento temporal mês a mês demonstrando o ritmo de liquidação.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#6A0DAD]"></span>
              Alocação Acumulada
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFE8E0] text-[#FF4500] border border-[#FFC2B2] font-bold">
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
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2D2BC" />
              <XAxis dataKey="mes" tick={{ fill: '#6A0DAD', fontSize: 11 }} />
              <YAxis
                tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`}
                tick={{ fill: '#6A0DAD', fontSize: 11 }}
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
