import React from 'react';
import {
  Landmark,
  ShieldCheck,
  ExternalLink,
  Clock,
  FileSearch,
  Scale,
  Info,
  Building2,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react';
import { PnabRecord } from '../types/culture';
import { InstitutionalValidationBadge } from './InstitutionalValidationBadge';
import { OFFICIAL_VIAMAO_CNPJ } from '../utils/institutionalValidation';

interface PnabAuditoriaSectionProps {
  pnabList: PnabRecord[];
}

export const PnabAuditoriaSection: React.FC<PnabAuditoriaSectionProps> = ({ pnabList }) => {
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
      {/* 1. PAINEL INSTITUCIONAL UNIFICADO DA PNAB (PADRÃO VISUAL DO FAC) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0a2f1d] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
        {/* Background Graphic Accents */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            {/* Selos Institucionais Oficiais */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-emerald-300" />
                Ministério da Cultura • Governo Federal
              </span>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                Lei Federal nº 14.399/2022 • PNAB
              </span>
              <span className="px-3 py-1 bg-slate-500/20 text-slate-200 border border-slate-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-slate-300" />
                Fundo Nacional de Cultura / Transferegov.br
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Outfit'] tracking-tight text-white leading-tight">
              Política Nacional Aldir Blanc (PNAB) - Viamão
            </h1>

            {/* Resumo Jurídico e Contextual */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              A <strong className="text-white">Política Nacional Aldir Blanc de Fomento à Cultura (PNAB)</strong>, instituída pela{' '}
              <strong className="text-white">Lei Federal nº 14.399/2022</strong> e regulamentada pelo{' '}
              <strong className="text-white">Decreto Federal nº 11.740/2023</strong>, constitui o maior programa estruturante e continuado de descentralização cultural da história brasileira. Financiada pela União através de transferências anuais Fundo a Fundo aos municípios e estados, a política garante investimentos plurianuais para impulsionar editais locais, fortalecer a infraestrutura artística e democratizar o acesso à produção cultural em Viamão.
            </p>
          </div>

          {/* Botões de Acesso aos Portais Oficiais */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href="https://cultbr.cultura.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#15803d] hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-950/40 border border-emerald-400/30 group"
            >
              <span>Consultar Painel CultBR Editais</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href="https://portal.transferegov.sistema.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 group"
            >
              <span>Acessar Transferegov.br</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Rodapé Oficial de Auditoria e Transparência */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-start sm:items-center gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Nota Oficial de Auditoria & Transparência:</strong> Os recursos transferidos da União são auditados e acompanhados em conformidade com as regras federais da Lei nº 14.399/2022 e Decreto nº 11.740/2023. Toda gestão, lançamento de editais e prestação de contas operam via plataforma oficial <strong>Transferegov.br</strong> e sob controle social do Conselho Municipal de Cultura.
          </span>
        </div>
      </div>

      {/* 2. AVISO DE TRANSPARÊNCIA PÚBLICA & CONTA VINCULADA OFICIAL (EM SUBSTITUIÇÃO A DADOS BANCÁRIOS NÃO HOMOLOGADOS) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit'] text-slate-900 flex items-center gap-2.5">
              <Scale className="w-6 h-6 text-emerald-700" />
              Transparência Pública e Regramento de Custódia Financeira
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Diretrizes de movimentação fiduciária e gestão de recursos descentralizados em âmbito municipal.
            </p>
          </div>
          <div className="shrink-0">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Conta Vinculada Transferegov
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Building2 className="w-4 h-4 text-emerald-700" />
              Titularidade Pública
            </div>
            <p className="text-slate-600 leading-relaxed">
              Recursos creditados estritamente na <strong>conta corrente fiduciária vinculada</strong> do <strong>Fundo Municipal de Cultura de Viamão</strong>, aberta exclusivamente para a finalidade da PNAB.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <Landmark className="w-4 h-4 text-blue-700" />
              Aplicação Fiduciária Automática
            </div>
            <p className="text-slate-600 leading-relaxed">
              Por determinação do Decreto nº 11.740/2023, os saldos em conta mantêm-se em <strong>aplicação financeira oficial lastreada</strong>, cujos rendimentos revertem compulsoriamente aos editais culturais.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Fiscalização e Auditoria
            </div>
            <p className="text-slate-600 leading-relaxed">
              Todos os lançamentos, empenhos e liquidações são rastreados pela <strong>Controladoria-Geral da União (CGU)</strong>, <strong>TCU</strong>, <strong>MinC</strong> e pelo <strong>Conselho Municipal de Cultura</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs text-emerald-950 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Aviso de Transparência Institucional:</strong> A movimentação e a conciliação dos recursos da PNAB ocorrem exclusivamente na conta específica vinculada do município, conforme normativas do Ministério da Cultura e do sistema Transferegov.br. O detalhamento de extratos e desembolsos por edital é publicado em consonância com as fases do Plano Anual de Aplicação dos Recursos (PAAR).
          </div>
        </div>
      </div>

      {/* 3. GUIA RÁPIDO DE AUDITORIA CIDADÃ NO TRANSFEREGOV.BR */}
      <div className="bg-blue-50/80 border-l-4 border-l-blue-600 border border-blue-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl shrink-0 mt-0.5">
            <FileSearch className="w-5 h-5" />
          </div>
          <div className="space-y-4 w-full">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-blue-950 font-['Outfit']">
                🔎 Guia de Auditoria Cidadã no Transferegov.br
              </h3>
              <p className="text-xs text-blue-900/80 mt-0.5 leading-relaxed">
                Qualquer cidadão, artista ou conselheiro pode fiscalizar o Termo de Adesão oficial da PNAB e o Plano de Ação diretamente no sistema público federal. Siga o passo a passo:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">1</span>
                  Acesse o Portal Transferegov
                </span>
                <p className="text-slate-600 pl-6">
                  No menu de <strong>Acesso Livre</strong> (sem necessidade de senha), clique na opção <strong>Consulta Convênios / Pré-Convênios / Termos de Adesão</strong>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">2</span>
                  Insira o CNPJ do Município
                </span>
                <div className="pl-6">
                  <InstitutionalValidationBadge
                    cnpj={pnabPrincipal.cnpj_destinatario}
                    enteNome="Município de Viamão"
                    showDetails={false}
                  />
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">3</span>
                  Filtre pelo Órgão Concedente (MinC)
                </span>
                <p className="text-slate-600 pl-6">
                  No campo Órgão, filtre por <strong>Ministério da Cultura (Código 42000)</strong> para localizar o Termo de Adesão oficial registrado no Transferegov.
                </p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs space-y-1.5 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[11px]">4</span>
                    Consulte Extratos e Movimentação
                  </span>
                  <p className="text-slate-600 pl-6">
                    Acesse a aba <strong>Movimentação Financeira</strong> para auditar os lançamentos e extratos bancários da conta vinculada.
                  </p>
                </div>
                <div className="pl-6 pt-1">
                  <a
                    href="https://portal.transferegov.sistema.gov.br/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    <span>Abrir Portal Transferegov Oficial</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LINHA DO TEMPO DA TRAMITAÇÃO NORMATIVA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-700" />
          Linha do Tempo da Tramitação da PNAB em Viamão
        </h3>

        <div className="space-y-4 pt-2">
          {etapasTramitacao.map((etapa, idx) => (
            <div key={idx} className="flex items-start gap-3 relative">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    etapa.isDone
                      ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500'
                      : etapa.isCurrent
                      ? 'bg-amber-100 text-amber-800 border-2 border-amber-500 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-300'
                  }`}
                >
                  {etapa.isDone ? '✓' : idx + 1}
                </div>
                {idx < etapasTramitacao.length - 1 && (
                  <div className="w-0.5 h-12 bg-slate-200 my-1"></div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs w-full">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-slate-900 text-sm">{etapa.titulo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">{etapa.data}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        etapa.isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : etapa.isCurrent
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {etapa.status}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed">{etapa.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
