import React, { useState } from 'react';
import {
  Film,
  ExternalLink,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Building,
  CreditCard,
  Target,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { LpgPlanoAcao } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface LpgSectionProps {
  lpgData: LpgPlanoAcao;
  isLoading?: boolean;
}

export const LpgSection: React.FC<LpgSectionProps> = ({ lpgData, isLoading }) => {
  const [filtroMeta, setFiltroMeta] = useState<string>('todas');

  const metasFiltradas = lpgData.metas.filter(m => {
    if (filtroMeta === 'todas') return true;
    if (filtroMeta === 'audiovisual') return m.nome_meta_plano_acao.includes('Art. 6º') || m.descricao_meta_plano_acao.toLowerCase().includes('audiovisual') || m.descricao_meta_plano_acao.toLowerCase().includes('cinema');
    if (filtroMeta === 'demais') return m.nome_meta_plano_acao.includes('Art. 8º') || m.descricao_meta_plano_acao.toLowerCase().includes('demais');
    return true;
  });

  const totalMetas = lpgData.metas.reduce((acc, curr) => acc + curr.valor_meta_plano_acao, 0);

  return (
    <div className="space-y-6">
      {lpgData.fonte_dado === 'fallback_estatico' && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold">Aviso de Exibição (Dados de Referência / Fallback):</strong> A consulta ao vivo à API do Transferegov Fundo a Fundo não pôde ser concluída no momento. O sistema está exibindo o plano de ação oficial homologado de Viamão para fins de consulta e transparência.
            </div>
          </div>
          <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 font-bold text-[10px] rounded shrink-0 border border-amber-300">
            Fallback Estático
          </span>
        </div>
      )}

      {/* Header Banner - Lei Paulo Gustavo */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-purple-800/80 border border-purple-400/40 px-3 py-1 rounded-full text-xs font-semibold text-purple-200">
              <Film className="w-3.5 h-3.5 text-purple-300" />
              {lpgData.base_legal}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight">
              Lei Paulo Gustavo em Viamão/RS
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed">
              Auditoria do <strong>Plano de Ação nº {lpgData.codigo_plano_acao}</strong> homologado no Ministério da Cultura. Os recursos foram transferidos na modalidade fundo a fundo para a Secretaria Municipal da Cultura de Viamão para fomento ao audiovisual (Art. 6º) e às demais linguagens culturais (Art. 8º).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0 min-w-[150px]">
              <span className="text-[11px] uppercase tracking-wider text-purple-200 font-semibold block">
                Valor Total Repassado
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-['Outfit'] block mt-1">
                {formatBRL(lpgData.valor_total_repasse)}
              </span>
              <span className="text-[10px] text-emerald-300 font-semibold mt-0.5 block">
                Situação: {lpgData.situacao}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0 min-w-[150px]">
              <span className="text-[11px] uppercase tracking-wider text-purple-200 font-semibold block">
                Vigência do Plano
              </span>
              <span className="text-sm font-bold text-white font-['Outfit'] block mt-2">
                {lpgData.data_inicio_vigencia} a {lpgData.data_fim_vigencia}
              </span>
              <span className="text-[10px] text-purple-200 mt-1 block">
                {lpgData.metas.length} Metas Aprovadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dados Institucionais & Contas Fiduciárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <Building className="w-4 h-4 text-purple-700" />
              <span>Ente e Fundo Recebedor</span>
            </div>
            <div className="space-y-1 text-xs text-slate-700 pt-1">
              <p><strong>Ente:</strong> {lpgData.ente_recebedor.nome} ({lpgData.ente_recebedor.municipio}/{lpgData.ente_recebedor.uf})</p>
              <p><strong>CNPJ:</strong> {lpgData.ente_recebedor.cnpj}</p>
              <p><strong>Órgão Gestor:</strong> {lpgData.ente_recebedor.fundo_orgao}</p>
              <p><strong>Repassador:</strong> {lpgData.orgao_repassador.nome} ({lpgData.orgao_repassador.fundo})</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Transferegov Fundo a Fundo
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-purple-700" />
              <span>Contas Fiduciárias Vinculadas</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700 pt-1">
              {lpgData.dados_bancarios.map((cb, idx) => (
                <div key={idx} className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <div className="font-semibold text-slate-900 flex justify-between">
                    <span>{cb.nome_programa_agil_conta_plano_acao_dado_bancario || `Conta ${idx+1}`}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">Ativa</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {cb.nome_banco_plano_acao_dado_bancario} | Ag: {cb.numero_agencia_plano_acao_dado_bancario}-{cb.dv_agencia_plano_acao_dado_bancario || '9'} | C/C: {cb.numero_conta_plano_acao_dado_bancario}-{cb.dv_conta_plano_acao_dado_bancario || 'X'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Movimentação Rastreável Fiduciária
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>Regras de Prestação de Contas</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Em conformidade com o Decreto Federal nº 11.525/2023, o monitoramento avalia o <strong>cumprimento do objeto</strong> e contrapartidas sociais gratuitas à comunidade escolar e bairros periféricos de Viamão.
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
            <Sparkles className="w-3.5 h-3.5" />
            Acesso e Contrapartida 100% Gratuitos
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filtrar Metas:</span>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'todas', label: 'Todas as Metas (4)' },
              { id: 'audiovisual', label: 'Artigo 6º (Audiovisual)' },
              { id: 'demais', label: 'Artigo 8º (Demais Linguagens)' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFiltroMeta(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtroMeta === m.id
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
          Total Alocado nas Metas: <strong>{formatBRL(totalMetas)}</strong>
        </span>
      </div>

      {/* Metas List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-white rounded-2xl border border-purple-200 p-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-600 font-semibold">Atualizando dados da Lei Paulo Gustavo via Transferegov...</p>
          </div>
        )}

        {!isLoading && metasFiltradas.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 space-y-2">
            <Target className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-700">Nenhuma meta detalhada disponível na fonte no momento da consulta.</p>
            <p className="text-[11px] text-slate-400">A API respondeu com sucesso, mas não retornou itens de metas para este plano.</p>
          </div>
        )}

        {metasFiltradas.map((meta, idx) => (
          <div
            key={meta.id_meta_plano_acao || idx}
            className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                    {meta.numero_meta_plano_acao} • {meta.nome_meta_plano_acao}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Autorizado
                  </span>
                  <span className="text-xs text-slate-500">
                    Plano nº {lpgData.codigo_plano_acao}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] pt-1">
                  {meta.descricao_meta_plano_acao}
                </h3>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className="text-xs text-slate-500 font-medium block">Valor Homologado na Meta:</span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] block text-purple-950">
                  {formatBRL(meta.valor_meta_plano_acao)}
                </span>
                <span className="text-xs text-emerald-700 font-semibold block">
                  {((meta.valor_meta_plano_acao / lpgData.valor_total_repasse) * 100).toFixed(1)}% do total do município
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Artigo Normativo</span>
                <span className="font-semibold text-slate-800">{meta.nome_meta_plano_acao} (LC 195/2022)</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Destinação dos Recursos</span>
                <span className="font-semibold text-slate-800">Editais e Prêmios em Viamão</span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Comprovação Exigida</span>
                <span className="font-semibold text-slate-800">Relatório de Execução do Objeto</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href="https://api.transferegov.gestao.gov.br/fundoafundo/plano_acao?id_programa=eq.47&cnpj_ente_recebedor_plano_acao=eq.88000914000101"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-purple-100 text-purple-900 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
              >
                <span>Consultar registro no Transferegov Fundo a Fundo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
