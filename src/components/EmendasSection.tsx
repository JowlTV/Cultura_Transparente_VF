import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Landmark,
  FileText,
  RefreshCw,
  Database,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  Table as TableIcon
} from 'lucide-react';
import { Emenda } from '../types/culture';
import { formatBRL, exportEmendasToCSV } from '../utils/formatters';

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
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  const [filtroEsfera, setFiltroEsfera] = useState<string>('todas');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPartido, setFiltroPartido] = useState<string>('todos');
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

  // Filtering (strictly Cultural & Patrimônio)
  const emendasFiltradas = useMemo(() => {
    const list = emendas.filter(item => {
      // Escopo focado em cultura
      if (!item.is_cultura) return false;

      // Filtro Ano
      if (filtroAno !== 'todos' && item.ano !== Number(filtroAno)) return false;

      // Filtro Esfera
      if (filtroEsfera !== 'todas' && item.esfera !== filtroEsfera) return false;

      // Filtro Status
      if (filtroStatus !== 'todos' && item.status !== filtroStatus) return false;

      // Filtro Partido
      if (filtroPartido !== 'todos') {
        const p = (item.partido_sigla || item.partido || '').toLowerCase();
        if (!p.includes(filtroPartido.toLowerCase())) return false;
      }

      // Busca textual
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

  const percentualGeral = totalAlocado > 0 ? ((totalGasto / totalAlocado) * 100).toFixed(1) : '0';

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
    const texto = `[AUDITORIA ORÇAMENTÁRIA - VIAMÃO/RS]
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
    <div className="space-y-5">
      {/* Spreadsheet Control Header - Identidade Visual #6A0DAD e #FF4500 */}
      <div className="bg-[#150b24] rounded-2xl p-5 border border-purple-900/40 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-purple-900/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF4500]"></span>
              <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
                <span>Planilha de Emendas Orçamentárias</span>
                <span className="text-xs bg-[#6A0DAD]/30 text-purple-200 border border-purple-700/50 font-bold px-2.5 py-0.5 rounded-full">
                  {emendasFiltradas.length} registros
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Registro isento e factual das dotações parlamentares destinadas a Viamão. Dados auditados via SAE/ALRS, FPE-RS e Portal da Transparência Federal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateApiFetch}
              disabled={isFetchingApi}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-200 bg-[#1e1037] hover:bg-purple-900/40 border border-purple-800/40 rounded-xl transition-colors disabled:opacity-50"
              title="Consultar API Federal da CGU e ALRS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingApi ? 'animate-spin' : ''}`} />
              <span>{isFetchingApi ? 'Sincronizando...' : 'Atualizar Dados'}</span>
            </button>
            <button
              onClick={() => exportEmendasToCSV(emendasFiltradas)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#FF4500] hover:bg-[#e03d00] rounded-xl transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-white" />
              <span>Exportar Planilha (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="mt-4 pt-4 border-t border-purple-900/30 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              placeholder="Filtrar por parlamentar, número da emenda (ex: Ep 1692), beneficiário, órgão ou subprojeto..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#130722] border border-purple-900/40 rounded-xl text-xs text-slate-100 placeholder-purple-300/40 focus:outline-hidden focus:border-[#6A0DAD] transition-colors"
            />
          </div>

          {/* Dropdown Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* Year */}
            <div>
              <label className="text-[11px] text-purple-300/70 block mb-0.5 font-medium">Exercício / Ano:</label>
              <select
                value={filtroAno}
                onChange={e => setFiltroAno(e.target.value)}
                className="w-full bg-[#130722] border border-purple-900/40 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-[#6A0DAD]"
              >
                <option value="todos">Todos os Anos</option>
                {anosDisponiveis.map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>

            {/* Esfera */}
            <div>
              <label className="text-[11px] text-purple-300/70 block mb-0.5 font-medium">Esfera Orçamentária:</label>
              <select
                value={filtroEsfera}
                onChange={e => setFiltroEsfera(e.target.value)}
                className="w-full bg-[#130722] border border-purple-900/40 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-[#6A0DAD]"
              >
                <option value="todas">Todas as Esferas</option>
                {esferasDisponiveis.map(esf => (
                  <option key={esf} value={esf}>{esf}</option>
                ))}
              </select>
            </div>

            {/* Partido */}
            <div>
              <label className="text-[11px] text-purple-300/70 block mb-0.5 font-medium">Partido Político:</label>
              <select
                value={filtroPartido}
                onChange={e => setFiltroPartido(e.target.value)}
                className="w-full bg-[#130722] border border-purple-900/40 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-[#6A0DAD]"
              >
                <option value="todos">Todos os Partidos</option>
                {partidosDisponiveis.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Situação */}
            <div>
              <label className="text-[11px] text-purple-300/70 block mb-0.5 font-medium">Situação / Execução:</label>
              <select
                value={filtroStatus}
                onChange={e => setFiltroStatus(e.target.value)}
                className="w-full bg-[#130722] border border-purple-900/40 rounded-lg p-2 text-xs text-slate-200 focus:outline-hidden focus:border-[#6A0DAD]"
              >
                <option value="todos">Todas as Situações</option>
                <option value="Em Execução / Vigente">Em Execução / Vigente</option>
                <option value="Concluída">Concluída</option>
                <option value="Execução não iniciada">Execução não iniciada</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Fiscal Metrics Summary Bar (Identidade Visual #6A0DAD e #FF4500) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#150b24] p-4 rounded-xl border border-purple-900/40 shadow-xs">
          <span className="text-[11px] text-purple-300/70 uppercase tracking-wider font-semibold block">Dotação Total Alocada</span>
          <span className="text-xl font-bold font-['Outfit'] text-[#c084fc] block mt-1">
            {formatBRL(totalAlocado)}
          </span>
          <span className="text-[11px] text-slate-400">{emendasFiltradas.length} emendas culturais</span>
        </div>

        <div className="bg-[#150b24] p-4 rounded-xl border border-purple-900/40 shadow-xs">
          <span className="text-[11px] text-purple-300/70 uppercase tracking-wider font-semibold block">Total Liquidado (Pago)</span>
          <span className="text-xl font-bold font-['Outfit'] text-[#FF4500] block mt-1">
            {formatBRL(totalGasto)}
          </span>
          <span className="text-[11px] text-slate-400">Valores repassados aos proponentes</span>
        </div>

        <div className="bg-[#150b24] p-4 rounded-xl border border-purple-900/40 shadow-xs">
          <span className="text-[11px] text-purple-300/70 uppercase tracking-wider font-semibold block">Saldo a Executar</span>
          <span className="text-xl font-bold font-['Outfit'] text-amber-300 block mt-1">
            {formatBRL(totalAlocado - totalGasto)}
          </span>
          <span className="text-[11px] text-slate-400">Recursos em tramitação</span>
        </div>
      </div>

      {/* Spreadsheet Table View ("Cara de Planilha") */}
      <div className="bg-[#150b24] rounded-2xl border border-purple-900/40 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-[#1b0d2f] border-b border-purple-900/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <TableIcon className="w-4 h-4 text-[#FF4500]" />
            <span>Grade de Dados Orçamentários</span>
            <span className="text-[11px] font-normal text-purple-300/70">
              (Clique em qualquer linha para abrir a auditoria técnica do empenho e processo)
            </span>
          </div>
          <div className="text-[11px] text-purple-300/70 hidden sm:block">
            Ordenado por: <strong className="text-white capitalize">{sortField} ({sortOrder.toUpperCase()})</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1e0e37] text-purple-200 font-semibold border-b border-purple-900/40 select-none">
                <th
                  onClick={() => handleSort('ano')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-purple-900/30 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Código / Ano</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="py-3 px-3 whitespace-nowrap">Esfera</th>
                <th
                  onClick={() => handleSort('parlamentar')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-purple-900/30 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>Proponente / Autor</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="py-3 px-2.5 whitespace-nowrap text-center">Partido</th>
                <th className="py-3 px-3.5 min-w-[240px]">Objeto / Projeto Cultural</th>
                <th className="py-3 px-3 whitespace-nowrap">Órgão / Secretaria</th>
                <th
                  onClick={() => handleSort('valor')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-purple-900/30 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Dotação (R$)</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valor_gasto')}
                  className="py-3 px-3.5 text-right cursor-pointer hover:bg-purple-900/30 transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Liquidado (R$)</span>
                    <ArrowUpDown className="w-3 h-3 text-purple-400" />
                  </div>
                </th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Situação</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/30">
              {emendasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-white">Nenhum registro localizado para os filtros atuais.</p>
                    <p className="text-xs mt-1 text-slate-400">Altere o termo de busca ou redefina os parâmetros da planilha.</p>
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
                            ? 'bg-[#251040] border-l-4 border-l-[#FF4500]'
                            : idx % 2 === 0
                            ? 'bg-[#150b24] hover:bg-[#1f0d38]'
                            : 'bg-[#180d2a] hover:bg-[#1f0d38]'
                        }`}
                      >
                        {/* Código / Ano */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">
                          <div className="font-bold text-white">
                            {emenda.numeroEmenda || 'Emenda Direta'}
                          </div>
                          <div className="text-[10px] text-purple-300/70 font-sans">{emenda.ano}</div>
                        </td>

                        {/* Esfera */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                            emenda.esfera.includes('Estadual')
                              ? 'bg-purple-950/80 text-purple-200 border border-purple-800/40'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                          }`}>
                            {emenda.esfera.replace(/\(.*?\)/g, '').trim()}
                          </span>
                        </td>

                        {/* Proponente / Parlamentar */}
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <div className="font-semibold text-slate-100 leading-tight">
                            {emenda.parlamentar}
                          </div>
                          {emenda.beneficiario && (
                            <div className="text-[10px] text-purple-300/70 truncate max-w-[180px]" title={emenda.beneficiario}>
                              Dest: {emenda.beneficiario}
                            </div>
                          )}
                        </td>

                        {/* Partido (Badge) */}
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-[#1e0e37] text-purple-200 border border-purple-800/40">
                            {emenda.partido_sigla || emenda.partido}
                          </span>
                        </td>

                        {/* Objeto */}
                        <td className="py-2.5 px-3.5">
                          <div className="font-medium text-slate-200 leading-snug line-clamp-2" title={emenda.subprojeto}>
                            {emenda.subprojeto}
                          </div>
                          {emenda.tipo_projeto_cultural && (
                            <span className="inline-block text-[10px] text-purple-300/70 mt-0.5">
                              Segmento: <strong className="text-[#FF4500]">{emenda.tipo_projeto_cultural}</strong>
                            </span>
                          )}
                        </td>

                        {/* Órgão / Secretaria */}
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 text-[11px]">
                          <span className="truncate max-w-[140px] block" title={emenda.secretaria || emenda.orgao}>
                            {emenda.secretaria || emenda.orgao}
                          </span>
                        </td>

                        {/* Dotação Alocada */}
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                          {formatBRL(emenda.valor)}
                        </td>

                        {/* Valor Liquidado */}
                        <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-[#FF4500] whitespace-nowrap">
                          {formatBRL(emenda.valor_gasto || 0)}
                        </td>

                        {/* Situação */}
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              emenda.status === 'Concluída'
                                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/40'
                                : emenda.status === 'Em Execução / Vigente'
                                ? 'bg-orange-950/70 text-orange-300 border-orange-800/40'
                                : 'bg-purple-950/70 text-purple-300 border-purple-800/40'
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
                            className="p-1.5 rounded-md hover:bg-purple-900/40 text-purple-300 transition-colors"
                            title={isExpanded ? 'Recolher detalhes' : 'Ver detalhes técnicos'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#FF4500]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-purple-400" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Technical Audit Row */}
                      {isExpanded && (
                        <tr className="bg-[#1b0a2f] border-b border-purple-900/40">
                          <td colSpan={9} className="p-4 sm:p-5">
                            <div className="bg-[#150b24] rounded-xl p-4 border border-purple-900/50 shadow-2xs space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-purple-900/30">
                                <div>
                                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                                    Auditoria e Detalhamento Fiscal • ID: {emenda.id}
                                  </span>
                                  <h4 className="text-sm font-bold text-white font-['Outfit'] mt-0.5">
                                    {emenda.subprojeto}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={e => handleCopyFicha(emenda, e)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e0e37] hover:bg-purple-900/50 text-purple-200 rounded-lg text-xs font-semibold transition-colors border border-purple-800/40"
                                  >
                                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{isCopied ? 'Copiado!' : 'Copiar Registro'}</span>
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-purple-300/70 block text-[11px]">Proponente & Partido:</span>
                                    <span className="font-semibold text-white">
                                      {emenda.parlamentar} ({emenda.partido_sigla || emenda.partido})
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-purple-300/70 block text-[11px]">Entidade Beneficiária:</span>
                                    <span className="font-semibold text-slate-200">
                                      {emenda.beneficiario || 'Município de Viamão / Secretaria Municipal'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-purple-300/70 block text-[11px]">Programa Orçamentário:</span>
                                    <span className="text-slate-300">{emenda.projeto}</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <div>
                                    <span className="text-purple-300/70 block text-[11px]">Nota de Empenho:</span>
                                    <span className="font-mono font-bold text-white">
                                      {emenda.empenho_numero || 'Em tramitação contábil'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-purple-300/70 block text-[11px]">Processo Administrativo:</span>
                                    <span className="font-mono text-purple-200">
                                      {emenda.processo_administrativo || 'Não informado'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-purple-300/70 block text-[11px]">Esfera & Instrumento:</span>
                                    <span className="text-slate-300">{emenda.esfera} • Fomento / Repasse</span>
                                  </div>
                                </div>

                                <div className="space-y-1.5">
                                  <span className="text-purple-200 font-bold block text-[11px] flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
                                    Fontes Oficiais Verificadas:
                                  </span>
                                  <div className="bg-[#1a0c30] p-2.5 rounded-lg border border-purple-900/40 space-y-1">
                                    {emenda.fontes_cruzadas && emenda.fontes_cruzadas.length > 0 ? (
                                      emenda.fontes_cruzadas.map((f, i) => (
                                        <div key={i} className="text-[11px] text-slate-300 flex items-start gap-1">
                                          <span className="text-emerald-400 font-bold">✓</span>
                                          <span>{f}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-[11px] text-slate-300">{emenda.fonte}</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {emenda.justificativa && (
                                <div className="pt-2 border-t border-purple-900/30 text-xs text-slate-300">
                                  <span className="font-semibold text-purple-200 block mb-0.5">Descrição Técnica do Objeto:</span>
                                  <p className="leading-relaxed bg-[#1a0c30] p-2.5 rounded-lg border border-purple-900/40">
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

            {/* Total Row (Spreadsheet Footer) */}
            {emendasFiltradas.length > 0 && (
              <tfoot>
                <tr className="bg-[#1a0b30] font-bold text-slate-200 border-t-2 border-purple-800/60">
                  <td colSpan={6} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs">
                    Totais da Planilha Filtrada ({emendasFiltradas.length} linhas):
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs text-[#c084fc]">
                    {formatBRL(totalAlocado)}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono text-xs text-[#FF4500]">
                    {formatBRL(totalGasto)}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-xs text-white">
                    {percentualGeral}%
                  </td>
                  <td colSpan={2} className="py-3 px-3.5 text-purple-300/80 text-[11px] font-normal">
                    Saldo: {formatBRL(totalAlocado - totalGasto)}
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
