import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  ExternalLink,
  Clock,
  Scale,
  Info,
  Building2,
  FileCheck2,
  CheckCircle2,
  HelpCircle,
  MousePointerClick,
  Filter,
  Search,
  Coins,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { PnabRecord } from '../types/culture';
import { InstitutionalValidationBadge } from './InstitutionalValidationBadge';
import { OFFICIAL_VIAMAO_CNPJ } from '../utils/institutionalValidation';

interface PnabAuditoriaSectionProps {
  pnabList: PnabRecord[];
}

export const PnabAuditoriaSection: React.FC<PnabAuditoriaSectionProps> = ({ pnabList }) => {
  const [mostrarGuiaDetalhado, setMostrarGuiaDetalhado] = useState<boolean>(false);
  const pnabPrincipal = pnabList[0] || {
    id: 'pnab-01',
    rubrica: 'Política Nacional Aldir Blanc (PNAB) - Recursos Descentralizados da União',
    valor_exato: 0,
    data_extrato: '09/09/2026',
    banco_custodia: 'Conta Corrente Fiduciária Vinculada (Transferegov.br)',
    conta_vinculada: 'Fundo Municipal de Cultura de Viamão',
    cnpj_destinatario: OFFICIAL_VIAMAO_CNPJ,
    origem_detalhada: 'Fundo Nacional de Cultura / Transferegov.br (Política Nacional Aldir Blanc - Lei nº 14.399/2022)',
    contexto_legal: 'Recursos descentralizados da União sob custódia fiduciária pública do Fundo Municipal de Cultura para cumprimento das fases formais de lançamento de editais municipais. Regulados pela Lei nº 14.399/2022 e Decreto nº 11.740/2023.',
    fonte_link: 'https://portal.transferegov.sistema.gov.br/',
    termo_numero: 'Termo de Adesão oficial registrado no Transferegov',
    status_etapa: 'Fase de Elaboração e Publicação de Editais',
    sincronizacao_pendente: false,
    base_legal: 'Lei Federal nº 14.399/2022, Decreto Federal nº 11.740/2023 e Portarias MinC nº 80/2023 e nº 84/2023',
    fonte_auditada: 'Plataforma Transferegov.br / Ministério da Cultura (MinC)',
  };

  const etapasTramitacao = [
    {
      titulo: '1. Adesão e Plano de Ação no Transferegov',
      status: 'Homologado',
      data: 'Dezembro / 2023',
      desc: 'Prefeitura Municipal de Viamão cadastrou e obteve aprovação do Plano de Ação junto ao Ministério da Cultura através da plataforma oficial Transferegov.br.',
      isDone: true,
    },
    {
      titulo: '2. Repasse Fundo a Fundo da União',
      status: 'Concluído / Em Conta',
      data: 'Exercício 2024',
      desc: 'Crédito descentralizado repassado à conta corrente fiduciária vinculada ao Fundo Municipal de Cultura de Viamão, em conformidade com as diretrizes do Transferegov.br e da Lei nº 14.399/2022.',
      isDone: true,
    },
    {
      titulo: '3. Regulamentação do PAAR e Escutas Públicas',
      status: 'Homologado',
      data: '2024 / 2025',
      desc: 'Realização de escutas com o Conselho Municipal de Cultura e comunidade artística para pactuação do Plano Anual de Aplicação dos Recursos (PAAR).',
      isDone: true,
    },
    {
      titulo: '4. Publicação e Execução dos Editais Municipais',
      status: 'Fase Atual (Em Andamento)',
      data: '2026',
      desc: 'Elaboração das minutas, abertura do período de inscrições para a classe artística de Viamão, seleção técnica e avaliação das propostas.',
      isDone: false,
      isCurrent: true,
    },
    {
      titulo: '5. Prestação de Contas Integrada (MinC / TCU)',
      status: 'Aguardando Execução',
      data: 'Até 2027',
      desc: 'Comprovação final no Transferegov.br, fiscalizada pelos órgãos de controle social, Conselho Municipal de Cultura e Ministério da Cultura.',
      isDone: false,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. PAINEL INSTITUCIONAL UNIFICADO DA PNAB (IDENTIDADE #6A0DAD & #FF4500) */}
      <div className="bg-gradient-to-br from-[#1b0a2f] via-[#220d3a] to-[#120622] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
        {/* Background Graphic Accents */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-[#6A0DAD]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-[#FF4500]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-between gap-4">
          <div className="space-y-2.5 max-w-4xl">
            {/* Selos Institucionais Oficiais */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#6A0DAD]/30 text-purple-200 border border-purple-700/50 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-[#FF4500]" />
                Ministério da Cultura • Governo Federal
              </span>
              <span className="px-3 py-1 bg-purple-950/60 text-purple-200 border border-purple-700/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                Lei Federal nº 14.399/2022 • PNAB
              </span>
              <span className="px-3 py-1 bg-[#1e0e37] text-slate-200 border border-purple-800/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-purple-300" />
                Fundo Nacional de Cultura / Transferegov.br
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] tracking-tight text-white leading-snug">
              Política Nacional Aldir Blanc (PNAB) - Viamão
            </h1>

            {/* Resumo Jurídico e Contextual Conciso */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Programa continuado de fomento cultural da União (Lei nº 14.399/2022 e Decreto nº 11.740/2023) com repasses anuais Fundo a Fundo para editais e ações culturais no município de Viamão.
            </p>
          </div>
        </div>

        {/* Rodapé Oficial de Auditoria e Transparência */}
        <div className="mt-5 pt-4 border-t border-purple-900/40 flex items-start sm:items-center gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Recursos gerenciados via plataforma oficial <strong>Transferegov.br</strong> e auditados com controle social do Conselho Municipal de Cultura.
          </span>
        </div>
      </div>

      {/* 2. PAINEL OFICIAL PNAB (MINISTÉRIO DA CULTURA) - IFRAME POWERBI & TUTORIAL DO CIDADÃO */}
      <div className="bg-[#150b24] rounded-3xl p-4 sm:p-6 lg:p-8 border border-purple-900/40 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-900/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#6A0DAD]/30 text-purple-200 text-[11px] font-bold rounded-full border border-purple-700/50 uppercase tracking-wider">
                Painel Interativo MinC
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-['Outfit'] text-white">
              Painel Oficial PNAB (Ministério da Cultura)
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Consulta direta e navegação interativa aos indicadores nacionais, estaduais e municipais da Política Nacional Aldir Blanc.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMostrarGuiaDetalhado(!mostrarGuiaDetalhado)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1e1037] hover:bg-purple-900/40 text-purple-200 rounded-xl text-xs font-bold transition-all border border-purple-800/40"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>{mostrarGuiaDetalhado ? 'Ocultar Tutorial' : 'Como Encontrar a Verba'}</span>
              {mostrarGuiaDetalhado ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            <a
              href="https://app.powerbi.com/view?r=eyJrIjoiNGRjYmNkY2EtMTBlMC00NWE5LWFjZTctNzJhMTc4NjQ0NDAzIiwidCI6IjM4MDkwN2ZiLTBlYTYtNDQ5Yi04OGExLWI3NTc1YTcwZDBmNCJ9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1e1037] hover:bg-purple-900/40 text-purple-200 rounded-xl text-xs font-semibold transition-all border border-purple-800/40"
            >
              <span>Abrir em Nova Aba</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* TUTORIAL SIMPLES & RESUMIDO PARA QUALQUER CIDADÃO */}
        {mostrarGuiaDetalhado && (
          <div className="bg-gradient-to-br from-[#1e0e37] via-[#160a28] to-[#1e0e37] rounded-2xl border border-purple-900/50 p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-900/30 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FF4500] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-['Outfit']">
                    Passo a Passo: Como Consultar a Verba de Viamão no Painel
                  </h4>
                  <p className="text-[11px] text-purple-300/70">
                    Guia rápido, simples e direto para qualquer cidadão auditar os recursos da PNAB.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200 bg-[#6A0DAD]/40 px-2 py-0.5 rounded-md border border-purple-700/40 self-start sm:self-auto">
                4 Passos Simples
              </span>
            </div>

            {/* Grid dos 4 Passos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Passo 1 */}
              <div className="bg-[#150b24] p-3.5 rounded-xl border border-purple-900/40 shadow-2xs space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <Filter className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Escolha o Estado (UF)</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    No topo ou na aba de filtros do painel abaixo, clique na caixa de <strong>UF</strong> e selecione <strong>RS</strong> (Rio Grande do Sul).
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-900/30 text-[10px] font-semibold text-[#FF4500]">
                  ✓ Filtra os municípios gaúchos
                </div>
              </div>

              {/* Passo 2 */}
              <div className="bg-[#150b24] p-3.5 rounded-xl border border-purple-900/40 shadow-2xs space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <Search className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Selecione Viamão</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    No campo <strong>Município</strong>, role a lista ou digite <strong>Viamão</strong> e marque a caixa de seleção.
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-900/30 text-[10px] font-semibold text-[#FF4500]">
                  ✓ Isola os dados da nossa cidade
                </div>
              </div>

              {/* Passo 3 */}
              <div className="bg-[#150b24] p-3.5 rounded-xl border border-purple-900/40 shadow-2xs space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <Coins className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Veja o Valor Transferido</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Observe os cartões centrais: você verá o valor exato repassado pelo Governo Federal ao <strong>Fundo Municipal de Cultura</strong>.
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-900/30 text-[10px] font-semibold text-[#FF4500]">
                  ✓ Repasse oficial Fundo a Fundo
                </div>
              </div>

              {/* Passo 4 */}
              <div className="bg-[#150b24] p-3.5 rounded-xl border border-purple-900/40 shadow-2xs space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <FileText className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Navegue pelas Abas</h5>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Na barra inferior do Power BI (setas de páginas), navegue para conferir o <strong>Plano de Ação</strong>, <strong>Metas</strong> e <strong>Editais</strong>.
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-900/30 text-[10px] font-semibold text-[#FF4500]">
                  ✓ Detalhamento de metas e ações
                </div>
              </div>
            </div>

            {/* Dica Prática de Navegação */}
            <div className="bg-[#12071f] border border-purple-900/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
              <MousePointerClick className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-white">Dica de Navegação no Power BI:</span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Para dar zoom ou visualizar em tela cheia, use o botão no canto inferior direito do painel ou clique em <strong>"Abrir em Nova Aba"</strong> acima.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Container do Iframe com Altura de 700px e Scrolling */}
        <div className="w-full bg-[#10071e] rounded-2xl overflow-hidden border border-purple-900/40 shadow-inner">
          <iframe
            src="https://app.powerbi.com/view?r=eyJrIjoiNGRjYmNkY2EtMTBlMC00NWE5LWFjZTctNzJhMTc4NjQ0NDAzIiwidCI6IjM4MDkwN2ZiLTBlYTYtNDQ5Yi04OGExLWI3NTc1YTcwZDBmNCJ9"
            title="Painel Oficial PNAB (Ministério da Cultura)"
            className="w-full h-[700px] border-0"
            scrolling="yes"
            allowFullScreen
          />
        </div>
      </div>

      {/* 3. AVISO DE TRANSPARÊNCIA PÚBLICA & CONTA VINCULADA OFICIAL */}
      <div className="bg-[#150b24] rounded-3xl p-6 sm:p-8 border border-purple-900/40 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-white flex items-center gap-2.5">
              <Scale className="w-6 h-6 text-[#FF4500]" />
              Transparência Pública e Regramento de Custódia Financeira
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Diretrizes de movimentação fiduciária e gestão de recursos descentralizados em âmbito municipal.
            </p>
          </div>
          <div className="shrink-0">
            <span className="px-3 py-1.5 bg-[#6A0DAD]/30 text-purple-200 border border-purple-700/50 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF4500]" />
              Conta Vinculada Transferegov
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#1a0c30] rounded-2xl border border-purple-900/40 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Building2 className="w-4 h-4 text-[#FF4500]" />
              Titularidade Pública
            </div>
            <p className="text-slate-300 leading-relaxed">
              Recursos creditados estritamente na <strong>conta corrente fiduciária vinculada</strong> do <strong>Fundo Municipal de Cultura de Viamão</strong>, aberta exclusivamente para a finalidade da PNAB.
            </p>
          </div>

          <div className="p-4 bg-[#1a0c30] rounded-2xl border border-purple-900/40 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Landmark className="w-4 h-4 text-purple-400" />
              Aplicação Fiduciária Automática
            </div>
            <p className="text-slate-300 leading-relaxed">
              Por determinação do Decreto nº 11.740/2023, os saldos em conta mantêm-se em <strong>aplicação financeira oficial lastreada</strong>, cujos rendimentos revertem compulsoriamente aos editais culturais.
            </p>
          </div>

          <div className="p-4 bg-[#1a0c30] rounded-2xl border border-purple-900/40 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Fiscalização e Auditoria
            </div>
            <p className="text-slate-300 leading-relaxed">
              Todos os lançamentos, empenhos e liquidações são rastreados pela <strong>Controladoria-Geral da União (CGU)</strong>, <strong>TCU</strong>, <strong>MinC</strong> e pelo <strong>Conselho Municipal de Cultura</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-[#1f0d36] border border-purple-800/40 rounded-2xl text-xs text-purple-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#FF4500] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Aviso de Transparência Institucional:</strong> A movimentação e a conciliação dos recursos da PNAB ocorrem exclusivamente na conta específica vinculada do município, conforme normativas do Ministério da Cultura e do sistema Transferegov.br. O detalhamento de extratos e desembolsos por edital é publicado em consonância com as fases do Plano Anual de Aplicação dos Recursos (PAAR).
          </div>
        </div>
      </div>

      {/* 4. LINHA DO TEMPO DA TRAMITAÇÃO NORMATIVA */}
      <div className="bg-[#150b24] rounded-3xl p-6 sm:p-8 border border-purple-900/40 shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#FF4500]" />
          Linha do Tempo da Tramitação da PNAB em Viamão
        </h3>

        <div className="space-y-4 pt-2">
          {etapasTramitacao.map((etapa, idx) => (
            <div key={idx} className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    etapa.isDone
                      ? 'bg-[#6A0DAD] text-white border-2 border-purple-400'
                      : etapa.isCurrent
                      ? 'bg-[#FF4500] text-white border-2 border-orange-400 animate-pulse'
                      : 'bg-[#1e0e37] text-purple-400 border-2 border-purple-900'
                  }`}
                >
                  {etapa.isDone ? '✓' : idx + 1}
                </div>
                {idx < etapasTramitacao.length - 1 && (
                  <div className="w-0.5 h-12 bg-purple-900/60 my-1"></div>
                )}
              </div>

              <div className="bg-[#1a0c30] p-4 rounded-2xl border border-purple-900/40 text-xs w-full">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-white text-sm">{etapa.titulo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300/70 font-medium">{etapa.data}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        etapa.isDone
                          ? 'bg-purple-950/70 text-purple-200 border border-purple-800/40'
                          : etapa.isCurrent
                          ? 'bg-orange-950/80 text-orange-300 border border-orange-800/40'
                          : 'bg-purple-900/30 text-purple-400'
                      }`}
                    >
                      {etapa.status}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed">{etapa.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
