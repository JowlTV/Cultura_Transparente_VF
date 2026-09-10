import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Play,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Server,
  Activity,
  Globe,
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { API_DOCUMENTATION } from '../data/initialData';
import { ApiEndpointDoc } from '../types/culture';

export const ApiDocumentationSection: React.FC = () => {
  const [selectedApi, setSelectedApi] = useState<ApiEndpointDoc>(API_DOCUMENTATION[0]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTestEndpoint = () => {
    setIsSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationResult(selectedApi.exemploResposta);
    }, 600);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrapingPipelines = [
    {
      nome: 'Robô Diário Oficial de Viamão (DOM)',
      alvo: 'https://www.viamao.rs.gov.br/diario-oficial',
      frequencia: 'Diária (07:00 AM)',
      status: 'Ativo e Operante',
      objeto: 'Identificação de decretos orçamentários, chamamentos públicos e editais de fomento cultural da SMC.',
      ultimaColeta: '09/09/2026 07:14',
    },
    {
      nome: 'Crawler Transparência FPE / SEDAC-RS',
      alvo: 'https://transparencia.rs.gov.br/emendas',
      frequencia: 'Semanal (Segundas-feiras)',
      status: 'Ativo e Operante',
      objeto: 'Rastreamento de convênios assinados entre a Secretaria de Estado da Cultura do RS e entidades de Viamão.',
      ultimaColeta: '08/09/2026 19:42',
    },
    {
      nome: 'Sincronizador Automático CGU / Open Data',
      alvo: 'api.portaldatransparencia.gov.br',
      frequencia: 'A cada 6 horas',
      status: 'Sincronizado',
      objeto: 'Monitoramento contínuo das dotações impositivas federais destinadas para Viamão.',
      ultimaColeta: '09/09/2026 09:30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-800/60 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-200 mb-3">
            <Server className="w-3.5 h-3.5 text-blue-300" />
            Arquitetura de Dados Abertos e Interoperabilidade
          </div>
          <h2 className="text-xl sm:text-3xl font-bold font-['Outfit'] tracking-tight">
            Documentação de APIs Públicas & Rotinas de Scraping
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
            Em conformidade com a <strong>Lei de Acesso à Informação (Lei nº 12.527/2011)</strong>, este portal disponibiliza os endpoints governamentais consumidos para que qualquer cidadão ou desenvolvedor possa auditar os dados brutos de forma programática.
          </p>
        </div>
      </div>

      {/* Web Scraping Status Monitor */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900 font-['Outfit']">
              Monitor de Agentes de Coleta & Web Scraping (Dados Complementares)
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Pipelines Saudáveis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scrapingPipelines.map((pipe, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{pipe.nome}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  {pipe.status}
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{pipe.objeto}</p>
              <div className="pt-2 border-t border-slate-200/60 text-[11px] text-slate-500 space-y-1">
                <div>Frequência: <strong className="text-slate-700">{pipe.frequencia}</strong></div>
                <div>Última execução: <strong className="text-slate-700">{pipe.ultimaColeta}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints Catalog & Interactive Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Endpoint Selector */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-sm font-['Outfit'] flex items-center gap-1.5">
            <Database className="w-4 h-4 text-blue-700" />
            Endpoints Oficiais Catalogados
          </h3>
          <p className="text-xs text-slate-500">Selecione uma fonte para examinar os parâmetros e testar a resposta:</p>

          <div className="space-y-2 pt-1">
            {API_DOCUMENTATION.map(api => {
              const isSelected = selectedApi.id === api.id;
              return (
                <button
                  key={api.id}
                  onClick={() => {
                    setSelectedApi(api);
                    setSimulationResult(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50/80 text-blue-950 font-bold shadow-2xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-200 text-blue-900">
                      {api.metodo}
                    </span>
                    <span className="text-[10px] text-slate-500">{api.esfera}</span>
                  </div>
                  <div className="font-bold text-slate-900 leading-snug">{api.nome}</div>
                  <div className="text-[11px] text-slate-500 truncate mt-1 font-mono">{api.url}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Endpoint Detail & Sandbox */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono">
                  {selectedApi.metodo}
                </span>
                <h4 className="text-base font-bold text-slate-900 font-['Outfit']">
                  {selectedApi.nome}
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-1">{selectedApi.descricao}</p>
            </div>

            <button
              onClick={handleTestEndpoint}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Consultando API...' : 'Executar Chamada Teste'}</span>
            </button>
          </div>

          {/* URL Box */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Endpoint Base URL:</span>
            <div className="p-3 bg-slate-900 text-blue-300 rounded-xl font-mono text-xs flex items-center justify-between overflow-x-auto">
              <span>{selectedApi.url}</span>
              <button
                onClick={() => handleCopyCode(selectedApi.url)}
                className="text-slate-400 hover:text-white p-1 ml-2"
                title="Copiar URL"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Query Parameters Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700">Parâmetros de Consulta (Query Params):</span>
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 text-[11px] font-bold">
                  <tr>
                    <th className="p-2.5">Parâmetro</th>
                    <th className="p-2.5">Tipo</th>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5">Exemplo (Viamão)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedApi.parametros.map(param => (
                    <tr key={param.nome} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-blue-950">{param.nome}</td>
                      <td className="p-2.5 text-slate-500">{param.tipo}</td>
                      <td className="p-2.5 text-slate-700">{param.descricao}</td>
                      <td className="p-2.5 font-mono text-emerald-800 font-semibold">{param.exemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simulated Response Inspector */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                Payload de Resposta (JSON / REST API):
              </span>
              {simulationResult && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  HTTP 200 OK • Latência ~120ms
                </span>
              )}
            </div>

            <div className="relative">
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 scrollbar-thin">
                {simulationResult || selectedApi.exemploResposta}
              </pre>
              <button
                onClick={() => handleCopyCode(simulationResult || selectedApi.exemploResposta)}
                className="absolute top-3 right-3 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-md text-xs flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
