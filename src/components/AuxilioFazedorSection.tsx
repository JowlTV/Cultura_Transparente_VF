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
  ChevronLeft,
  User,
  Bot,
  AlertTriangle,
  Info,
  ExternalLink,
  X,
} from './Icon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChatMessage,
  sendMessageToAssistant,
  ROTEIRO_ETAPAS,
  ROTEIRO_ETAPAS_ROUANET,
  PROJETOS_EXEMPLO,
  ExemploTema,
  EtapaConfig,
} from '../services/culturalAiService';
import {
  ProjectDraftSections,
  downloadProjectDocx,
  isRouanetPolicy,
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

const STORAGE_KEY = 'cultura_projeto_draft_v3';

const INITIAL_WELCOME_CONTENT = `👋 **Olá, Fazedor(a) de Cultura de Viamão!**

Sou seu assistente de elaboração técnica de projetos culturais da plataforma Cultura Transparente. Vamos estruturar sua proposta juntos, passo a passo, com fundamentação estritamente nas regras e editais oficiais (PNAB, Lei Paulo Gustavo, Lei Rouanet - IN MinC nº 29/2026 e Emendas Parlamentares).

Para qual edital ou política cultural você deseja preparar seu projeto (Lei Rouanet, PNAB, Lei Paulo Gustavo, emenda parlamentar ou edital municipal de Viamão)?`;

export const AuxilioFazedorSection: React.FC<AuxilioFazedorSectionProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'consultoria' | 'guia'>('consultoria');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLongWaiting, setIsLongWaiting] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveDocUrl, setDriveDocUrl] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [currentEtapa, setCurrentEtapa] = useState<number>(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('edital_politica');
  const [activePolicy, setActivePolicy] = useState<'PADRAO' | 'ROUANET'>('PADRAO');
  const [conferenciaRegras, setConferenciaRegras] = useState<ConferenciaRegrasResult | null>(null);

  // Rascunho das seções (suporta padrão e Rouanet)
  const [sections, setSections] = useState<ProjectDraftSections>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.sections) return parsed.sections;
      }
    } catch {}
    return {
      edital_politica: '',
      ideia_projeto: '',
      tipo_proponente: '',
      objetivo_principal: '',
      publico_territorio: '',
      atividades_metodologia: '',
      acessibilidade: '',
      contrapartida_social: '',
      cronograma: '',
      orcamento: '',
      revisao_final: '',
      // Campos Rouanet
      perfil_proponente: '',
      enquadramento_artigo: '',
      sintese_produto: '',
      objetivos_justificativa: '',
      local_cronograma: '',
      plano_distribuicao_democratizacao: '',
      medidas_acessibilidade: '',
      divulgacao_marcas: '',
      ficha_tecnica: '',
      planilha_orcamentaria: '',
      conferencia_regras_revisao: '',
    };
  });

  // Rastreio de seções que o usuário editou manualmente
  const [manuallyEdited, setManuallyEdited] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.manuallyEdited) return parsed.manuallyEdited;
      }
    } catch {}
    return {};
  });

  // Sugestões pendentes da IA para seções que o usuário já havia editado
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

  // Fontes oficiais e pendências agregadas da conversa
  const [fontesCitadas, setFontesCitadas] = useState<Array<{ documento: string; trecho: string }>>([]);
  const [pendencias, setPendencias] = useState<string[]>([]);

  // Histórico de mensagens do chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_msgs`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'msg-welcome',
        role: 'assistant',
        timestamp: 'Agora',
        content: INITIAL_WELCOME_CONTENT,
        etapaAtual: 1,
      },
    ];
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Determina se a política ativa é Rouanet
  const isRouanet = isRouanetPolicy(sections, activePolicy);
  const currentRoteiro: EtapaConfig[] = isRouanet ? ROTEIRO_ETAPAS_ROUANET : ROTEIRO_ETAPAS;
  const totalEtapas = currentRoteiro.length;

  // Auto-save local draft
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sections,
          manuallyEdited,
          currentEtapa,
          activePolicy,
          conferenciaRegras,
        })
      );
    } catch (e) {
      console.warn('Falha ao salvar rascunho no localStorage:', e);
    }
  }, [sections, manuallyEdited, currentEtapa, activePolicy, conferenciaRegras]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_msgs`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Falha ao salvar histórico no localStorage:', e);
    }
  }, [messages]);

  useEffect(() => {
    if (!isLoading) {
      setIsLongWaiting(false);
      return;
    }
    const timer = setTimeout(() => {
      setIsLongWaiting(true);
    }, 15000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const currentEtapaConfig = currentRoteiro.find(e => e.etapa === currentEtapa) || currentRoteiro[0];

  // Envio de mensagem para a IA
  const handleSendMessage = async (userTextToSend?: string) => {
    const text = (userTextToSend || inputMessage).trim();
    if (!text || isLoading) return;

    // Detecta se usuário mencionou Rouanet
    if (text.toLowerCase().includes('rouanet') || text.toLowerCase().includes('pronac') || text.toLowerCase().includes('in 29')) {
      setActivePolicy('ROUANET');
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendMessageToAssistant(historyPayload);

      if (res.politica === 'ROUANET') {
        setActivePolicy('ROUANET');
      }

      if (res.conferenciaRegras) {
        setConferenciaRegras(res.conferenciaRegras);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        etapaAtual: res.etapaAtual,
        secoesAtualizadas: res.secoesAtualizadas,
        fontesCitadas: res.fontesCitadas,
        pendencias: res.pendencias,
        conferenciaRegras: res.conferenciaRegras,
        politica: res.politica,
        isError: res.isError,
      };

      setMessages(prev => [...prev, botMsg]);

      const maxSteps = res.politica === 'ROUANET' || isRouanet ? 12 : 11;
      if (res.etapaAtual && res.etapaAtual >= 1 && res.etapaAtual <= maxSteps) {
        setCurrentEtapa(res.etapaAtual);
      }

      // Atualiza fontes citadas sem duplicar
      if (res.fontesCitadas && res.fontesCitadas.length > 0) {
        setFontesCitadas(prev => {
          const map = new Map(prev.map(f => [f.documento + f.trecho, f]));
          res.fontesCitadas.forEach(f => map.set(f.documento + f.trecho, f));
          return Array.from(map.values());
        });
      }

      // Atualiza pendências
      if (res.pendencias) {
        setPendencias(res.pendencias);
      }

      // Atualiza seções respeitando edições manuais da pessoa
      if (res.secoesAtualizadas && Object.keys(res.secoesAtualizadas).length > 0) {
        setSections(prevSections => {
          const next = { ...prevSections };
          const newAiSuggestions: Record<string, string> = { ...aiSuggestions };

          Object.entries(res.secoesAtualizadas).forEach(([key, val]) => {
            if (!val || !val.trim()) return;

            // Se o usuário editou manualmente esta seção e o valor é diferente, não sobrescreve
            if (manuallyEdited[key] && prevSections[key]?.trim() && prevSections[key]?.trim() !== val.trim()) {
              newAiSuggestions[key] = val;
            } else {
              next[key] = val;
            }
          });

          setAiSuggestions(newAiSuggestions);
          return next;
        });

        // Abre a seção atualizada para conferência visual
        const firstUpdated = Object.keys(res.secoesAtualizadas)[0];
        if (firstUpdated) {
          setExpandedSection(firstUpdated);
        }
      }
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu uma instabilidade momentânea na conexão. Por favor, tente enviar novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Edição manual de seção pelo usuário
  const handleSectionManualChange = (key: string, value: string) => {
    setSections(prev => ({ ...prev, [key]: value }));
    setManuallyEdited(prev => ({ ...prev, [key]: true }));
    if (aiSuggestions[key]) {
      setAiSuggestions(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Aceitar sugestão da IA para seção previamente editada manualmente
  const handleApplyAiSuggestion = (key: string) => {
    const sug = aiSuggestions[key];
    if (sug) {
      setSections(prev => ({ ...prev, [key]: sug }));
      setManuallyEdited(prev => ({ ...prev, [key]: false }));
      setAiSuggestions(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      if (onShowToast) onShowToast('Sugestão da IA aplicada à seção!');
    }
  };

  // Rejeitar sugestão da IA e manter a versão manual
  const handleDismissAiSuggestion = (key: string) => {
    setAiSuggestions(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
    if (onShowToast) onShowToast('Sua versão manual foi mantida.');
  };

  // Apagar rascunho
  const handleResetDraft = () => {
    const emptySections: ProjectDraftSections = {
      edital_politica: '',
      ideia_projeto: '',
      tipo_proponente: '',
      objetivo_principal: '',
      publico_territorio: '',
      atividades_metodologia: '',
      acessibilidade: '',
      contrapartida_social: '',
      cronograma: '',
      orcamento: '',
      revisao_final: '',
      perfil_proponente: '',
      enquadramento_artigo: '',
      sintese_produto: '',
      objetivos_justificativa: '',
      local_cronograma: '',
      plano_distribuicao_democratizacao: '',
      medidas_acessibilidade: '',
      divulgacao_marcas: '',
      ficha_tecnica: '',
      planilha_orcamentaria: '',
      conferencia_regras_revisao: '',
    };
    setSections(emptySections);
    setManuallyEdited({});
    setAiSuggestions({});
    setFontesCitadas([]);
    setPendencias([]);
    setCurrentEtapa(1);
    setActivePolicy('PADRAO');
    setConferenciaRegras(null);
    setDriveDocUrl(null);
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        timestamp: 'Agora',
        content: INITIAL_WELCOME_CONTENT,
        etapaAtual: 1,
      },
    ]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(`${STORAGE_KEY}_msgs`);
    setShowClearConfirm(false);
    if (onShowToast) onShowToast('Rascunho do projeto apagado com sucesso.');
  };

  // Exportar .docx
  const handleDownloadDocx = async () => {
    setIsExportingDocx(true);
    if (onShowToast) onShowToast('Gerando documento técnico .docx com formatação oficial...');
    try {
      await downloadProjectDocx({
        projectName: sections.sintese_produto?.slice(0, 50) || sections.ideia_projeto?.slice(0, 50) || (isRouanet ? 'Proposta_Lei_Rouanet' : 'Projeto_Cultural_Viamao'),
        proponentName: sections.perfil_proponente?.slice(0, 50) || sections.tipo_proponente,
        sections,
        fontesCitadas,
        politica: isRouanet ? 'ROUANET' : 'PADRAO',
        conferenciaRegras: conferenciaRegras || undefined,
      });
      if (onShowToast) onShowToast('Arquivo .docx baixado com sucesso!');
    } catch (e: any) {
      console.error('Erro na exportação DOCX:', e);
      if (onShowToast) onShowToast('Erro ao gerar arquivo .docx.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  // Exportar Google Drive
  const handleSaveGoogleDrive = async () => {
    if (!isGoogleDriveConfigured()) {
      if (onShowToast) onShowToast('Exportação ao Google Drive não está habilitada.');
      return;
    }

    setIsExportingDrive(true);
    if (onShowToast) onShowToast('Conectando ao Google Drive para criar seu Google Doc...');

    try {
      const res = await exportToGoogleDrive({
        title: sections.sintese_produto?.slice(0, 60) || sections.ideia_projeto?.slice(0, 60) || (isRouanet ? 'Proposta Lei Rouanet Salic' : 'Projeto Cultural Viamão'),
        sections,
        fontesCitadas,
        politica: isRouanet ? 'ROUANET' : 'PADRAO',
        conferenciaRegras: conferenciaRegras || undefined,
      });
      setDriveDocUrl(res.webViewLink);
      if (onShowToast) onShowToast('Documento criado no seu Google Drive com sucesso!');
      window.open(res.webViewLink, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      console.error('Erro no Google Drive:', e);
      if (onShowToast) onShowToast(`Erro no Google Drive: ${e.message || 'Falha na autorização'}`);
    } finally {
      setIsExportingDrive(false);
    }
  };

  // Copiar resumo do projeto
  const handleCopyProjectText = () => {
    const lines = currentRoteiro.map(e => {
      const val = sections[e.chave] || '[Pendente]';
      return `### ${e.etapa}. ${e.nome}\n${val}\n`;
    });
    const headerTitle = isRouanet
      ? '# PROPOSTA CULTURAL - LEI ROUANET (IN MINC Nº 29/2026 - SALIC)'
      : '# PROJETO CULTURAL - VIAMÃO/RS';
    const fullText = `${headerTitle}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDraft(true);
    if (onShowToast) onShowToast('Texto do projeto copiado para a área de transferência!');
    setTimeout(() => setCopiedDraft(false), 3000);
  };

  // Carregar modelo temático
  const handleSelectExample = (ex: ExemploTema) => {
    if (ex.editalSugerido.toLowerCase().includes('rouanet')) {
      setActivePolicy('ROUANET');
    }
    setCurrentEtapa(2);
    const textToSend = `Meu edital ou política pretendida é ${ex.editalSugerido}. Minha ideia é: ${ex.ideiaInicial}`;
    handleSendMessage(textToSend);
  };

  // Percentual de preenchimento
  const filledCount = currentRoteiro.filter(e => Boolean(sections[e.chave]?.trim())).length;
  const progressPercent = Math.round((filledCount / totalEtapas) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner de Identidade Visual */}
      <div className="bg-[#FAF4EB] rounded-container p-6 sm:p-8 border border-[#2D0652]/10 shadow-tint-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 bg-[#EFE6FD] text-[#6A0DAD] border border-[#6A0DAD]/20 rounded-pill text-xs font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                Elaboração Orientada de Projetos Culturais
              </span>
              <span className="px-3 py-0.5 bg-white text-[#2D0652] rounded-pill text-xs font-medium border border-[#2D0652]/15">
                {isRouanet ? 'Roteiro Lei Rouanet (IN MinC nº 29/2026 - 12 Etapas)' : 'Roteiro de 11 Etapas • Base 100% Oficial'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-normal text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
              Auxílio ao Fazedor de Cultura
            </h1>

            <p className="text-xs sm:text-sm text-[#2D0652]/80 leading-relaxed font-medium">
              Condução estruturada para construir seu projeto cultural do início ao fim, etapa por etapa. Todas as orientações derivam exclusivamente da legislação oficial e dados de Viamão. O documento é seu e você pode editar qualquer seção diretamente.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            <button
              onClick={handleDownloadDocx}
              disabled={isExportingDocx}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-pill bg-[#6A0DAD] hover:bg-[#580B91] text-white font-medium text-xs transition-all shadow-tint-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-[#F5EAD8]" />
              <span>{isExportingDocx ? 'Gerando .docx...' : 'Baixar Projeto em .docx'}</span>
            </button>

            {isGoogleDriveConfigured() && (
              <button
                onClick={handleSaveGoogleDrive}
                disabled={isExportingDrive}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-pill bg-white hover:bg-[#FAF4EB] text-[#2D0652] text-xs font-medium border border-[#2D0652]/15 transition-colors cursor-pointer disabled:opacity-50 shadow-tint-sm"
              >
                <FileText className="w-3.5 h-3.5 text-[#166534]" />
                <span>{isExportingDrive ? 'Salvando no Drive...' : 'Salvar no meu Google Drive'}</span>
              </button>
            )}

            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-pill bg-white hover:bg-[#FAF4EB] text-[#B91C1C] text-xs font-medium border border-[#B91C1C]/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#B91C1C]" />
              <span>Apagar rascunho</span>
            </button>
          </div>
        </div>

        {/* Barra de Progresso do Roteiro */}
        <div className="mt-6 pt-5 border-t border-[#2D0652]/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#2D0652]">
                Progresso: {filledCount} de {totalEtapas} seções preenchidas ({progressPercent}%)
              </span>
              <span className="text-[#6A0DAD] font-medium">
                • Etapa atual: {currentEtapa} de {totalEtapas} ({currentEtapaConfig.nome})
              </span>
            </div>

            {/* Controle de navegação de etapa */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentEtapa(p => Math.max(1, p - 1))}
                disabled={currentEtapa <= 1}
                className="p-1 rounded-pill border border-[#2D0652]/15 bg-white text-[#2D0652] disabled:opacity-30 hover:bg-[#FAF4EB] cursor-pointer"
                title="Etapa anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-medium text-[#2D0652] px-2">
                Etapa {currentEtapa} / {totalEtapas}
              </span>
              <button
                onClick={() => setCurrentEtapa(p => Math.min(totalEtapas, p + 1))}
                disabled={currentEtapa >= totalEtapas}
                className="p-1 rounded-pill border border-[#2D0652]/15 bg-white text-[#2D0652] disabled:opacity-30 hover:bg-[#FAF4EB] cursor-pointer"
                title="Próxima etapa"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="w-full bg-white rounded-pill h-2 overflow-hidden border border-[#2D0652]/10">
            <div
              className="bg-gradient-to-r from-[#6A0DAD] to-[#FF4500] h-full transition-all duration-300 rounded-pill"
              style={{ width: `${Math.max(5, (currentEtapa / totalEtapas) * 100)}%` }}
            />
          </div>

          {/* Stepper horizontal clicável */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {currentRoteiro.map(et => {
              const isFilled = Boolean(sections[et.chave]?.trim());
              const isCurrent = currentEtapa === et.etapa;
              return (
                <button
                  key={et.etapa}
                  onClick={() => {
                    setCurrentEtapa(et.etapa);
                    setExpandedSection(et.chave);
                  }}
                  title={et.fundamentacaoLegal || et.descricao}
                  className={`shrink-0 px-2.5 py-1 rounded-pill text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-[#6A0DAD] text-white shadow-tint-sm'
                      : isFilled
                      ? 'bg-[#DCFCE7] text-[#166534] border border-[#166534]/20'
                      : 'bg-white text-[#2D0652]/70 hover:bg-[#FAF4EB] border border-[#2D0652]/10'
                  }`}
                >
                  <span>{et.etapa}. {et.nome}</span>
                  {isFilled && <Check className="w-3 h-3 text-[#166534]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Abas Superiores */}
        <div className="mt-4 pt-4 border-t border-[#2D0652]/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('consultoria')}
              className={`flex items-center gap-2 px-5 py-2 rounded-pill text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'consultoria'
                  ? 'bg-[#6A0DAD] text-white shadow-tint-sm'
                  : 'bg-white text-[#2D0652] hover:bg-[#FAF4EB] border border-[#2D0652]/15'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#FF4500]" />
              <span>Construção Guiada & Painel do Projeto</span>
            </button>

            <button
              onClick={() => setActiveTab('guia')}
              className={`flex items-center gap-2 px-5 py-2 rounded-pill text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'guia'
                  ? 'bg-[#6A0DAD] text-white shadow-tint-sm'
                  : 'bg-white text-[#2D0652] hover:bg-[#FAF4EB] border border-[#2D0652]/15'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#6A0DAD]" />
              <span>Base Oficial & Editais de Viamão</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#2D0652]/60 font-medium hidden sm:inline">
              Rascunho salvo exclusivamente no seu navegador (LGPD ativa)
            </span>
          </div>
        </div>
      </div>

      {/* Confirmação de Apagar Rascunho */}
      {showClearConfirm && (
        <div className="bg-[#FEF2F2] border border-[#EF4444]/30 rounded-container p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-tint-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-normal text-[#B91C1C]">Tem certeza de que deseja apagar o rascunho?</h4>
              <p className="text-xs text-[#2D0652]/80 mt-0.5">
                Todo o conteúdo do chat e as seções preenchidas no seu navegador serão reiniciados para o estado inicial.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-white text-[#2D0652] rounded-pill border border-[#2D0652]/15 text-xs font-medium hover:bg-[#FAF4EB] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetDraft}
              className="px-3.5 py-1.5 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-pill text-xs font-medium cursor-pointer"
            >
              Sim, apagar tudo
            </button>
          </div>
        </div>
      )}

      {/* Visão Principal: Construção Guiada (Chat + Painel 'Seu Projeto') */}
      {activeTab === 'consultoria' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna da Esquerda: Chat Interativo (7 colunas em telas grandes) */}
          <div className="lg:col-span-7 flex flex-col h-[700px] bg-white border border-[#2D0652]/10 rounded-container overflow-hidden shadow-tint-sm">
            {/* Header do Chat com o subtítulo solicitado */}
            <div className="px-5 py-3.5 bg-[#FAF4EB] border-b border-[#2D0652]/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-pill bg-[#6A0DAD] flex items-center justify-center text-white font-medium shadow-tint-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-normal text-[#2D0652]">
                    Assistente Oficial ao Fazedor de Cultura
                  </h2>
                  <div className="text-[10px] text-[#2D0652]/70 font-medium">
                    Inteligência especializada em PNAB, Lei Paulo Gustavo, Lei Rouanet e Emendas Parlamentares
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#EFE6FD] text-[#6A0DAD] rounded-pill text-[10px] font-medium border border-[#6A0DAD]/20">
                  Etapa {currentEtapa}/{totalEtapas}
                </span>
              </div>
            </div>

            {/* Lista de Mensagens */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-white"
            >
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-pill bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 mt-1 shadow-tint-sm">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[80%] px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#6A0DAD] text-white rounded-card rounded-br-xs shadow-tint-sm'
                        : msg.isError
                        ? 'bg-[#FEF2F2] text-[#991B1B] border border-[#EF4444]/30 rounded-card rounded-bl-xs'
                        : 'bg-[#FAF4EB] text-[#2D0652] border border-[#2D0652]/10 rounded-card rounded-bl-xs shadow-tint-sm'
                    }`}
                  >
                    <div className="prose prose-xs max-w-none text-current">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {/* Fontes oficiais citadas nesta mensagem */}
                    {msg.fontesCitadas && msg.fontesCitadas.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-[#2D0652]/10 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-[#6A0DAD]">
                          <ShieldCheck className="w-3 h-3 text-[#166534]" />
                          <span>Fontes Oficiais Citadas:</span>
                        </div>
                        {msg.fontesCitadas.map((f, i) => (
                          <div key={i} className="text-[10px] bg-white/70 p-1.5 rounded text-[#2D0652] border border-[#2D0652]/10">
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

                    <div className="text-[10px] text-right mt-1.5 opacity-60">
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
                <div className="flex gap-3 justify-start items-center">
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

            {/* Chips de Sugestões Contextuais por Etapa */}
            <div className="px-4 py-2 bg-[#FAF4EB] border-t border-[#2D0652]/10 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#2D0652]/70 font-medium shrink-0 text-[11px]">
                Sugestões da Etapa {currentEtapa}:
              </span>
              {currentEtapaConfig.sugestoes.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  disabled={isLoading}
                  className="shrink-0 px-3 py-1 bg-white hover:bg-[#FAF4EB] text-[#2D0652] rounded-pill border border-[#2D0652]/15 font-medium transition-colors cursor-pointer text-xs disabled:opacity-50"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Barra de Entrada de Mensagem */}
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
                  placeholder={currentEtapaConfig.perguntaPadrao}
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

          {/* Coluna da Direita: Painel 'Seu Projeto' Editável (5 colunas em telas grandes) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-[#2D0652]/10 rounded-container p-5 shadow-tint-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2D0652]/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF4500]" />
                  <h3 className="text-xs font-normal text-[#2D0652]">
                    Seu Projeto {isRouanet ? '(Estrutura Lei Rouanet - Salic)' : '(Documento Editável)'}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyProjectText}
                    className="p-1.5 rounded-pill bg-[#FAF4EB] text-[#2D0652] hover:bg-[#EFE6FD] text-[10px] font-medium border border-[#2D0652]/10 flex items-center gap-1 cursor-pointer"
                    title="Copiar texto completo"
                  >
                    {copiedDraft ? <Check className="w-3 h-3 text-[#166534]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDraft ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    disabled={isExportingDocx}
                    className="px-2.5 py-1 rounded-pill bg-[#6A0DAD] text-white hover:bg-[#580B91] text-[10px] font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    title="Baixar em Word .docx"
                  >
                    <FileDown className="w-3 h-3" />
                    <span>.docx</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#2D0652]/70 bg-[#FAF4EB] p-2.5 rounded-card border border-[#2D0652]/10 flex items-start gap-2">
                <Info className="w-4 h-4 text-[#6A0DAD] shrink-0 mt-0.5" />
                <span>
                  O assistente preenche as seções conforme você responde. Você pode <strong>editar qualquer texto diretamente</strong>. O que você digitar tem prioridade e não será sobrescrito.
                </span>
              </div>

              {/* Se houver link do Google Drive aberto nesta sessão */}
              {driveDocUrl && (
                <div className="bg-[#DCFCE7] border border-[#166534]/30 rounded-card p-3 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#166534] font-medium">
                    <Check className="w-4 h-4" />
                    <span>Documento salvo no Google Drive!</span>
                  </div>
                  <a
                    href={driveDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#166534] text-white rounded-pill font-medium text-[11px] hover:bg-[#14532d]"
                  >
                    <span>Abrir Google Doc</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Lista Acordeão das Seções Editáveis (Padrão ou Rouanet) */}
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {currentRoteiro.map(et => {
                  const val = sections[et.chave] || '';
                  const hasContent = Boolean(val.trim());
                  const isUserEdited = Boolean(manuallyEdited[et.chave]);
                  const hasAiSuggestion = Boolean(aiSuggestions[et.chave]);
                  const isExpanded = expandedSection === et.chave;

                  return (
                    <div
                      key={et.chave}
                      className={`border rounded-card transition-all overflow-hidden ${
                        isExpanded
                          ? 'border-[#6A0DAD] bg-white shadow-tint-sm'
                          : 'border-[#2D0652]/10 bg-[#FAF4EB]/60 hover:bg-[#FAF4EB]'
                      }`}
                    >
                      {/* Header da Seção */}
                      <button
                        type="button"
                        onClick={() => setExpandedSection(isExpanded ? null : et.chave)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-5 h-5 rounded-pill flex items-center justify-center text-[10px] font-medium shrink-0 ${
                              hasContent
                                ? 'bg-[#166534] text-white'
                                : 'bg-[#2D0652]/10 text-[#2D0652]'
                            }`}
                          >
                            {et.etapa}
                          </span>
                          <span className="text-xs font-medium text-[#2D0652] truncate">
                            {et.nome}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUserEdited && (
                            <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-medium bg-[#EFE6FD] text-[#6A0DAD] border border-[#6A0DAD]/20">
                              Manual
                            </span>
                          )}
                          {hasContent ? (
                            <Check className="w-3.5 h-3.5 text-[#166534]" />
                          ) : (
                            <span className="text-[10px] text-[#2D0652]/40 font-medium">Vazia</span>
                          )}
                        </div>
                      </button>

                      {/* Corpo da Seção Editável */}
                      {isExpanded && (
                        <div className="p-3.5 pt-0 border-t border-[#2D0652]/10 space-y-2.5 bg-white">
                          <div className="flex items-center justify-between text-[11px] text-[#2D0652]/70">
                            <span>{et.descricao}</span>
                            {et.fundamentacaoLegal && (
                              <span className="text-[10px] text-[#6A0DAD] bg-[#EFE6FD] px-2 py-0.5 rounded">
                                {et.fundamentacaoLegal}
                              </span>
                            )}
                          </div>

                          {/* Alerta de sugestão da IA quando usuário já havia editado */}
                          {hasAiSuggestion && (
                            <div className="bg-[#FFF7ED] border border-[#FF4500]/30 rounded-card p-2.5 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-[#FF4500] font-medium text-[11px]">
                                <span className="flex items-center gap-1">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Nova sugestão do assistente de IA disponível:
                                </span>
                              </div>
                              <p className="text-[11px] text-[#2D0652] bg-white p-2 rounded border border-[#FF4500]/20 max-h-24 overflow-y-auto font-mono">
                                {aiSuggestions[et.chave]}
                              </p>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleApplyAiSuggestion(et.chave)}
                                  className="px-2.5 py-1 bg-[#FF4500] text-white rounded-pill font-medium text-[10px] hover:bg-[#E03D00] cursor-pointer"
                                >
                                  Substituir pela sugestão
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDismissAiSuggestion(et.chave)}
                                  className="px-2.5 py-1 bg-white text-[#2D0652] border border-[#2D0652]/15 rounded-pill font-medium text-[10px] hover:bg-[#FAF4EB] cursor-pointer"
                                >
                                  Manter minha versão
                                </button>
                              </div>
                            </div>
                          )}

                          <textarea
                            value={val}
                            onChange={e => handleSectionManualChange(et.chave, e.target.value)}
                            placeholder={`Digite aqui o conteúdo da seção ${et.nome}...`}
                            rows={4}
                            className="w-full text-xs p-2.5 rounded-card border border-[#2D0652]/20 text-[#2D0652] focus:outline-hidden focus:ring-1 focus:ring-[#6A0DAD] focus:border-[#6A0DAD] leading-relaxed resize-y font-sans"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Seção Especial: Conferência de Regras da Lei Rouanet */}
              {isRouanet && (
                <div className="mt-3 p-3.5 bg-[#FAF4EB] border border-[#6A0DAD]/30 rounded-card space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-[#2D0652] font-medium">
                      <ShieldCheck className="w-4 h-4 text-[#6A0DAD]" />
                      <span>Conferência de Regras (IN MinC nº 29/2026)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-pill bg-[#EFE6FD] text-[#6A0DAD] font-medium">
                      Validação por Código
                    </span>
                  </div>

                  <p className="text-[11px] text-[#2D0652]/80 leading-snug">
                    O orçamento e as regras objetivas são conferidos diretamente contra a base legal:
                  </p>

                  <div className="space-y-1.5 text-[10px]">
                    <div className="p-1.5 bg-white rounded border border-[#2D0652]/10 flex items-start gap-1">
                      <span className="text-[#166534] font-medium">✔</span>
                      <span><strong>Custos Administrativos:</strong> máx. 15% do valor total (Art. 19).</span>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-[#2D0652]/10 flex items-start gap-1">
                      <span className="text-[#166534] font-medium">✔</span>
                      <span><strong>Captação de Recursos:</strong> máx. 10% e teto de R$ 150.000,00 (Art. 23).</span>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-[#2D0652]/10 flex items-start gap-1">
                      <span className="text-[#166534] font-medium">✔</span>
                      <span><strong>Cachê Individual:</strong> teto de R$ 25.000,00 por artista (Art. 26).</span>
                    </div>
                    <div className="p-1.5 bg-white rounded border border-[#2D0652]/10 flex items-start gap-1">
                      <span className="text-[#166534] font-medium">✔</span>
                      <span><strong>Democratização:</strong> cota mínima de 10% gratuita socioeducativa e 20% ingressos populares até R$ 50,00 (Art. 41).</span>
                    </div>
                  </div>

                  {conferenciaRegras && (
                    <div className="mt-2 pt-2 border-t border-[#2D0652]/10 text-[10px]">
                      <div className="font-medium text-[#2D0652]">Resultado da Checagem do Orçamento:</div>
                      <div className="text-[#166534]">{conferenciaRegras.resumo}</div>
                    </div>
                  )}

                  <div className="p-2 bg-[#FFFBEB] rounded border border-[#F59E0B]/30 text-[10px] text-[#92400E] leading-relaxed">
                    <strong>Honestidade e Transparência:</strong> O assistente ajuda a estruturar a proposta técnica, mas <strong>não garante aprovação</strong> (competência do MinC/CNIC - Arts. 45 a 50). A aprovação autoriza a captação com patrocinadores e a execução depende do sucesso dessa captação (Arts. 47 e 48). O envio é feito diretamente por você no Salic.
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Exemplos Temáticos (Sem orçamentos inventados) */}
            <div className="bg-[#FAF4EB] border border-[#2D0652]/10 rounded-container p-4 shadow-tint-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#2D0652]/10">
                <Sparkles className="w-4 h-4 text-[#FF4500]" />
                <h4 className="text-xs font-normal text-[#2D0652]">
                  Exemplos Temáticos de Inspiração
                </h4>
              </div>

              <p className="text-[11px] text-[#2D0652]/70 font-medium">
                Clique para carregar uma ideia inicial de projeto na conversa (o orçamento será definido livremente por você):
              </p>

              <div className="grid grid-cols-1 gap-2">
                {PROJETOS_EXEMPLO.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectExample(ex)}
                    className="w-full text-left p-2.5 rounded-card bg-white hover:bg-[#FAF4EB] border border-[#2D0652]/10 transition-all group cursor-pointer shadow-tint-sm"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-medium text-[#2D0652] group-hover:text-[#6A0DAD]">
                        {ex.titulo}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6A0DAD] group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className="px-1.5 py-0.5 bg-[#EFE6FD] text-[#6A0DAD] rounded font-medium">
                        {ex.editalSugerido}
                      </span>
                      <span className="text-[#2D0652]/60 truncate font-medium">
                        {ex.segmento}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visão Secundária: Base Oficial & Editais de Viamão */}
      {activeTab === 'guia' && (
        <div className="bg-white border border-[#2D0652]/10 rounded-container p-6 space-y-6 shadow-tint-sm">
          <div className="space-y-1">
            <h2 className="text-lg font-normal text-[#2D0652]">
              Base Legal Oficial de Viamão & Normativas Federais
            </h2>
            <p className="text-xs sm:text-sm text-[#2D0652]/70 font-medium">
              Todo o conhecimento consultado pelo assistente vem exclusivamente de fontes estatais publicadas. A Instrução Normativa MinC nº 23/2025 foi revogada pela Instrução Normativa MinC nº 29/2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#FAF4EB] rounded-card border border-[#2D0652]/10 space-y-2">
              <span className="text-xs font-medium text-[#6A0DAD]">Lei Rouanet (Pronac)</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei nº 8.313/1991 & IN MinC nº 29/2026</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Regulamenta a apresentação de propostas no Salic, limites orçamentários objetivos (Arts. 11, 16, 19, 22, 23 e 26), democratização (Art. 41) e acessibilidade (Arts. 20, 38 a 40).
              </p>
              <a
                href="https://www.gov.br/cultura/pt-br/acesso-a-informacao/legislacao-e-normativas/instrucao-normativa-minc-no-29-de-29-de-janeiro-de-2026"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#6A0DAD] font-medium hover:underline pt-1"
              >
                <span>Acessar portal oficial do MinC</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="p-4 bg-[#FAF4EB] rounded-card border border-[#2D0652]/10 space-y-2">
              <span className="text-xs font-medium text-[#6A0DAD]">PNAB - Política Nacional Aldir Blanc</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei nº 14.399/2022 & Decreto 11.740/2023</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Fomento contínuo para fazedores de cultura, pontos de cultura e editais com cotas afirmativas e democratização de acesso em Viamão.
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
                Apoio emergencial e estruturante ao setor audiovisual e demais linguagens artísticas executado pelo município de Viamão.
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
              <span className="text-xs font-medium text-[#6A0DAD]">Marco Regulatório da Cultura</span>
              <h3 className="text-sm font-normal text-[#2D0652]">Lei nº 14.903/2024</h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Marco Regulatório do Fomento à Cultura e simplificação de prestações de contas com foco no cumprimento do objeto cultural.
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
