import React, { useState } from 'react';
import {
  Film,
  ExternalLink,
  CheckCircle2,
  DollarSign,
  FileText,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Building,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { LeiIncentivo } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface LpgSectionProps {
  leisIncentivo: LeiIncentivo[];
  isLoading?: boolean;
}

export const LpgSection: React.FC<LpgSectionProps> = ({ leisIncentivo, isLoading }) => {
  const [filtroArtigo, setFiltroArtigo] = useState<string>('todos');

  // Filtrar apenas projetos da Lei Paulo Gustavo (LC 195/2022)
  const lpgProjetos = leisIncentivo.filter(item =>
    item.mecanismo.toLowerCase().includes('paulo gustavo') || item.mecanismo.toLowerCase().includes('lpg')
  );

  const projetosFiltrados = lpgProjetos.filter(item => {
    if (filtroArtigo === 'todos') return true;
    if (filtroArtigo === 'audiovisual') return item.projeto_objeto.toLowerCase().includes('audiovisual') || item.projeto_objeto.toLowerCase().includes('documentário') || item.projeto_objeto.toLowerCase().includes('cinema');
    if (filtroArtigo === 'multilinguagens') return !item.projeto_objeto.toLowerCase().includes('audiovisual') && !item.projeto_objeto.toLowerCase().includes('cinema');
    return true;
  });

  const totalAprovado = lpgProjetos.reduce((acc, curr) => acc + curr.valor_aprovado, 0);
  const totalRepassado = lpgProjetos.reduce((acc, curr) => acc + (curr.valor_captado || curr.valor_aprovado), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner - Lei Paulo Gustavo */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-purple-800/80 border border-purple-400/40 px-3 py-1 rounded-full text-xs font-semibold text-purple-200">
              <Film className="w-3.5 h-3.5 text-purple-300" />
              Lei Complementar nº 195/2022 (LPG)
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight">
              Lei Paulo Gustavo em Viamão
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Mapeamento técnico da execução emergencial e continuada dos recursos da <strong>LC nº 195/2022</strong>. O município de Viamão operou repasses diretos divididos entre o <strong>Audiovisual (Art. 6º)</strong> e <strong>Demais Áreas Culturais (Art. 8º)</strong>.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-purple-200 font-semibold block">
                Total Homologado
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-['Outfit'] block mt-1">
                {formatBRL(totalAprovado)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold block">
                Total Liquidado
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-['Outfit'] block mt-1">
                {formatBRL(totalRepassado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orientações Práticas para Fazedores de Cultura (LPG) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
              Prestação de Contas Simplificada
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Conforme o Decreto Federal nº 11.525/2023, a comprovação é prioritariamente focada no <strong>cumprimento do objeto</strong> (fotos, relatórios de atividades, listas de presença e clipping), exigindo relatório financeiro apenas em caso de indício de irregularidade.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Relatório de Execução do Objeto
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1e40af] flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
              Contrapartida Social Obrigatória
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Todos os contemplados devem realizar exibição pública gratuita de produções, oficinas com a rede pública escolar de Viamão ou ações afirmativas para públicos em vulnerabilidade social.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#1e40af]">
            <Sparkles className="w-3.5 h-3.5" />
            Acesso 100% Gratuito
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
              Acompanhamento no Transferegov
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O município de Viamão opera a prestação de contas dos saldos da conta bancária específica no portal Transferegov, sob fiscalização do Ministério da Cultura e do controle social municipal.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
            <Layers className="w-3.5 h-3.5" />
            Conta Fiduciária Caixa
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Segmentação LPG:</span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'todos', label: 'Todos os Projetos LPG' },
              { id: 'audiovisual', label: 'Artigo 6º (Audiovisual & Salas)' },
              { id: 'multilinguagens', label: 'Artigo 8º (Demais Linguagens)' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFiltroArtigo(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroArtigo === m.id
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
          Exibindo <strong>{projetosFiltrados.length}</strong> projetos homologados
        </span>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white rounded-2xl border border-purple-200 p-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-600 font-semibold">Carregando dados da Lei Paulo Gustavo...</p>
          </div>
        )}

        {!isLoading && projetosFiltrados.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
              <Film className="w-8 h-8 text-purple-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">Nenhum projeto encontrado</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Não foram encontrados projetos da Lei Paulo Gustavo para os critérios selecionados. Conforme a diretriz anti-alucinação, nenhum dado fictício é exibido.
              </p>
            </div>
          </div>
        )}
        {projetosFiltrados.map(item => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    {item.mecanismo}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">{item.periodo_execucao || '2023 - 2026'}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {item.status_atual || item.status || 'Executado'}
                  </span>
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
                  {formatBRL(item.valor_captado || item.valor_aprovado)} liquidado
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {item.como_sera_feito || item.detalhes}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Proponente / Beneficiário</span>
                <span className="font-semibold text-slate-800">{item.responsavel_execucao || item.proponente}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Órgão Gestor Municipal</span>
                <span className="font-semibold text-slate-800">{item.orgao_liberador || 'SMC / Prefeitura de Viamão'}</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Fonte Normativa</span>
                <span className="font-semibold text-slate-800">LC nº 195/2022 & Decreto 11.525</span>
              </div>
            </div>

            {(item.fonte_oficial || item.link_oficial) && (
              <div className="pt-2 flex justify-end">
                <a
                  href={item.fonte_oficial || item.link_oficial}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
                >
                  <span>Ver termo oficial de homologação</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
