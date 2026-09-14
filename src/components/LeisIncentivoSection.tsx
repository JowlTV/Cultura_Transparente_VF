import React, { useState } from 'react';
import {
  Sparkles,
  Film,
  Building,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Info,
  Calendar,
  Layers
} from 'lucide-react';
import { LeiIncentivo } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface LeisIncentivoSectionProps {
  leisIncentivo: LeiIncentivo[];
}

export const LeisIncentivoSection: React.FC<LeisIncentivoSectionProps> = ({ leisIncentivo }) => {
  const [filtroMecanismo, setFiltroMecanismo] = useState<string>('todos');

  const itensFiltrados = leisIncentivo.filter(item => {
    if (filtroMecanismo === 'todos') return true;
    return item.mecanismo.toLowerCase().includes(filtroMecanismo.toLowerCase());
  });

  const totalAprovado = itensFiltrados.reduce((acc, curr) => acc + curr.valor_aprovado, 0);
  const totalCaptado = itensFiltrados.reduce((acc, curr) => acc + (curr.valor_captado || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-800/70 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-3">
              <Film className="w-3.5 h-3.5 text-purple-300" />
              Mecanismos de Fomento e Renúncia Fiscal
            </div>
            <h2 className="text-xl sm:text-3xl font-bold font-['Outfit'] tracking-tight">
              Leis de Incentivo à Cultura em Viamão
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Acompanhamento aprofundado dos recursos autorizados através da <strong>Lei Paulo Gustavo (LC nº 195/2022)</strong> e dos projetos com incentivo fiscal da <strong>Lei Rouanet (Lei nº 8.313/1991 / SALIC)</strong> para a cidade.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-purple-200 font-semibold block">
                Total Aprovado
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-['Outfit'] block mt-1">
                {formatBRL(totalAprovado)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold block">
                Total Captado / Repassado
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-['Outfit'] block mt-1">
                {formatBRL(totalCaptado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filtrar por Marco Legal:</span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos os Mecanismos' },
              { id: 'paulo gustavo', label: 'Lei Paulo Gustavo (LPG)' },
              { id: 'rouanet', label: 'Lei Rouanet (SalicNet)' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFiltroMecanismo(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroMecanismo === m.id
                    ? 'bg-purple-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Exibindo <strong>{itensFiltrados.length}</strong> projetos registrados
        </span>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        
        {itensFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Nenhum projeto encontrado</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Dados não coletados, consultar plataformas oficiais. Não foram encontrados registros validados para este mecanismo na base oficial do Ministério da Cultura.
              </p>
            </div>
          </div>
        )}

        {itensFiltrados.map(item => {
          const percentualCaptado = item.valor_captado
            ? Math.round((item.valor_captado / item.valor_aprovado) * 100)
            : 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                      {item.mecanismo}
                    </span>
                    {item.pronac_numero && (
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.pronac_numero}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">{item.periodo_execucao}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] pt-1">
                    {item.projeto_objeto}
                  </h3>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs text-slate-500 font-medium block">Valor Homologado:</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] block">
                    {formatBRL(item.valor_aprovado)}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold block">
                    Captado / Disponível: {formatBRL(item.valor_captado || 0)} ({percentualCaptado}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar for Captação */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progresso da Captação / Execução Financeira</span>
                  <span className="font-semibold text-slate-800">{percentualCaptado}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, percentualCaptado)}%` }}
                  ></div>
                </div>
              </div>

              {/* Technical Sheet Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Ficha de Origem e Destino
                  </h5>
                  <div className="space-y-1.5 pt-1 text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-500">Órgão Autorizador:</span>
                      <div className="text-slate-800 font-medium">{item.orgao_liberador}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Origem dos Recursos:</span>
                      <div className="text-slate-800 font-medium">{item.origem_recurso}</div>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Destino Financeiro / Conta:</span>
                      <div className="text-slate-800 font-mono text-[11px] bg-white p-1 rounded border border-slate-200 mt-0.5">
                        {item.destino_recurso}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Proponente Responsável:</span>
                      <div className="text-slate-900 font-bold">{item.responsavel_execucao}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Plano de Ação Cidadão
                    </h5>
                    <div className="pt-2 text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-1">Como o recurso é executado na cidade?</strong>
                      {item.como_sera_feito}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">
                      Status: <strong className="text-slate-900">{item.status_atual}</strong>
                    </span>
                    <a
                      href={item.fonte_oficial || 'https://aplicacoes.cultura.gov.br/comparar/salicnet/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-900 text-white rounded-md font-semibold text-xs hover:bg-purple-800 transition-colors"
                    >
                      <span>Consulta SalicNet / MinC</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
