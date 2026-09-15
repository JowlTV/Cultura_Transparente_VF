import React, { useState } from 'react';
import {
  Film,
  CheckCircle2,
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
        <div className="bg-[#FAF4EB] border border-[#E2D2BC] p-4 rounded-2xl text-[#2D0652] text-xs flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-[#FF4500] shrink-0" />
            <div>
              <strong className="font-bold text-[#2D0652]">Aviso de Exibição (Dados de Referência / Fallback):</strong> A consulta ao vivo à API do Transferegov Fundo a Fundo não pôde ser concluída no momento. O sistema está exibindo o plano de ação oficial homologado de Viamão para fins de consulta e transparência.
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-[#FFE8E0] text-[#FF4500] font-bold text-[10px] rounded-full shrink-0 border border-[#FFC2B2]">
            Fallback Estático
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#2D0652] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-[#3D0B6D]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 bg-[#6A0DAD] border border-purple-400/30 px-3 py-1 rounded-full text-xs font-bold text-white">
              <Film className="w-3.5 h-3.5 text-[#FF4500]" />
              {lpgData.base_legal}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Lei Paulo Gustavo em Viamão/RS
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-medium">
              Auditoria do <strong>Plano de Ação nº {lpgData.codigo_plano_acao}</strong> homologado no Ministério da Cultura. Os recursos foram transferidos na modalidade fundo a fundo para a Secretaria Municipal da Cultura de Viamão para fomento ao audiovisual (Art. 6º) e às demais linguagens culturais (Art. 8º).
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-5 rounded-2xl text-center shrink-0 min-w-[160px]">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 font-bold block">
                Valor Total Repassado
              </span>
              <span className="text-xl sm:text-2xl font-bold text-white block mt-1" style={{ fontFamily: 'var(--font-display)' }}>
                {formatBRL(lpgData.valor_total_repasse)}
              </span>
              <span className="text-[10px] text-emerald-300 font-bold mt-1 block">
                Situação: {lpgData.situacao}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-5 rounded-2xl text-center shrink-0 min-w-[160px]">
              <span className="text-[10px] uppercase tracking-wider text-purple-200 font-bold block">
                Vigência do Plano
              </span>
              <span className="text-sm font-bold text-white block mt-2" style={{ fontFamily: 'var(--font-display)' }}>
                {lpgData.data_inicio_vigencia} a {lpgData.data_fim_vigencia}
              </span>
              <span className="text-[10px] text-purple-200 mt-1 block font-semibold">
                {lpgData.metas.length} Metas Aprovadas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dados Institucionais & Contas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#FAF4EB] p-6 rounded-3xl border border-[#E2D2BC] shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#2D0652] font-bold text-sm">
              <Building className="w-4 h-4 text-[#FF4500]" />
              <span>Ente e Fundo Recebedor</span>
            </div>
            <div className="space-y-1 text-xs text-[#2D0652]/80 pt-1 font-medium">
              <p><strong>Ente:</strong> {lpgData.ente_recebedor.nome} ({lpgData.ente_recebedor.municipio}/{lpgData.ente_recebedor.uf})</p>
              <p><strong>CNPJ:</strong> {lpgData.ente_recebedor.cnpj}</p>
              <p><strong>Órgão Gestor:</strong> {lpgData.ente_recebedor.fundo_orgao}</p>
              <p><strong>Repassador:</strong> {lpgData.orgao_repassador.nome} ({lpgData.orgao_repassador.fundo})</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2D2BC] flex items-center gap-1.5 text-xs font-bold text-[#6A0DAD]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF4500]" />
            Transferegov Fundo a Fundo
          </div>
        </div>

        <div className="bg-[#FAF4EB] p-6 rounded-3xl border border-[#E2D2BC] shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#2D0652] font-bold text-sm">
              <CreditCard className="w-4 h-4 text-[#6A0DAD]" />
              <span>Contas Fiduciárias Vinculadas</span>
            </div>
            <div className="space-y-2 text-xs text-[#2D0652]/80 pt-1 font-medium">
              {lpgData.dados_bancarios.map((cb, idx) => (
                <div key={idx} className="bg-white p-3 rounded-2xl border border-[#E2D2BC]">
                  <div className="font-bold text-[#2D0652] flex justify-between">
                    <span>{cb.nome_programa_agil_conta_plano_acao_dado_bancario || `Conta ${idx+1}`}</span>
                    <span className="text-[10px] text-[#166534] bg-[#E3F7E8] px-2 py-0.5 rounded-full border border-[#B7ECC3] font-bold">Ativa</span>
                  </div>
                  <p className="text-[11px] text-[#2D0652]/70 mt-1">
                    {cb.nome_banco_plano_acao_dado_bancario} | Ag: {cb.numero_agencia_plano_acao_dado_bancario}-{cb.dv_agencia_plano_acao_dado_bancario || '9'} | C/C: {cb.numero_conta_plano_acao_dado_bancario}-{cb.dv_conta_plano_acao_dado_bancario || 'X'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2D2BC] flex items-center gap-1.5 text-xs font-bold text-[#166534]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Movimentação Rastreável Fiduciária
          </div>
        </div>

        <div className="bg-[#FAF4EB] p-6 rounded-3xl border border-[#E2D2BC] shadow-xs flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#2D0652] font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
              <span>Regras de Prestação de Contas</span>
            </div>
            <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
              Em conformidade com o Decreto Federal nº 11.525/2023, o monitoramento avalia o <strong>cumprimento do objeto</strong> e contrapartidas sociais gratuitas à comunidade escolar e bairros periféricos de Viamão.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#E2D2BC] flex items-center gap-1.5 text-xs font-bold text-[#FF4500]">
            <Sparkles className="w-3.5 h-3.5" />
            Acesso e Contrapartida 100% Gratuitos
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#FAF4EB] rounded-3xl p-5 border border-[#E2D2BC] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#2D0652]">Filtrar Metas:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { id: 'todas', label: 'Todas as Metas (4)' },
              { id: 'audiovisual', label: 'Artigo 6º (Audiovisual)' },
              { id: 'demais', label: 'Artigo 8º (Demais Linguagens)' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFiltroMeta(m.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filtroMeta === m.id
                    ? 'bg-[#6A0DAD] text-white shadow-xs'
                    : 'bg-white text-[#2D0652] hover:bg-[#F5EAD8] border border-[#E2D2BC]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <span className="text-xs text-[#2D0652]/70 font-semibold">
          Total Alocado nas Metas: <strong className="text-[#6A0DAD]">{formatBRL(totalMetas)}</strong>
        </span>
      </div>

      {/* Metas List */}
      <div className="space-y-4">
        {isLoading && (
          <div className="bg-[#FAF4EB] rounded-3xl border border-[#E2D2BC] p-8 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#6A0DAD] animate-spin mx-auto" />
            <p className="text-xs text-[#2D0652] font-bold">Atualizando dados da Lei Paulo Gustavo via Transferegov...</p>
          </div>
        )}

        {!isLoading && metasFiltradas.length === 0 && (
          <div className="bg-[#FAF4EB] rounded-3xl border border-[#E2D2BC] p-8 text-center text-[#2D0652]/70 space-y-2">
            <Target className="w-8 h-8 text-[#2D0652]/40 mx-auto" />
            <p className="text-xs font-bold text-[#2D0652]">Nenhuma meta detalhada disponível no momento.</p>
            <p className="text-xs text-[#2D0652]/60">A API respondeu com sucesso, mas não retornou itens de metas para este plano.</p>
          </div>
        )}

        {metasFiltradas.map((meta, idx) => (
          <div
            key={meta.id_meta_plano_acao || idx}
            className="bg-white rounded-3xl border border-[#E2D2BC] p-6 shadow-xs space-y-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#E2D2BC]">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB]">
                    {meta.numero_meta_plano_acao} • {meta.nome_meta_plano_acao}
                  </span>
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-[#E3F7E8] text-[#166534] border border-[#B7ECC3]">
                    Autorizado
                  </span>
                  <span className="text-xs text-[#2D0652]/60 font-medium">
                    Plano nº {lpgData.codigo_plano_acao}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#2D0652] pt-1" style={{ fontFamily: 'var(--font-display)' }}>
                  {meta.descricao_meta_plano_acao}
                </h3>
              </div>

              <div className="text-left md:text-right shrink-0">
                <span className="text-xs text-[#2D0652]/70 font-semibold block">Valor Homologado:</span>
                <span className="text-xl sm:text-2xl font-bold text-[#6A0DAD] block mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                  {formatBRL(meta.valor_meta_plano_acao)}
                </span>
                <span className="text-xs text-[#166534] font-bold block mt-0.5">
                  {((meta.valor_meta_plano_acao / lpgData.valor_total_repasse) * 100).toFixed(1)}% do total
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#2D0652]/80">
              <div className="bg-[#FAF4EB] p-3.5 rounded-2xl border border-[#E2D2BC]">
                <span className="text-[10px] text-[#2D0652]/60 uppercase font-bold block">Artigo Normativo</span>
                <span className="font-bold text-[#2D0652]">{meta.nome_meta_plano_acao} (LC 195/2022)</span>
              </div>

              <div className="bg-[#FAF4EB] p-3.5 rounded-2xl border border-[#E2D2BC]">
                <span className="text-[10px] text-[#2D0652]/60 uppercase font-bold block">Destinação dos Recursos</span>
                <span className="font-bold text-[#2D0652]">Editais e Prêmios em Viamão</span>
              </div>

              <div className="bg-[#FAF4EB] p-3.5 rounded-2xl border border-[#E2D2BC]">
                <span className="text-[10px] text-[#2D0652]/60 uppercase font-bold block">Comprovação Exigida</span>
                <span className="font-bold text-[#2D0652]">Relatório de Execução do Objeto</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <a
                href="https://api.transferegov.gestao.gov.br/fundoafundo/plano_acao?id_programa=eq.47&cnpj_ente_recebedor_plano_acao=eq.88000914000101"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF4EB] hover:bg-[#F5EAD8] text-[#2D0652] text-xs font-bold rounded-full transition-colors border border-[#E2D2BC]"
              >
                <span>Consultar registro no Transferegov</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-[#FF4500]" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
