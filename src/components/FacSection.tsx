import React, { useState, useMemo } from 'react';
import {
  Landmark,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Building2,
  Scale,
  Search,
  Layers,
  HelpCircle,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  ArrowRight,
  Info,
  BadgeCheck,
  Users,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { FacEdital } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface FacSectionProps {
  editais: FacEdital[];
  isLoading?: boolean;
  onNavigateToTab?: (tabId: string) => void;
}

export const FacSection: React.FC<FacSectionProps> = ({ editais, isLoading, onNavigateToTab }) => {
  // Filtros de busca
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroSegmento, setFiltroSegmento] = useState<string>('todos');
  const [editalExpandido, setEditalExpandido] = useState<string | null>(null);

  // Estado do Verificador de Elegibilidade Interativo
  const [checkCnpj, setCheckCnpj] = useState<boolean>(false);
  const [checkSedeRs, setCheckSedeRs] = useState<boolean>(false);
  const [checkCadastroProcultura, setCheckCadastroProcultura] = useState<boolean>(false);
  const [checkAtuacaoCultural, setCheckAtuacaoCultural] = useState<boolean>(false);
  const [checkContrapartida, setCheckContrapartida] = useState<boolean>(false);

  // Lista de segmentos disponíveis
  const segmentos = useMemo(() => {
    const list = Array.from(new Set(editais.map(e => e.segmento)));
    return ['todos', ...list];
  }, [editais]);

  // Editais filtrados
  const editaisFiltrados = useMemo(() => {
    return editais.filter(ed => {
      const matchBusca =
        ed.nome.toLowerCase().includes(busca.toLowerCase()) ||
        ed.numero_edital.toLowerCase().includes(busca.toLowerCase()) ||
        ed.segmento.toLowerCase().includes(busca.toLowerCase()) ||
        ed.publico_alvo.toLowerCase().includes(busca.toLowerCase());

      const matchStatus = filtroStatus === 'todos' || ed.status === filtroStatus;
      const matchSegmento = filtroSegmento === 'todos' || ed.segmento === filtroSegmento;

      return matchBusca && matchStatus && matchSegmento;
    });
  }, [editais, busca, filtroStatus, filtroSegmento]);

  // Cálculo da pontuação de elegibilidade
  const totalChecados = [
    checkCnpj,
    checkSedeRs,
    checkCadastroProcultura,
    checkAtuacaoCultural,
    checkContrapartida,
  ].filter(Boolean).length;

  const estaTotalmenteApto = totalChecados === 5;

  return (
    <div className="space-y-8 pb-12">
      {/* 1. HEADER INSTITUCIONAL: SEDAC-RS & PRÓ-CULTURA RS */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0f2854] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800/40">
        {/* Background Graphic Accents */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-200 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-300" />
                Governo do Estado do Rio Grande do Sul
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                SEDAC-RS • Pró-cultura RS
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['Outfit'] tracking-tight text-white leading-tight">
              Fundo de Apoio à Cultura (FAC)
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Mecanismo estadual de fomento direto e financiamento a fundo perdido administrado pela{' '}
              <strong className="text-white">Secretaria de Estado da Cultura do RS (SEDAC-RS)</strong>. 
              Centralizado exclusivamente através do portal oficial do{' '}
              <strong className="text-white">Pró-cultura RS</strong> para o fomento a projetos de fazedores de cultura, coletivos e municípios gaúchos.
            </p>
          </div>

          {/* Botões de Acesso aos Portais Oficiais */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <a
              href="https://www.procultura.rs.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#1e40af] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-900/30 border border-blue-400/30 group"
            >
              <span>Portal Pró-cultura RS</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <a
              href="https://cultura.rs.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition-all border border-white/20 group"
            >
              <span>Portal da SEDAC-RS</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Alerta de Fonte Oficial Exclusiva */}
        <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-start sm:items-center gap-3 text-xs text-slate-300">
          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>Fonte Oficial e Centralizada:</strong> Toda consulta de editais, cronogramas, retificações, inscrições e prestação de contas do FAC e da LIC ocorre <strong>exclusivamente</strong> através do portal unificado <strong>www.procultura.rs.gov.br</strong> e do portal da SEDAC (<strong>cultura.rs.gov.br</strong>).
          </span>
        </div>
      </div>

      {/* 2. REQUISITOS GERAIS DE ELEGIBILIDADE PARA O FAC (DIRETRIZ TÉCNICA ESTRITA) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
              <h2 className="text-lg sm:text-xl font-bold font-['Outfit'] text-slate-900">
                Requisitos Obrigatórios de Elegibilidade para o FAC
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Diretrizes estritas da SEDAC-RS para submissão e admissibilidade de projetos culturais
            </p>
          </div>
        </div>

        {/* 3 Cartões de Requisitos Estritos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Exigência de CNPJ e Sede no RS */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1e40af] flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Pessoa Jurídica (CNPJ Ativo no RS)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O proponente deve atuar comprovadamente na área cultural e possuir{' '}
                <strong className="text-slate-900">CNPJ ativo (incluindo MEI)</strong> com sede fiscal no{' '}
                <strong className="text-slate-900">Rio Grande do Sul</strong>.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 font-medium">
              ⚠️ <strong>Vedação Expressa:</strong> Não são contemplados projetos para Pessoa Física pura nos editais do FAC.
            </div>
          </div>

          {/* Card 2: Cadastro no Pró-cultura RS */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#15803d] flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Cadastro Homologado no Pró-cultura RS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                É obrigatório estar previamente cadastrado e com documentos institucionais, fiscais e certidões negativas regulares no{' '}
                <strong className="text-slate-900">Sistema Unificado Pró-cultura RS</strong> antes da abertura das inscrições.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
              ✓ <strong>Dica Prática:</strong> Faça a validação do perfil jurídico semanas antes do encerramento dos prazos.
            </div>
          </div>

          {/* Card 3: Conformidade Técnica & Contrapartida */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-sm font-['Outfit']">
                Especificações Técnicas e Contrapartida
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Atendimento rigoroso às diretrizes técnicas de cada edital específico da SEDAC, incluindo planilha orçamentária referencial, cronograma factível e{' '}
                <strong className="text-slate-900">contrapartida social gratuita</strong> na comunidade.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-medium">
              📋 <strong>Contrapartida:</strong> Obrigatoriedade de ações formativas ou difusão sem custos para a sociedade.
            </div>
          </div>
        </div>
      </div>

      {/* 3. COMPARATIVO ESSENCIAL: FAC vs. LIC (MECANISMOS DA SEDAC-RS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FAC */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-200 shadow-xs space-y-4 relative overflow-hidden">
          <div className="h-2 w-full bg-[#1e40af] absolute top-0 left-0"></div>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#1e40af] uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Repasse Fundo a Fundo / Direto
              </span>
              <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">
                FAC – Fundo de Apoio à Cultura
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1e40af] flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Financiamento <strong>a fundo perdido</strong>. O Estado do RS, por meio da SEDAC-RS, transfere o valor integral aprovado diretamente para conta específica aberta no Banrisul em nome do projeto.
          </p>

          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
              <span><strong>Não exige captação externa:</strong> Recursos garantidos pelo tesouro estadual.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
              <span><strong>Exigência:</strong> CNPJ ativo cultural no RS (PF pura não contemplada).</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" />
              <span><strong>Inscrição:</strong> Via editais setoriais no Pró-cultura RS.</span>
            </div>
          </div>
        </div>

        {/* LIC */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-purple-200 shadow-xs space-y-4 relative overflow-hidden">
          <div className="h-2 w-full bg-purple-600 absolute top-0 left-0"></div>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                Incentivo Fiscal Estadual (ICMS)
              </span>
              <h3 className="text-xl font-bold font-['Outfit'] text-slate-900">
                LIC – Lei de Incentivo à Cultura RS
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Mecanismo de <strong>renúncia fiscal de ICMS</strong>. O proponente aprova o mérito cultural na SEDAC-RS e recebe autorização para buscar patrocínio junto a empresas contribuintes de ICMS no Rio Grande do Sul.
          </p>

          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span><strong>Mecanismo de Mecenato:</strong> Abatimento direto no ICMS devido pela patrocinadora.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span><strong>Submissão contínua ou por chamamento:</strong> Plataforma Pró-cultura RS.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span><strong>Proponente:</strong> Exige habilitação jurídica e CEPC no Pró-cultura RS.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. VERIFICADOR INTERATIVO DE ELEGIBILIDADE DO PROPONENTE (CHECKLIST PRÁTICO) */}
      <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-[#1e40af]" />
              <h3 className="text-base sm:text-lg font-bold font-['Outfit'] text-slate-900">
                Checklist Interativo de Elegibilidade para o FAC
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Simule a aptidão documental da sua iniciativa para submissão aos editais da SEDAC-RS
            </p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                estaTotalmenteApto
                  ? 'bg-emerald-100 text-[#15803d] border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              {estaTotalmenteApto
                ? '✓ 100% Elegível para o FAC'
                : `${totalChecados} de 5 Requisitos Atendidos`}
            </span>
          </div>
        </div>

        {/* 5 Checkboxes Interativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={checkCnpj}
              onChange={e => setCheckCnpj(e.target.checked)}
              className="mt-0.5 rounded text-[#1e40af] focus:ring-blue-500 w-4 h-4 shrink-0"
            />
            <div>
              <span className="font-bold text-slate-800 block">1. CNPJ Cultural Ativo</span>
              <span className="text-slate-500 text-[11px]">Possuo CNPJ ativo (MEI, LTDA, EIRELI ou Associação Sem Fins Lucrativos).</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={checkSedeRs}
              onChange={e => setCheckSedeRs(e.target.checked)}
              className="mt-0.5 rounded text-[#1e40af] focus:ring-blue-500 w-4 h-4 shrink-0"
            />
            <div>
              <span className="font-bold text-slate-800 block">2. Sede no Rio Grande do Sul</span>
              <span className="text-slate-500 text-[11px]">Comprovação de domicílio fiscal no RS (Viamão é 100% elegível).</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={checkCadastroProcultura}
              onChange={e => setCheckCadastroProcultura(e.target.checked)}
              className="mt-0.5 rounded text-[#1e40af] focus:ring-blue-500 w-4 h-4 shrink-0"
            />
            <div>
              <span className="font-bold text-slate-800 block">3. Cadastro no Pró-cultura RS</span>
              <span className="text-slate-500 text-[11px]">Cadastro institucional ativo e homologado no portal procultura.rs.gov.br.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={checkAtuacaoCultural}
              onChange={e => setCheckAtuacaoCultural(e.target.checked)}
              className="mt-0.5 rounded text-[#1e40af] focus:ring-blue-500 w-4 h-4 shrink-0"
            />
            <div>
              <span className="font-bold text-slate-800 block">4. CNAE / Objeto Cultural</span>
              <span className="text-slate-500 text-[11px]">Contrato social ou certificado MEI prevê atividade cultural/artística.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={checkContrapartida}
              onChange={e => setCheckContrapartida(e.target.checked)}
              className="mt-0.5 rounded text-[#1e40af] focus:ring-blue-500 w-4 h-4 shrink-0"
            />
            <div>
              <span className="font-bold text-slate-800 block">5. Plano de Contrapartida Social</span>
              <span className="text-slate-500 text-[11px]">Previsão de oficinas, palestras ou ingressos gratuitos na rede pública.</span>
            </div>
          </label>

          {/* Card Resumo do Resultado */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-[#1e40af] block">Resultado da Análise</span>
              <span className="text-slate-600 text-[11px]">
                {estaTotalmenteApto
                  ? 'Apto a submeter projetos nas janelas abertas.'
                  : 'Necessário regularizar pendências assinaladas.'}
              </span>
            </div>
            <a
              href="https://www.procultura.rs.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 bg-[#1e40af] text-white font-bold rounded-lg text-[11px] hover:bg-blue-700 shrink-0 inline-flex items-center gap-1"
            >
              <span>Acessar Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* 5. RADAR TERRITORIAL: VIAMÃO NO ECOSSISTEMA DO FAC / SEDAC-RS */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#15803d] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#15803d] uppercase tracking-wider">
                Jurisdição Territorial Confirmada
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Macrorregião Metropolitana / RS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
              Viamão é 100% Elegível nos Editais do FAC / SEDAC-RS
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 max-w-3xl leading-relaxed">
              Diferente de editais municipais exclusivos como o <strong>Fumproarte (exclusivo de Porto Alegre)</strong>, os editais do <strong>FAC e Pró-cultura RS</strong> possuem abrangência estadual. Proponentes com sede e residência em <strong>Viamão</strong> competem em igualdade de condições nas cotas regionais da Região Metropolitana e Vale do Gravataí.
            </p>
          </div>
        </div>

        <a
          href="https://www.procultura.rs.gov.br/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#15803d] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
        >
          <span>Consultar Pró-cultura RS</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 6. CATÁLOGO OFICIAL DE MECANISMOS E EDITAIS DA SEDAC-RS (ANTI-ALUCINAÇÃO & TRANSPARÊNCIA) */}
      <div className="space-y-4">
        {/* Barra de Filtros e Busca */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e40af] animate-pulse"></span>
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl font-['Outfit']">
                Catálogo de Mecanismos e Editais SEDAC-RS
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mecanismos oficiais do Fundo de Apoio à Cultura (FAC) e Lei de Incentivo à Cultura (LIC-RS)
            </p>
          </div>

          {/* Filtros de Pesquisa */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar edital, segmento ou objeto..."
                className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-full sm:w-64 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="Sincronização pendente com o Pró-cultura RS">Sincronização pendente</option>
              <option value="Inscrições Abertas">Inscrições Abertas / Fluxo Contínuo</option>
              <option value="Em Avaliação">Em Avaliação</option>
              <option value="Homologado / Execução">Homologado / Execução</option>
              <option value="Previsto / Calendário">Previsto / Calendário</option>
            </select>
          </div>
        </div>

        {/* Listagem dos Editais e Mecanismos */}
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="bg-white rounded-2xl p-8 border border-blue-200 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-xs text-slate-600 font-semibold">Consultando editais do Pró-Cultura RS / FAC...</p>
            </div>
          ) : editaisFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-3">
              <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Nenhum mecanismo ou edital encontrado com os filtros atuais.</p>
              <button
                onClick={() => {
                  setBusca('');
                  setFiltroStatus('todos');
                  setFiltroSegmento('todos');
                }}
                className="text-xs text-[#1e40af] font-bold hover:underline"
              >
                Limpar filtros de busca
              </button>
            </div>
          ) : (
            editaisFiltrados.map(edital => {
              const isExpanded = editalExpandido === edital.id;
              const isPendente = edital.sincronizacao_pendente || edital.status === 'Sincronização pendente com o Pró-cultura RS';

              const statusBadge = isPendente ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-900 border-amber-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-amber-700 animate-spin" />
                  <span>Sincronização pendente com o Pró-cultura RS</span>
                </span>
              ) : edital.status === 'Inscrições Abertas' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-[#15803d] border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{edital.status}</span>
                </span>
              ) : edital.status === 'Em Avaliação' ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-blue-50 text-[#1e40af] border-blue-200">
                  {edital.status}
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200">
                  {edital.status}
                </span>
              );

              return (
                <div
                  key={edital.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all overflow-hidden"
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Header do Edital */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 text-[#1e40af] border border-blue-200">
                          {edital.numero_edital}
                        </span>
                        {statusBadge}
                        <span className="text-xs text-slate-500 font-medium">
                          {edital.segmento}
                        </span>
                      </div>

                      {/* Valores orçamentários oficiais */}
                      <div className="text-left sm:text-right">
                        <span className="text-xs text-slate-500 font-medium block">Teto por Projeto:</span>
                        {edital.valor_maximo_projeto && edital.valor_maximo_projeto > 0 ? (
                          <span className="text-sm sm:text-base font-bold text-[#15803d] font-mono">
                            {formatBRL(edital.valor_maximo_projeto)}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            Definido no Edital Oficial
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Título & Descrição */}
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900 font-['Outfit']">
                        {edital.nome}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Público-alvo: <strong>{edital.publico_alvo}</strong>
                      </p>
                    </div>

                    {/* Destaque da Exigência de Proponente (Estrito CNPJ RS) */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <ShieldCheck className="w-4 h-4 text-[#1e40af]" />
                        <span>Exigência do Proponente:</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pl-5">
                        {edital.exigencia_proponente}
                      </p>
                    </div>

                    {/* Aviso de sincronização se pendente */}
                    {isPendente && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex items-start gap-2 text-amber-900">
                        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <span>
                          <strong>Sincronização pendente com o Pró-cultura RS:</strong> Os dados detalhados deste chamamento devem ser consultados diretamente no portal oficial do Estado. Valores ou cronogramas não são gerados por estimativa.
                        </span>
                      </div>
                    )}

                    {/* Ações e Expandir */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Cronograma: <strong>{edital.prazo_inscricao}</strong></span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditalExpandido(isExpanded ? null : edital.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'Menos Detalhes' : 'Ver Requisitos'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <a
                          href={edital.link_oficial}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#1e40af] hover:bg-blue-700 text-white font-bold rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <span>Acessar no Pró-cultura RS</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Detalhes Expandidos (Requisitos e Contrapartida) */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-200 space-y-4 text-xs bg-blue-50/30 p-4 rounded-xl">
                        <div>
                          <span className="font-bold text-slate-900 block mb-2">Requisitos Específicos do Mecanismo:</span>
                          <ul className="space-y-1.5">
                            {edital.requisitos_principais.map((req, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d] shrink-0 mt-0.5" />
                                <span>{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="font-bold text-slate-900 block mb-1">Contrapartida Obrigatória:</span>
                          <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                            {edital.contrapartida_exigida}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-blue-100">
                          {edital.base_legal && (
                            <span>Base Legal: <strong>{edital.base_legal}</strong></span>
                          )}
                          <span>Plataforma Oficial: <strong>{edital.plataforma}</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 7. FLUXOGRAMA PASSO A PASSO NO PRÓ-CULTURA RS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg font-['Outfit']">
            Passo a Passo Oficial para Inscrição no Sistema Pró-cultura RS
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Roteiro obrigatório de conformidade administrativa antes da submissão eletrônica
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs">
              1
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Regularização de CNPJ</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Constitua ou regularize MEI ou PJ cultural com sede no Rio Grande do Sul e certidões negativas em dia.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs">
              2
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Cadastro Pró-cultura RS</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Acesse <strong>www.procultura.rs.gov.br</strong>, crie o login institucional e anexe os documentos societários e fiscais.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs">
              3
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Estruturação do Projeto</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Elabore o plano de trabalho, orçamento conforme tabela referencial da SEDAC, cronograma e plano de contrapartida.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="w-7 h-7 rounded-full bg-[#1e40af] text-white flex items-center justify-center font-bold text-xs">
              4
            </span>
            <h4 className="font-bold text-slate-900 text-xs">Envio e Acompanhamento</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Envie a proposta antes do encerramento oficial. Acompanhe a publicação dos resultados provisórios no DOE-RS e no portal.
            </p>
          </div>
        </div>

        {/* Banner de Ajuda e Suporte ao Fazedores de Viamão */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[#1e40af] shrink-0" />
            <span className="text-slate-700">
              Dúvidas sobre documentação e certidões estaduais? Consulte as orientações no portal da <strong>SEDAC-RS</strong>.
            </span>
          </div>
          <a
            href="https://cultura.rs.gov.br/fale-conosco"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shrink-0 inline-flex items-center gap-1 text-[11px]"
          >
            <span>Canal SEDAC-RS</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
