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

export const PnabAuditoriaSection: React.FC = () => {
  const [mostrarGuiaDetalhado, setMostrarGuiaDetalhado] = useState<boolean>(false);

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
    <div className="space-y-6 pb-12">
      {/* 1. PAINEL INSTITUCIONAL UNIFICADO DA PNAB */}
      <div className="bg-[#2D0652] rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-[#3D0B6D]">
        <div className="relative z-10 flex flex-col justify-between gap-4">
          <div className="space-y-3 max-w-4xl">
            {/* Selos Institucionais */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#6A0DAD] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-purple-400/30">
                <Landmark className="w-3.5 h-3.5 text-[#FF4500]" />
                Ministério da Cultura • Governo Federal
              </span>
              <span className="px-3 py-1 bg-white/10 text-purple-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-white/15">
                <ShieldCheck className="w-3.5 h-3.5 text-white/70" />
                Lei Federal nº 14.399/2022 • PNAB
              </span>
              <span className="px-3 py-1 bg-[#FFE8E0] text-[#FF4500] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-[#FF4500]/40">
                <FileCheck2 className="w-3.5 h-3.5 text-[#FF4500]" />
                Fundo Nacional de Cultura / Transferegov.br
              </span>
            </div>

            {/* Título Principal */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
              Política Nacional Aldir Blanc (PNAB) · Viamão
            </h1>

            <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed font-medium">
              Programa continuado de fomento cultural da União (Lei nº 14.399/2022 e Decreto nº 11.740/2023) com repasses anuais Fundo a Fundo para editais e ações culturais no município de Viamão.
            </p>
          </div>
        </div>

        {/* Rodapé Oficial de Auditoria */}
        <div className="mt-5 pt-4 border-t border-purple-400/20 flex items-start sm:items-center gap-2.5 text-xs text-purple-200">
          <Info className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            Recursos gerenciados via plataforma oficial <strong>Transferegov.br</strong> e auditados com controle social do Conselho Municipal de Cultura.
          </span>
        </div>
      </div>

      {/* 2. PAINEL OFICIAL PNAB (MINISTÉRIO DA CULTURA) - IFRAME POWERBI */}
      <div className="bg-[#FAF4EB] rounded-3xl p-5 sm:p-7 border border-[#E2D2BC] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2D2BC]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 bg-[#EFE6FD] text-[#6A0DAD] text-[11px] font-bold rounded-full border border-[#DCC7FB] uppercase tracking-wider">
                Painel Interativo MinC
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
              Painel Oficial PNAB (Ministério da Cultura)
            </h3>
            <p className="text-xs sm:text-sm text-[#2D0652]/75 mt-0.5 font-medium">
              Consulta direta e navegação interativa aos indicadores nacionais, estaduais e municipais da Política Nacional Aldir Blanc.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMostrarGuiaDetalhado(!mostrarGuiaDetalhado)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F5EAD8] text-[#2D0652] rounded-full text-xs font-bold transition-all border border-[#E2D2BC] cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>{mostrarGuiaDetalhado ? 'Ocultar Tutorial' : 'Como Encontrar a Verba'}</span>
              {mostrarGuiaDetalhado ? (
                <ChevronUp className="w-3.5 h-3.5 text-[#6A0DAD]" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-[#6A0DAD]" />
              )}
            </button>

            <a
              href="https://app.powerbi.com/view?r=eyJrIjoiNGRjYmNkY2EtMTBlMC00NWE5LWFjZTctNzJhMTc4NjQ0NDAzIiwidCI6IjM4MDkwN2ZiLTBlYTYtNDQ5Yi04OGExLWI3NTc1YTcwZDBmNCJ9"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6A0DAD] hover:bg-[#580B91] text-white rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Abrir em Nova Aba</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* TUTORIAL */}
        {mostrarGuiaDetalhado && (
          <div className="bg-white rounded-2xl border border-[#E2D2BC] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D2BC] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FFE8E0] text-[#FF4500] flex items-center justify-center font-bold text-xs shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
                    Passo a Passo: Como Consultar a Verba de Viamão no Painel
                  </h4>
                  <p className="text-xs text-[#2D0652]/70">
                    Guia rápido, simples e direto para qualquer cidadão auditar os recursos da PNAB.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6A0DAD] bg-[#EFE6FD] px-2.5 py-0.5 rounded-full border border-[#DCC7FB]">
                4 Passos Simples
              </span>
            </div>

            {/* Grid dos 4 Passos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Passo 1 */}
              <div className="bg-[#FAF4EB] p-4 rounded-2xl border border-[#E2D2BC] space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      1
                    </span>
                    <Filter className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-[#2D0652]">Escolha o Estado (UF)</h5>
                  <p className="text-xs text-[#2D0652]/80 leading-relaxed">
                    No topo ou na aba de filtros do painel abaixo, clique na caixa de <strong>UF</strong> e selecione <strong>RS</strong> (Rio Grande do Sul).
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E2D2BC] text-[10px] font-bold text-[#FF4500]">
                  ✓ Filtra os municípios gaúchos
                </div>
              </div>

              {/* Passo 2 */}
              <div className="bg-[#FAF4EB] p-4 rounded-2xl border border-[#E2D2BC] space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      2
                    </span>
                    <Search className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-[#2D0652]">Selecione Viamão</h5>
                  <p className="text-xs text-[#2D0652]/80 leading-relaxed">
                    No campo <strong>Município</strong>, role a lista ou digite <strong>Viamão</strong> e marque a caixa de seleção.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E2D2BC] text-[10px] font-bold text-[#FF4500]">
                  ✓ Isola os dados da nossa cidade
                </div>
              </div>

              {/* Passo 3 */}
              <div className="bg-[#FAF4EB] p-4 rounded-2xl border border-[#E2D2BC] space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      3
                    </span>
                    <Coins className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-[#2D0652]">Veja o Valor Transferido</h5>
                  <p className="text-xs text-[#2D0652]/80 leading-relaxed">
                    Observe os cartões centrais: você verá o valor exato repassado pelo Governo Federal ao <strong>Fundo Municipal de Cultura</strong>.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E2D2BC] text-[10px] font-bold text-[#FF4500]">
                  ✓ Repasse oficial Fundo a Fundo
                </div>
              </div>

              {/* Passo 4 */}
              <div className="bg-[#FAF4EB] p-4 rounded-2xl border border-[#E2D2BC] space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#6A0DAD] text-white font-bold text-xs flex items-center justify-center">
                      4
                    </span>
                    <FileText className="w-4 h-4 text-[#FF4500]" />
                  </div>
                  <h5 className="text-xs font-bold text-[#2D0652]">Navegue pelas Abas</h5>
                  <p className="text-xs text-[#2D0652]/80 leading-relaxed">
                    Na barra inferior do Power BI (setas de páginas), navegue para conferir o <strong>Plano de Ação</strong>, <strong>Metas</strong> e <strong>Editais</strong>.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E2D2BC] text-[10px] font-bold text-[#FF4500]">
                  ✓ Detalhamento de metas e ações
                </div>
              </div>
            </div>

            {/* Dica Prática */}
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-2xl p-3 flex items-start gap-2.5 text-xs text-[#2D0652]">
              <MousePointerClick className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-[#2D0652]">Dica de Navegação:</span>
                <p className="text-xs text-[#2D0652]/80 leading-relaxed">
                  Para dar zoom ou visualizar em tela cheia, use o botão no canto inferior direito do painel ou clique em <strong>"Abrir em Nova Aba"</strong> acima.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Container do Iframe */}
        <div className="w-full bg-white rounded-2xl overflow-hidden border border-[#E2D2BC] shadow-inner">
          <iframe
            src="https://app.powerbi.com/view?r=eyJrIjoiNGRjYmNkY2EtMTBlMC00NWE5LWFjZTctNzJhMTc4NjQ0NDAzIiwidCI6IjM4MDkwN2ZiLTBlYTYtNDQ5Yi04OGExLWI3NTc1YTcwZDBmNCJ9"
            title="Painel Oficial PNAB (Ministério da Cultura)"
            className="w-full h-[700px] border-0"
            scrolling="yes"
            allowFullScreen
          />
        </div>
      </div>

      {/* 3. AVISO DE TRANSPARÊNCIA PÚBLICA & CONTA VINCULADA */}
      <div className="bg-[#FAF4EB] rounded-3xl p-6 sm:p-8 border border-[#E2D2BC] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2D2BC]">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2D0652] flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
              <Scale className="w-6 h-6 text-[#FF4500]" />
              Transparência Pública e Regramento de Custódia Financeira
            </h2>
            <p className="text-xs sm:text-sm text-[#2D0652]/75 mt-1 font-medium">
              Diretrizes de movimentação fiduciária e gestão de recursos descentralizados em âmbito municipal.
            </p>
          </div>
          <div className="shrink-0">
            <span className="px-3.5 py-1.5 bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB] rounded-full text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#FF4500]" />
              Conta Vinculada Transferegov
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-5 bg-white rounded-2xl border border-[#E2D2BC] space-y-2">
            <div className="flex items-center gap-2 text-[#2D0652] font-bold text-sm">
              <Building2 className="w-4 h-4 text-[#FF4500]" />
              Titularidade Pública
            </div>
            <p className="text-[#2D0652]/80 leading-relaxed font-normal">
              Recursos creditados estritamente na <strong>conta corrente fiduciária vinculada</strong> do <strong>Fundo Municipal de Cultura de Viamão</strong>, aberta exclusivamente para a finalidade da PNAB.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E2D2BC] space-y-2">
            <div className="flex items-center gap-2 text-[#2D0652] font-bold text-sm">
              <Landmark className="w-4 h-4 text-[#6A0DAD]" />
              Aplicação Fiduciária Automática
            </div>
            <p className="text-[#2D0652]/80 leading-relaxed font-normal">
              Por determinação do Decreto nº 11.740/2023, os saldos em conta mantêm-se em <strong>aplicação financeira oficial lastreada</strong>, cujos rendimentos revertem compulsoriamente aos editais culturais.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E2D2BC] space-y-2">
            <div className="flex items-center gap-2 text-[#2D0652] font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Fiscalização e Auditoria
            </div>
            <p className="text-[#2D0652]/80 leading-relaxed font-normal">
              Todos os lançamentos, empenhos e liquidações são rastreados pela <strong>Controladoria-Geral da União (CGU)</strong>, <strong>TCU</strong>, <strong>MinC</strong> e pelo <strong>Conselho Municipal de Cultura</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 bg-white border border-[#E2D2BC] rounded-2xl text-xs text-[#2D0652] flex items-start gap-3">
          <Info className="w-5 h-5 text-[#FF4500] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Aviso de Transparência Institucional:</strong> A movimentação e a conciliação dos recursos da PNAB ocorrem exclusivamente na conta específica vinculada do município, conforme normativas do Ministério da Cultura e do sistema Transferegov.br. O detalhamento de extratos e desembolsos por edital é publicado em consonância com as fases do Plano Anual de Aplicação dos Recursos (PAAR).
          </div>
        </div>
      </div>

      {/* 4. LINHA DO TEMPO DA TRAMITAÇÃO */}
      <div className="bg-[#FAF4EB] rounded-3xl p-6 sm:p-8 border border-[#E2D2BC] shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-[#2D0652] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
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
                      ? 'bg-[#6A0DAD] text-white border-2 border-[#DCC7FB]'
                      : etapa.isCurrent
                      ? 'bg-[#FF4500] text-white border-2 border-orange-300 animate-pulse'
                      : 'bg-white text-[#2D0652] border-2 border-[#E2D2BC]'
                  }`}
                >
                  {etapa.isDone ? '✓' : idx + 1}
                </div>
                {idx < etapasTramitacao.length - 1 && (
                  <div className="w-0.5 h-12 bg-[#E2D2BC] my-1"></div>
                )}
              </div>

              <div className="bg-white p-4 rounded-2xl border border-[#E2D2BC] text-xs w-full shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-[#2D0652] text-sm">{etapa.titulo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#2D0652]/70 font-semibold">{etapa.data}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                        etapa.isDone
                          ? 'bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB]'
                          : etapa.isCurrent
                          ? 'bg-[#FFE8E0] text-[#D33600] border border-[#FFC2B2]'
                          : 'bg-[#FAF4EB] text-[#2D0652] border border-[#E2D2BC]'
                      }`}
                    >
                      {etapa.status}
                    </span>
                  </div>
                </div>
                <p className="text-[#2D0652]/80 leading-relaxed font-normal">{etapa.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
