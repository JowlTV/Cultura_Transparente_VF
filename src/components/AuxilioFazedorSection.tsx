import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  FileDown,
  Copy,
  Check,
  RefreshCw,
  BookOpen,
  MessageSquare,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  User,
  Bot,
  AlertTriangle,
  Info,
  ExternalLink,
  X,
} from './Icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import roteirosConfig from '../config/roteiros.json';
import {
  ChatMessage,
  sendMessageToAssistant,
  CampoDef,
  PoliticaDef,
  AssistantRequestPayload,
  AssistantTurnResult,
} from '../services/culturalAiService';
import {
  ProjectDraftSections,
  downloadProjectDocx,
  ConferenciaRegrasResult,
} from '../utils/docxExport';
import {
  isGoogleDriveConfigured,
  exportToGoogleDrive,
} from '../utils/googleDriveExport';
import { LottieStateAnimation } from './lottie/LottieStateAnimation';

interface AuxilioFazedorSectionProps {
  onShowToast?: (msg: string) => void;
}

const STORAGE_KEY_V4 = 'cultura_projeto_draft_v4';
const LEGACY_STORAGE_KEYS = [
  'cultura_projeto_draft',
  'cultura_projeto_draft_v1',
  'cultura_projeto_draft_v2',
  'cultura_projeto_draft_v3',
  'cultura_projeto_draft_v3_msgs',
];

export interface CampoEstado {
  valor: string;
  status: 'vazio' | 'em andamento' | 'preenchido' | 'pendente';
  falta?: string;
  editadoManualmente?: boolean;
}

export type CamposMap = Record<string, CampoEstado>;

const POLICIES_CATALOG: Array<{
  id: string;
  nomeCurto: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  tag: string;
  corBorda: string;
}> = [
  {
    id: 'ROUANET',
    nomeCurto: 'Lei Rouanet',
    titulo: 'Lei Rouanet (Pronac / Salic)',
    subtitulo: 'Lei nº 8.313/1991 · IN MinC nº 29/2026',
    descricao: 'Incentivo fiscal federal conduzido campo a campo exatamente na estrutura e vocabulário do Salic oficial.',
    tag: 'Mecanismo Pronac',
    corBorda: 'hover:border-[#6A0DAD] hover:shadow-tint-md',
  },
  {
    id: 'PNAB',
    nomeCurto: 'PNAB',
    titulo: 'Política Nacional Aldir Blanc (PNAB)',
    subtitulo: 'Lei nº 14.399/2022 · Decreto 11.740/2023',
    descricao: 'Fomento contínuo para fazedores, agentes e pontos de cultura com cotas e democratização de acesso.',
    tag: 'Fomento Federal Contínuo',
    corBorda: 'hover:border-[#FF4500] hover:shadow-tint-md',
  },
  {
    id: 'LPG',
    nomeCurto: 'Lei Paulo Gustavo',
    titulo: 'Lei Paulo Gustavo (LPG)',
    subtitulo: 'Lei Complementar nº 195/2022 · Decreto 11.525/2023',
    descricao: 'Apoio e fomento ao setor audiovisual e demais linguagens artísticas em execução descentralizada.',
    tag: 'Audiovisual & Demais Áreas',
    corBorda: 'hover:border-[#2D0652] hover:shadow-tint-md',
  },
  {
    id: 'EMENDAS',
    nomeCurto: 'Emenda Parlamentar',
    titulo: 'Emenda Parlamentar Federal',
    subtitulo: 'Constituição Federal · Transferegov',
    descricao: 'Indicação orçamentária direta para entidades culturais sem fins lucrativos ou entes públicos.',
    tag: 'Transferegov / Repasse',
    corBorda: 'hover:border-[#0D9488] hover:shadow-tint-md',
  },
  {
    id: 'MUNICIPAL',
    nomeCurto: 'Edital Municipal',
    titulo: 'Edital Municipal de Viamão',
    subtitulo: 'Fundo Municipal de Cultura de Viamão/RS',
    descricao: 'Editais locais da Secretaria Municipal de Cultura para projetos desenvolvidos na comunidade viamonense.',
    tag: 'Viamão / Local',
    corBorda: 'hover:border-[#EA580C] hover:shadow-tint-md',
  },
];

export const AuxilioFazedorSection: React.FC<AuxilioFazedorSectionProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'consultoria' | 'guia'>('consultoria');
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [campoAtual, setCampoAtual] = useState<string>('');
  const [campos, setCampos] = useState<CamposMap>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});
  const [fontesCitadas, setFontesCitadas] = useState<Array<{ documento: string; trecho: string }>>([]);
  const [pendencias, setPendencias] = useState<string[]>([]);
  const [conferenciaRegras, setConferenciaRegras] = useState<ConferenciaRegrasResult | null>(null);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLongWaiting, setIsLongWaiting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveDocUrl, setDriveDocUrl] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Modais de confirmação
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSwitchPolicyModal, setShowSwitchPolicyModal] = useState<string | null>(null);
  const [legacyDraftData, setLegacyDraftData] = useState<string | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const campoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cancelModalButtonRef = useRef<HTMLButtonElement>(null);

  // Obtém o modelo da política ativa a partir da fonte única de dados
  const activePolicyConfig: PoliticaDef | undefined = selectedPolicy
    ? (roteirosConfig as Record<string, PoliticaDef>)[selectedPolicy]
    : undefined;

  const camposOrdenados: CampoDef[] = activePolicyConfig ? activePolicyConfig.campos : [];

  // 1. CARREGAMENTO INICIAL E DETECÇÃO DE RASCUNHO V4 OU LEGADO
  useEffect(() => {
    try {
      const savedV4 = localStorage.getItem(STORAGE_KEY_V4);
      if (savedV4) {
        const parsed = JSON.parse(savedV4);
        if (parsed && parsed.selectedPolicy && (roteirosConfig as Record<string, PoliticaDef>)[parsed.selectedPolicy]) {
          setSelectedPolicy(parsed.selectedPolicy);
          setCampoAtual(parsed.campoAtual || '');
          setCampos(parsed.campos || {});
          setMessages(parsed.messages || []);
          setAiSuggestions(parsed.aiSuggestions || {});
          setFontesCitadas(parsed.fontesCitadas || []);
          setPendencias(parsed.pendencias || []);
          setConferenciaRegras(parsed.conferenciaRegras || null);
          setExpandedSection(parsed.campoAtual || null);
          return;
        }
      }

      // Se não encontrou v4, verifica se há algum rascunho de versão anterior
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const rawLegacy = localStorage.getItem(legacyKey);
        if (rawLegacy && rawLegacy.trim().length > 10) {
          setLegacyDraftData(rawLegacy);
          break;
        }
      }
    } catch (e) {
      console.error('Erro ao restaurar rascunho v4:', e);
    }
  }, []);

  // 2. PERSISTÊNCIA AUTOMÁTICA EM cultura_projeto_draft_v4
  useEffect(() => {
    if (!selectedPolicy) return;
    try {
      const payload = {
        selectedPolicy,
        campoAtual,
        campos,
        messages,
        aiSuggestions,
        fontesCitadas,
        pendencias,
        conferenciaRegras,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_V4, JSON.stringify(payload));
    } catch (e) {
      console.error('Erro ao salvar rascunho v4:', e);
    }
  }, [selectedPolicy, campoAtual, campos, messages, aiSuggestions, fontesCitadas, pendencias, conferenciaRegras]);

  // 3. ROLAGEM AUTOMÁTICA DO PAINEL LATERAL PARA O CAMPO ATUAL
  useEffect(() => {
    if (campoAtual && campoRefs.current[campoAtual]) {
      campoRefs.current[campoAtual]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
      setExpandedSection(campoAtual);
    }
  }, [campoAtual]);

  // 4. ROLAGEM AUTOMÁTICA DO CHAT
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 5. ACESSIBILIDADE DO MODAL (ESC PARA FECHAR)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNewProjectModal) setShowNewProjectModal(false);
        if (showSwitchPolicyModal) setShowSwitchPolicyModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNewProjectModal, showSwitchPolicyModal]);

  // Foco no botão de cancelar ao abrir modal
  useEffect(() => {
    if (showNewProjectModal || showSwitchPolicyModal) {
      setTimeout(() => cancelModalButtonRef.current?.focus(), 50);
    }
  }, [showNewProjectModal, showSwitchPolicyModal]);

  // 6. INÍCIO DE PROJETO (SELEÇÃO EXPLÍCITA SEM IA)
  const handleSelectPolicy = (policyId: string) => {
    const model = (roteirosConfig as Record<string, PoliticaDef>)[policyId];
    if (!model) return;

    // Inicializa todos os campos daquela política como vazios
    const inicialCampos: CamposMap = {};
    model.campos.forEach(c => {
      inicialCampos[c.id] = {
        valor: '',
        status: 'vazio',
      };
    });

    // Preenche automaticamente o campo identificador de edital/política
    if (policyId === 'ROUANET' && inicialCampos['perfil_proponente']) {
      // Deixa pronto o contexto da Rouanet
      inicialCampos['edital_politica'] = {
        valor: 'Lei Rouanet · Incentivo a Projetos Culturais (Lei 8.313/1991 · IN MinC nº 29/2026)',
        status: 'preenchido',
      };
    } else if (inicialCampos['edital_politica']) {
      inicialCampos['edital_politica'] = {
        valor: model.nome,
        status: 'preenchido',
      };
    }

    // Identifica o primeiro campo obrigatório a ser preenchido
    const primeiroObrigatorio = model.campos.find(c => c.obrigatorio && c.id !== 'edital_politica') || model.campos[0];
    const primeiroId = primeiroObrigatorio ? primeiroObrigatorio.id : 'ideia_projeto';

    // Cria a primeira mensagem do assistente sem IA
    const welcomeMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      timestamp: 'Agora',
      content: `👋 **Olá, Fazedor(a) de Cultura!**\n\nVamos estruturar sua proposta para **${model.nome}**, campo a campo, com fundamentação estritamente nas regras oficiais.\n\nVamos começar pelo item: **${primeiroObrigatorio.rotulo}**.\n\n${primeiroObrigatorio.pergunta_base}`,
      etapaAtual: 1,
    };

    setSelectedPolicy(policyId);
    setCampoAtual(primeiroId);
    setCampos(inicialCampos);
    setMessages([welcomeMsg]);
    setExpandedSection(primeiroId);
    setFontesCitadas([]);
    setPendencias([]);
    setConferenciaRegras(null);
    setAiSuggestions({});

    onShowToast?.(`Política selecionada: ${model.nome}`);
  };

  // 7. CONFIRMAÇÃO DE NOVO PROJETO (LIMPEZA TOTAL)
  const handleConfirmNewProject = () => {
    setSelectedPolicy(null);
    setCampoAtual('');
    setCampos({});
    setMessages([]);
    setAiSuggestions({});
    setFontesCitadas([]);
    setPendencias([]);
    setConferenciaRegras(null);
    setShowNewProjectModal(false);
    setShowSwitchPolicyModal(null);
    setLegacyDraftData(null);

    // Remove todas as chaves do localStorage com o prefixo cultura_projeto_draft
    try {
      localStorage.removeItem(STORAGE_KEY_V4);
      for (const k of LEGACY_STORAGE_KEYS) {
        localStorage.removeItem(k);
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cultura_projeto_draft')) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.error('Erro ao limpar storage:', e);
    }

    onShowToast?.('Novo projeto iniciado! Escolha a política cultural desejada.');
  };

  // 8. ENVIO DE RESPOSTA OU DÚVIDA PARA O ASSISTENTE
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText !== undefined ? customText : inputMessage).trim();
    if (!textToSend || isLoading || !selectedPolicy) return;

    setInputMessage('');
    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      timestamp: 'Agora',
      content: textToSend,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);
    setIsLongWaiting(false);

    const longWaitTimer = setTimeout(() => {
      setIsLongWaiting(true);
    }, 3500);

    try {
      const contextMessages = newMessages.slice(-6).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const payload: AssistantRequestPayload = {
        politica: selectedPolicy,
        campo_atual: campoAtual,
        campos,
        messages: contextMessages,
      };

      const turn: AssistantTurnResult = await sendMessageToAssistant(payload);
      clearTimeout(longWaitTimer);
      setIsLoading(false);
      setIsLongWaiting(false);

      if (turn.isError) {
        const errorMsg = turn.text || 'Não foi possível processar a resposta do assistente.';
        onShowToast?.(errorMsg);
        return;
      }

      // 1. Atualiza mensagens do chat
      const assistantMsg: ChatMessage = {
        id: `msg-a-${Date.now()}`,
        role: 'assistant',
        timestamp: 'Agora',
        content: turn.text,
        fontesCitadas: turn.fontesCitadas,
        pendencias: turn.pendencias,
      };
      setMessages(prev => [...prev, assistantMsg]);

      // 2. Atualiza fontes e pendências
      if (turn.fontesCitadas && turn.fontesCitadas.length > 0) {
        setFontesCitadas(prev => {
          const map = new Map<string, string>();
          prev.forEach(f => map.set(f.documento, f.trecho));
          turn.fontesCitadas.forEach((f: { documento: string; trecho: string }) => map.set(f.documento, f.trecho));
          return Array.from(map.entries()).map(([documento, trecho]) => ({ documento, trecho }));
        });
      }

      if (turn.pendencias && turn.pendencias.length > 0) {
        setPendencias(prev => Array.from(new Set([...prev, ...turn.pendencias])));
      }

      if (turn.conferenciaRegras) {
        setConferenciaRegras(turn.conferenciaRegras);
      }

      // 3. Atualiza estado dos campos do projeto
      const targetCampo = turn.campo || campoAtual;
      const nextCampos: CamposMap = { ...campos };

      // Se o campo atual foi editado manualmente pelo usuário e a IA sugeriu algo diferente:
      if (nextCampos[targetCampo]?.editadoManualmente && turn.conteudo && turn.conteudo !== nextCampos[targetCampo].valor) {
        const novoConteudo = turn.conteudo;
        setAiSuggestions(prev => ({
          ...prev,
          [targetCampo]: novoConteudo,
        }));
      } else if (turn.conteudo) {
        nextCampos[targetCampo] = {
          ...nextCampos[targetCampo],
          valor: turn.conteudo,
          status: turn.completo ? 'preenchido' : 'em andamento',
          falta: turn.falta || undefined,
        };
      } else if (turn.status_campo) {
        nextCampos[targetCampo] = {
          ...nextCampos[targetCampo],
          status: turn.status_campo,
          falta: turn.falta || undefined,
        };
      }

      // Outros campos antecipados na mesma resposta
      if (turn.outros_campos) {
        Object.entries(turn.outros_campos).forEach(([k, v]) => {
          if (nextCampos[k] && !nextCampos[k].editadoManualmente && v) {
            nextCampos[k] = {
              ...nextCampos[k],
              valor: v,
              status: 'preenchido',
            };
          }
        });
      }

      // Sincroniza campos vindos do backend
      if (turn.campos_atualizados) {
        Object.entries(turn.campos_atualizados).forEach(([k, v]) => {
          if (nextCampos[k] && !nextCampos[k].editadoManualmente && v.valor) {
            nextCampos[k] = {
              ...nextCampos[k],
              valor: v.valor,
              status: v.status as any,
            };
          }
        });
      }

      setCampos(nextCampos);

      // 4. Condução: Atualiza o campo atual se o backend/código tiver avançado
      if (turn.proximo_campo && turn.proximo_campo !== campoAtual) {
        setCampoAtual(turn.proximo_campo);
        setExpandedSection(turn.proximo_campo);
      }
    } catch (err: any) {
      clearTimeout(longWaitTimer);
      setIsLoading(false);
      setIsLongWaiting(false);
      onShowToast?.('Erro de conexão ao comunicar com o assistente.');
    }
  };

  // 9. COMANDO "PULAR ESTE CAMPO"
  const handlePularCampo = () => {
    handleSendMessage('pular');
  };

  // 10. EDIÇÃO MANUAL DE UM CAMPO NO PAINEL LATERAL
  const handleManualEdit = (campoId: string, novoValor: string) => {
    setCampos(prev => ({
      ...prev,
      [campoId]: {
        ...prev[campoId],
        valor: novoValor,
        status: novoValor.trim() ? 'preenchido' : 'vazio',
        editadoManualmente: true,
      },
    }));
  };

  const handleApplyAiSuggestion = (campoId: string) => {
    const sug = aiSuggestions[campoId];
    if (!sug) return;
    setCampos(prev => ({
      ...prev,
      [campoId]: {
        ...prev[campoId],
        valor: sug,
        status: 'preenchido',
        editadoManualmente: false,
      },
    }));
    setAiSuggestions(prev => {
      const copy = { ...prev };
      delete copy[campoId];
      return copy;
    });
    onShowToast?.('Sugestão do assistente aplicada ao campo!');
  };

  const handleDismissAiSuggestion = (campoId: string) => {
    setAiSuggestions(prev => {
      const copy = { ...prev };
      delete copy[campoId];
      return copy;
    });
    onShowToast?.('Sua versão manual foi mantida.');
  };

  // 11. COPIAR TEXTO COMPLETO DO PROJETO FORMATADO CAMPO A CAMPO
  const handleCopyProjectText = () => {
    if (!activePolicyConfig) return;

    let fullText = `PROPOSTA CULTURAL: ${activePolicyConfig.nome.toUpperCase()}\n`;
    fullText += `Gerado na plataforma Cultura Transparente · Cult Circuito Viamão\n`;
    fullText += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    fullText += `===================================================================\n\n`;

    camposOrdenados.forEach((c, idx) => {
      const est = campos[c.id];
      const val = est?.valor?.trim() || '[a preencher]';
      fullText += `${idx + 1}. ${c.rotulo.toUpperCase()}\n`;
      if (c.fonte) fullText += `Base Normativa: ${c.fonte}\n`;
      fullText += `Status: ${est?.status ? est.status.toUpperCase() : 'A PREENCHER'}\n`;
      fullText += `-------------------------------------------------------------------\n`;
      fullText += `${val}\n\n`;
    });

    if (conferenciaRegras) {
      fullText += `\nCONFERÊNCIA DE REGRAS ORÇAMENTÁRIAS:\n`;
      fullText += `Status: ${conferenciaRegras.valido ? 'APROVADO' : 'PENDÊNCIAS ENCONTRADAS'}\n`;
      fullText += `${conferenciaRegras.resumo}\n`;
    }

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2500);
      onShowToast?.('Proposta copiada para a área de transferência!');
    });
  };

  const activePolicyCatalog = POLICIES_CATALOG.find(p => p.id === selectedPolicy);

  // 12. EXPORTAR PARA .DOCX
  const handleDownloadDocx = async () => {
    if (!activePolicyConfig) return;
    setIsExportingDocx(true);
    try {
      const sectionsMap: ProjectDraftSections = {};
      Object.entries(campos).forEach(([k, v]) => {
        sectionsMap[k] = v.valor;
      });

      const nomeProjeto =
        sectionsMap['sintese_produto']?.slice(0, 60) ||
        sectionsMap['ideia_projeto']?.slice(0, 60) ||
        `Proposta_${selectedPolicy || 'Cultural'}`;

      await downloadProjectDocx({
        projectName: nomeProjeto,
        sections: sectionsMap,
        fontesCitadas,
        politica: selectedPolicy || undefined,
        conferenciaRegras: conferenciaRegras || undefined,
      });

      onShowToast?.('Documento .docx gerado com sucesso!');
    } catch (e) {
      console.error(e);
      onShowToast?.('Erro ao gerar documento Word.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // 13. EXPORTAR PARA GOOGLE DRIVE
  const handleExportDrive = async () => {
    if (!activePolicyConfig) return;
    setIsExportingDrive(true);
    try {
      const sectionsMap: ProjectDraftSections = {};
      Object.entries(campos).forEach(([k, v]) => {
        sectionsMap[k] = v.valor;
      });

      const title =
        sectionsMap['sintese_produto']?.slice(0, 60) ||
        sectionsMap['ideia_projeto']?.slice(0, 60) ||
        `Proposta ${activePolicyConfig.nome}`;

      const res = await exportToGoogleDrive({
        title,
        sections: sectionsMap,
        politica: selectedPolicy || undefined,
      });

      if (res && res.webViewLink) {
        setDriveDocUrl(res.webViewLink);
        onShowToast?.('Proposta salva no Google Drive!');
      } else {
        onShowToast?.('Não foi possível obter o link do Google Drive.');
      }
    } catch (e) {
      console.error(e);
      onShowToast?.('Erro ao comunicar com o Google Drive.');
    } finally {
      setIsExportingDrive(false);
    }
  };

  // 14. EXPORTAR RASCUNHO LEGADO EM TXT
  const handleExportLegacyDraft = () => {
    if (!legacyDraftData) return;
    const blob = new Blob([legacyDraftData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rascunho_antigo_cultura_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('Rascunho anterior exportado em texto!');
  };

  // CÁLCULO DE PROGRESSO
  const totalObrigatorios = camposOrdenados.filter(c => c.obrigatorio).length;
  const preenchidosObrigatorios = camposOrdenados.filter(c => c.obrigatorio && campos[c.id]?.status === 'preenchido').length;
  const percentualConcluido = totalObrigatorios > 0 ? Math.round((preenchidosObrigatorios / totalObrigatorios) * 100) : 0;

  const campoAtualDef = camposOrdenados.find(c => c.id === campoAtual);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="bg-white border border-[#2D0652]/10 rounded-container p-6 shadow-tint-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-pill bg-[#EFE6FD] text-[#6A0DAD] text-xs font-medium border border-[#6A0DAD]/20">
              {selectedPolicy ? activePolicyConfig?.nome : 'Inteligência Oficial'}
            </span>
            <span className="text-xs text-[#2D0652]/60 font-medium">
              Fontes Estatais Oficiais · Uma Pergunta por Vez · Nada Inventado
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-normal text-[#2D0652] tracking-tight">
            Auxílio ao Fazedor de Cultura
          </h1>
          <p className="text-xs sm:text-sm text-[#2D0652]/70 font-medium mt-1">
            Elaboração técnica de propostas culturais com base na legislação e em conformidade estrita com o Salic e editais públicos.
          </p>
        </div>

        {/* Abas e Ações Globais */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedPolicy && (
            <button
              type="button"
              onClick={() => setShowNewProjectModal(true)}
              className="px-3 py-1.5 rounded-pill bg-white text-[#FF4500] hover:bg-[#FFF7ED] border border-[#FF4500]/30 text-xs font-medium flex items-center gap-1.5 shadow-tint-sm cursor-pointer transition-all"
              title="Recomeçar do zero e escolher outro edital/política"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Novo projeto</span>
            </button>
          )}

          <div className="flex p-1 bg-[#FAF4EB] rounded-pill border border-[#2D0652]/10">
            <button
              type="button"
              onClick={() => setActiveTab('consultoria')}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'consultoria'
                  ? 'bg-[#6A0DAD] text-white shadow-tint-sm'
                  : 'text-[#2D0652]/70 hover:text-[#2D0652]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Assistente</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guia')}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'guia'
                  ? 'bg-[#6A0DAD] text-white shadow-tint-sm'
                  : 'text-[#2D0652]/70 hover:text-[#2D0652]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Legislação & Fontes</span>
            </button>
          </div>
        </div>
      </div>

      {/* AVISO DE MIGRAÇÃO DE RASCUNHO ANTIGO */}
      {legacyDraftData && !selectedPolicy && (
        <div className="bg-[#FFF7ED] border border-[#FF4500]/30 rounded-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-tint-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#FF4500] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-medium text-[#2D0652]">Rascunho de versão anterior identificado</h4>
              <p className="text-[11px] text-[#2D0652]/80 mt-0.5">
                O assistente foi atualizado para condução estruturada campo a campo. Você pode exportar seus dados antigos em arquivo de texto antes de começar uma nova proposta.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportLegacyDraft}
              className="px-3 py-1.5 rounded-pill bg-white text-[#2D0652] hover:bg-[#FAF4EB] border border-[#2D0652]/20 text-xs font-medium cursor-pointer"
            >
              Exportar texto anterior
            </button>
            <button
              type="button"
              onClick={() => {
                for (const k of LEGACY_STORAGE_KEYS) localStorage.removeItem(k);
                setLegacyDraftData(null);
                onShowToast?.('Rascunho anterior descartado.');
              }}
              className="px-3 py-1.5 rounded-pill bg-[#FF4500] text-white hover:bg-[#E03D00] text-xs font-medium cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CENTRALIZADO: NOVO PROJETO */}
      {showNewProjectModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-container border border-[#2D0652]/20 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#FF4500]">
              <div className="w-10 h-10 rounded-pill bg-[#FFF7ED] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#FF4500]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#2D0652]">Iniciar um novo projeto cultural?</h3>
                <p className="text-xs text-[#2D0652]/70 font-medium">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
              Ao começar um novo projeto, todo o rascunho atual, as mensagens trocadas, as fontes oficiais e o progresso das seções serão <strong>apagados</strong> do seu navegador.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2D0652]/10">
              <button
                ref={cancelModalButtonRef}
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 rounded-pill bg-white text-[#2D0652] hover:bg-[#FAF4EB] border border-[#2D0652]/20 text-xs font-medium cursor-pointer"
              >
                Cancelar (Esc)
              </button>
              <button
                type="button"
                onClick={handleConfirmNewProject}
                className="px-4 py-2 rounded-pill bg-[#FF4500] text-white hover:bg-[#E03D00] text-xs font-medium cursor-pointer shadow-tint-sm"
              >
                Sim, iniciar novo projeto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CENTRALIZADO: CONFIRMAR TROCA DE POLÍTICA */}
      {showSwitchPolicyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-container border border-[#2D0652]/20 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-[#6A0DAD]">
              <div className="w-10 h-10 rounded-pill bg-[#EFE6FD] flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-[#6A0DAD]" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#2D0652]">Trocar de política cultural?</h3>
                <p className="text-xs text-[#2D0652]/70 font-medium">Reinicia o rascunho para a nova política.</p>
              </div>
            </div>

            <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
              Cada mecanismo possui campos, regras e roteiro específicos. Trocar de política iniciará uma nova proposta limpa.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2D0652]/10">
              <button
                ref={cancelModalButtonRef}
                type="button"
                onClick={() => setShowSwitchPolicyModal(null)}
                className="px-4 py-2 rounded-pill bg-white text-[#2D0652] hover:bg-[#FAF4EB] border border-[#2D0652]/20 text-xs font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetPol = showSwitchPolicyModal;
                  setShowSwitchPolicyModal(null);
                  handleSelectPolicy(targetPol);
                }}
                className="px-4 py-2 rounded-pill bg-[#6A0DAD] text-white hover:bg-[#580B91] text-xs font-medium cursor-pointer shadow-tint-sm"
              >
                Confirmar troca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA PRINCIPAL: ASSISTENTE CONVERSACIONAL */}
      {activeTab === 'consultoria' && (
        <>
          {/* PASSO 1: ESCOLHA DA POLÍTICA (SEM IA) */}
          {!selectedPolicy ? (
            <div className="bg-white border border-[#2D0652]/10 rounded-container p-6 sm:p-8 space-y-6 shadow-tint-sm">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="w-12 h-12 rounded-pill bg-[#EFE6FD] text-[#6A0DAD] flex items-center justify-center mx-auto mb-2">
                  <Bot className="w-6 h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-normal text-[#2D0652]">
                  Para qual política ou edital é o seu projeto?
                </h2>
                <p className="text-xs sm:text-sm text-[#2D0652]/70 font-medium">
                  Selecione o instrumento desejado. O sistema carregará o roteiro oficial correspondente para você responder uma pergunta por vez.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {POLICIES_CATALOG.map(pol => (
                  <button
                    key={pol.id}
                    type="button"
                    onClick={() => handleSelectPolicy(pol.id)}
                    className={`p-5 rounded-card border border-[#2D0652]/15 bg-[#FAF4EB]/50 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 group ${pol.corBorda}`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-pill bg-white text-[#6A0DAD] border border-[#2D0652]/10">
                          {pol.tag}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#2D0652]/40 group-hover:text-[#6A0DAD] transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="text-sm font-medium text-[#2D0652] group-hover:text-[#6A0DAD]">
                        {pol.titulo}
                      </h3>
                      <p className="text-[11px] text-[#2D0652]/60 font-medium">
                        {pol.subtitulo}
                      </p>
                      <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium pt-1">
                        {pol.descricao}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#2D0652]/10 flex items-center justify-between text-[11px] text-[#6A0DAD] font-medium">
                      <span>Iniciar este roteiro</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* PASSO 2: CHAT CONDUZIDO PELO ESTADO DOS CAMPOS + PAINEL 'SEU PROJETO' */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna da Esquerda: Chat Conversacional (7 colunas) */}
              <div className="lg:col-span-7 bg-white border border-[#2D0652]/10 rounded-container shadow-tint-sm flex flex-col h-[680px] overflow-hidden">
                {/* Header do Chat */}
                <div className="p-3.5 sm:p-4 bg-[#FAF4EB] border-b border-[#2D0652]/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-pill bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 shadow-tint-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xs sm:text-sm font-medium text-[#2D0652] truncate">
                        {activePolicyConfig?.nome}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#2D0652]/60">
                        <span>Foco atual:</span>
                        <strong className="text-[#6A0DAD] font-medium truncate">
                          {campoAtualDef?.rotulo || campoAtual}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSwitchPolicyModal(selectedPolicy === 'ROUANET' ? 'PNAB' : 'ROUANET')}
                      className="px-2.5 py-1 rounded-pill bg-white text-[#2D0652] hover:bg-[#FAF4EB] border border-[#2D0652]/15 text-[10px] font-medium cursor-pointer"
                      title="Trocar para outro edital ou política"
                    >
                      Trocar política
                    </button>
                  </div>
                </div>

                {/* Barra de Progresso Rápida */}
                <div className="px-4 py-1.5 bg-[#FDFBF7] border-b border-[#2D0652]/10 flex items-center justify-between text-[10px] text-[#2D0652]/70 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-pill bg-[#166534]"></span>
                    <span>Progresso obrigatório: {preenchidosObrigatorios} de {totalObrigatorios} ({percentualConcluido}%)</span>
                  </div>
                  <div className="w-28 bg-[#2D0652]/10 rounded-pill h-1.5 overflow-hidden">
                    <div
                      className="bg-[#166534] h-full transition-all duration-300"
                      style={{ width: `${percentualConcluido}%` }}
                    />
                  </div>
                </div>

                {/* Lista de Mensagens */}
                <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-pill bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 mt-1 shadow-tint-sm">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-card px-4 py-3 text-xs leading-relaxed shadow-tint-sm ${
                          msg.role === 'user'
                            ? 'bg-[#2D0652] text-white rounded-br-xs'
                            : 'bg-[#FAF4EB] text-[#2D0652] border border-[#2D0652]/10 rounded-bl-xs'
                        }`}
                      >
                        <div className="prose prose-xs max-w-none dark:prose-invert">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>

                        {/* Fontes Citadas com Rigor */}
                        {msg.fontesCitadas && msg.fontesCitadas.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#2D0652]/10 space-y-1">
                            <div className="text-[10px] font-medium text-[#6A0DAD]">
                              Fontes oficiais consultadas:
                            </div>
                            {msg.fontesCitadas.map((f, i) => (
                              <div
                                key={i}
                                className="text-[10px] bg-white/80 p-1.5 rounded text-[#2D0652] border border-[#2D0652]/10"
                              >
                                <strong>{f.documento}:</strong> {f.trecho}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pendências destacadas */}
                        {msg.pendencias && msg.pendencias.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-[#2D0652]/10 space-y-1">
                            <div className="flex items-center gap-1 text-[10px] font-medium text-[#FF4500]">
                              <AlertTriangle className="w-3 h-3 text-[#FF4500]" />
                              <span>Pontos de Atenção / Pendências:</span>
                            </div>
                            <ul className="list-disc pl-4 text-[10px] text-[#2D0652] space-y-0.5">
                              {msg.pendencias.map((p, i) => (
                                <li key={i}>{p}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="text-[9px] text-right mt-1.5 opacity-60">
                          {msg.timestamp}
                        </div>
                      </div>

                      {msg.role === 'user' && (
                        <div className="w-7 h-7 rounded-pill bg-[#FF4500] text-white flex items-center justify-center shrink-0 mt-1 shadow-tint-sm">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-2.5 justify-start items-center">
                      <div className="w-7 h-7 rounded-pill bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 shadow-tint-sm">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="bg-[#FAF4EB] border border-[#2D0652]/10 rounded-card rounded-bl-xs px-4 py-3 text-xs text-[#2D0652] flex items-center gap-3 shadow-tint-sm">
                        <LottieStateAnimation
                          type="data-loading"
                          altText="O assistente está consultando as bases oficiais..."
                          size={24}
                        />
                        <span className="text-xs font-medium text-[#2D0652]">
                          {isLongWaiting
                            ? 'Consultando normativas oficiais e estruturando a proposta técnica…'
                            : 'O assistente está consultando as bases oficiais…'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações de Apoio e Comando 'Pular' */}
                <div className="px-4 py-2 bg-[#FAF4EB] border-t border-[#2D0652]/10 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#2D0652]/70">
                    <span>Campo em foco:</span>
                    <strong className="text-[#2D0652]">{campoAtualDef?.rotulo}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePularCampo}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-pill bg-white hover:bg-[#FAF4EB] text-[#2D0652] text-[11px] font-medium border border-[#2D0652]/20 cursor-pointer disabled:opacity-50"
                      title="Pular este campo e responder mais tarde (fica marcado como pendente [a preencher])"
                    >
                      Pular este campo
                    </button>
                  </div>
                </div>

                {/* Caixa de Entrada de Mensagem */}
                <div className="p-3 sm:p-4 bg-[#FAF4EB] border-t border-[#2D0652]/10">
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={e => setInputMessage(e.target.value)}
                      placeholder={campoAtualDef ? `Responder sobre "${campoAtualDef.rotulo}" ou tirar dúvida...` : 'Digite sua resposta ou dúvida...'}
                      disabled={isLoading}
                      className="flex-1 bg-white border border-[#2D0652]/20 rounded-pill px-4 py-2.5 text-xs sm:text-sm text-[#2D0652] placeholder-[#2D0652]/40 focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD] focus:border-[#6A0DAD] transition-all"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !inputMessage.trim()}
                      className="px-5 py-2.5 rounded-pill bg-[#6A0DAD] hover:bg-[#580B91] disabled:opacity-50 text-white font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-tint-sm cursor-pointer"
                    >
                      <span>Responder</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Coluna da Direita: Painel 'Seu Projeto' Editável (5 colunas) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white border border-[#2D0652]/10 rounded-container p-5 shadow-tint-sm space-y-4">
                  {/* Topo do Painel */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#2D0652]/10">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#FF4500]" />
                      <h3 className="text-xs font-medium text-[#2D0652]">
                        Seu Projeto ({activePolicyCatalog?.nomeCurto || activePolicyConfig?.nome})
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCopyProjectText}
                        className="p-1.5 rounded-pill bg-[#FAF4EB] text-[#2D0652] hover:bg-[#EFE6FD] text-[10px] font-medium border border-[#2D0652]/10 flex items-center gap-1 cursor-pointer"
                        title="Copiar texto completo"
                      >
                        {copiedDraft ? <Check className="w-3 h-3 text-[#166534]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDraft ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadDocx}
                        disabled={isExportingDocx}
                        className="px-2.5 py-1 rounded-pill bg-[#6A0DAD] text-white hover:bg-[#580B91] text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Baixar em Word .docx"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>.docx</span>
                      </button>
                      {isGoogleDriveConfigured() && (
                        <button
                          type="button"
                          onClick={handleExportDrive}
                          disabled={isExportingDrive}
                          className="px-2.5 py-1 rounded-pill bg-[#166534] text-white hover:bg-[#14532d] text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Salvar no Google Drive"
                        >
                          <span>Drive</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Informação sobre Edição Manual */}
                  <div className="text-[11px] text-[#2D0652]/70 bg-[#FAF4EB] p-2.5 rounded-card border border-[#2D0652]/10 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#6A0DAD] shrink-0 mt-0.5" />
                    <span>
                      O painel atualiza a cada mensagem. Você pode <strong>editar diretamente</strong> qualquer campo. Edições manuais não são sobrescritas pela IA.
                    </span>
                  </div>

                  {/* Alerta Google Drive */}
                  {driveDocUrl && (
                    <div className="bg-[#DCFCE7] border border-[#166534]/30 rounded-card p-3 flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-[#166534] font-medium">
                        <Check className="w-4 h-4" />
                        <span>Salvo no Google Drive!</span>
                      </div>
                      <a
                        href={driveDocUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#166534] text-white rounded-pill font-medium text-[11px] hover:bg-[#14532d]"
                      >
                        <span>Abrir Documento</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* LISTA ORDENADA DOS CAMPOS DA POLÍTICA */}
                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {camposOrdenados.map((c, index) => {
                      const est = campos[c.id] || { valor: '', status: 'vazio' };
                      const hasContent = Boolean(est.valor?.trim());
                      const isFocused = campoAtual === c.id;
                      const isExpanded = expandedSection === c.id;
                      const isUserEdited = Boolean(est.editadoManualmente);
                      const hasAiSuggestion = Boolean(aiSuggestions[c.id]);

                      return (
                        <div
                          key={c.id}
                          ref={el => {
                            campoRefs.current[c.id] = el;
                          }}
                          className={`border rounded-card transition-all overflow-hidden ${
                            isFocused
                              ? 'border-[#6A0DAD] bg-white ring-2 ring-[#6A0DAD]/30 shadow-tint-sm'
                              : isExpanded
                              ? 'border-[#2D0652]/30 bg-white'
                              : 'border-[#2D0652]/10 bg-[#FAF4EB]/60 hover:bg-[#FAF4EB]'
                          }`}
                        >
                          {/* Cabeçalho do Campo */}
                          <div className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left">
                            <button
                              type="button"
                              onClick={() => setExpandedSection(isExpanded ? null : c.id)}
                              className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                            >
                              <span
                                className={`w-5 h-5 rounded-pill flex items-center justify-center text-[10px] font-medium shrink-0 ${
                                  est.status === 'preenchido'
                                    ? 'bg-[#166534] text-white'
                                    : est.status === 'pendente'
                                    ? 'bg-[#EA580C] text-white'
                                    : est.status === 'em andamento'
                                    ? 'bg-[#CA8A04] text-white'
                                    : 'bg-[#2D0652]/10 text-[#2D0652]'
                                }`}
                              >
                                {index + 1}
                              </span>
                              <span className="text-xs font-medium text-[#2D0652] truncate">
                                {c.rotulo}
                              </span>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isFocused && (
                                <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-medium bg-[#EFE6FD] text-[#6A0DAD] border border-[#6A0DAD]/20">
                                  Em foco
                                </span>
                              )}
                              {isUserEdited && (
                                <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-medium bg-[#FAF4EB] text-[#2D0652] border border-[#2D0652]/20">
                                  Manual
                                </span>
                              )}
                              {est.status === 'preenchido' && (
                                <span className="text-[10px] font-medium text-[#166534] flex items-center gap-0.5">
                                  <Check className="w-3 h-3 text-[#166534]" />
                                  <span>Preenchido</span>
                                </span>
                              )}
                              {est.status === 'pendente' && (
                                <span className="text-[10px] font-medium text-[#EA580C]">
                                  Pendente
                                </span>
                              )}
                              {est.status === 'em andamento' && (
                                <span className="text-[10px] font-medium text-[#CA8A04]">
                                  Em andamento
                                </span>
                              )}
                              {est.status === 'vazio' && (
                                <span className="text-[10px] text-[#2D0652]/40 font-medium">
                                  Vazio
                                </span>
                              )}

                              {!isFocused && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCampoAtual(c.id);
                                    setExpandedSection(c.id);
                                  }}
                                  className="text-[10px] text-[#6A0DAD] hover:underline ml-1 cursor-pointer"
                                  title="Focar este campo no chat para o assistente perguntar sobre ele"
                                >
                                  Focar
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Corpo Editável do Campo */}
                          {isExpanded && (
                            <div className="p-3 pt-0 border-t border-[#2D0652]/10 space-y-2 bg-white">
                              <div className="text-[11px] text-[#2D0652]/70 flex items-center justify-between gap-2 pt-1">
                                <span className="italic">{c.pergunta_base}</span>
                                {c.fonte && (
                                  <span className="text-[9px] text-[#6A0DAD] bg-[#EFE6FD] px-1.5 py-0.5 rounded shrink-0">
                                    {c.fonte}
                                  </span>
                                )}
                              </div>

                              {/* Alerta de sugestão pendente da IA */}
                              {hasAiSuggestion && (
                                <div className="bg-[#FFF7ED] border border-[#FF4500]/30 rounded-card p-2.5 space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between text-[#FF4500] font-medium text-[11px]">
                                    <span className="flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      Nova sugestão do assistente de IA disponível:
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#2D0652] bg-white p-2 rounded border border-[#FF4500]/20 max-h-24 overflow-y-auto font-mono">
                                    {aiSuggestions[c.id]}
                                  </p>
                                  <div className="flex items-center gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleApplyAiSuggestion(c.id)}
                                      className="px-2.5 py-1 bg-[#FF4500] text-white rounded-pill font-medium text-[10px] hover:bg-[#E03D00] cursor-pointer"
                                    >
                                      Substituir pela sugestão
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDismissAiSuggestion(c.id)}
                                      className="px-2.5 py-1 bg-white text-[#2D0652] border border-[#2D0652]/15 rounded-pill font-medium text-[10px] hover:bg-[#FAF4EB] cursor-pointer"
                                    >
                                      Manter minha versão
                                    </button>
                                  </div>
                                </div>
                              )}

                              <textarea
                                value={est.valor}
                                onChange={e => handleManualEdit(c.id, e.target.value)}
                                placeholder={
                                  est.status === 'pendente'
                                    ? '[a preencher] - Digite aqui para completar este campo manualmente...'
                                    : `Digite aqui o conteúdo de "${c.rotulo}"...`
                                }
                                rows={3}
                                className="w-full text-xs p-2.5 rounded-card border border-[#2D0652]/20 text-[#2D0652] focus:outline-hidden focus:ring-1 focus:ring-[#6A0DAD] focus:border-[#6A0DAD] leading-relaxed resize-y font-sans"
                              />

                              {est.falta && est.status !== 'preenchido' && (
                                <div className="text-[10px] text-[#EA580C] bg-[#FFF7ED] p-1.5 rounded">
                                  <strong>O que ainda falta:</strong> {est.falta}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Validação de Regras Orçamentárias da Rouanet (se aplicável) */}
                  {selectedPolicy === 'ROUANET' && conferenciaRegras && (
                    <div className="mt-3 p-3.5 bg-[#FAF4EB] border border-[#6A0DAD]/30 rounded-card space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-[#2D0652] font-medium">
                          <ShieldCheck className="w-4 h-4 text-[#6A0DAD]" />
                          <span>Conferência de Regras (IN MinC nº 29/2026)</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-pill bg-[#EFE6FD] text-[#6A0DAD] font-medium">
                          Cálculo por Código
                        </span>
                      </div>
                      <p className="text-[11px] text-[#2D0652]/80 leading-snug">
                        {conferenciaRegras.resumo}
                      </p>
                    </div>
                  )}

                  {/* Rodapé com botão de novo projeto */}
                  <div className="pt-2 border-t border-[#2D0652]/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowNewProjectModal(true)}
                      className="text-xs text-[#FF4500] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Apagar rascunho e iniciar novo</span>
                    </button>
                    <span className="text-[10px] text-[#2D0652]/40">
                      v4 · Salvo localmente
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ABA SECUNDÁRIA: LEGISLAÇÃO E BASES OFICIAIS */}
      {activeTab === 'guia' && (
        <div className="bg-white border border-[#2D0652]/10 rounded-container p-6 space-y-6 shadow-tint-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-normal text-[#2D0652]">
              Base Normativa Oficial e Editais Públicos
            </h2>
            <p className="text-xs sm:text-sm text-[#2D0652]/70 font-medium">
              Todo o conteúdo utilizado pelo assistente provém de legislações vigentes e anexos oficiais do Ministério da Cultura e do Município de Viamão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FAF4EB] rounded-card border border-[#2D0652]/10 space-y-2">
              <span className="text-xs font-medium text-[#6A0DAD]">Lei Rouanet (Pronac)</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei nº 8.313/1991 & IN MinC nº 29/2026</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Regulamenta o Salic, limites orçamentários objetivos (Arts. 11, 16, 19, 22, 23 e 26), acessibilidade e democratização de acesso. A IN MinC nº 23/2025 foi revogada pela IN 29/2026.
              </p>
              <a
                href="https://www.gov.br/cultura/pt-br/acesso-a-informacao/legislacao-e-normativas/instrucao-normativa-minc-no-29-de-29-de-janeiro-de-2026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6A0DAD] font-medium hover:underline pt-1"
              >
                <span>Portal oficial do MinC (IN 29/2026)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 bg-[#FAF4EB] rounded-card border border-[#2D0652]/10 space-y-2">
              <span className="text-xs font-medium text-[#6A0DAD]">PNAB - Política Nacional Aldir Blanc</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei nº 14.399/2022 & Decreto 11.740/2023</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Fomento contínuo para fazedores de cultura, pontos de cultura e editais com cotas afirmativas em Viamão/RS.
              </p>
              <a
                href="https://www.gov.br/cultura/pt-br/assuntos/pnab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6A0DAD] font-medium hover:underline pt-1"
              >
                <span>Portal da PNAB no MinC</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 bg-[#FAF4EB] rounded-card border border-[#2D0652]/10 space-y-2">
              <span className="text-xs font-medium text-[#6A0DAD]">LPG - Lei Paulo Gustavo</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei Complementar nº 195/2022</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Apoio emergencial e estruturante ao audiovisual e linguagens artísticas em execução descentralizada.
              </p>
              <a
                href="https://www.gov.br/cultura/pt-br/assuntos/lei-paulo-gustavo"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6A0DAD] font-medium hover:underline pt-1"
              >
                <span>Portal da LPG no MinC</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 bg-[#FAF4EB] rounded-card border border-[#2D0652]/10 space-y-2">
              <span className="text-xs font-medium text-[#6A0DAD]">Marco Regulatório do Fomento</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei nº 14.903/2024</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Marco Regulatório do Fomento à Cultura e prestação de contas com foco no cumprimento do objeto cultural.
              </p>
              <a
                href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14903.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6A0DAD] font-medium hover:underline pt-1"
              >
                <span>Texto Oficial no Planalto</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
