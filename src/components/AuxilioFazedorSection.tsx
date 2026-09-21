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
  PROJETOS_EXEMPLO,
  ExemploTema,
} from '../services/culturalAiService';
import {
  ProjectDraftSections,
  downloadProjectDocx,
} from '../utils/docxExport';
import {
  isGoogleDriveConfigured,
  exportToGoogleDrive,
} from '../utils/googleDriveExport';
import { LottieStateAnimation } from './lottie/LottieStateAnimation';

interface AuxilioFazedorSectionProps {
  onShowToast?: (msg: string) => void;
}

const STORAGE_KEY = 'cultura_projeto_draft_v2';

const INITIAL_WELCOME_CONTENT = `👋 **Olá, Fazedor(a) de Cultura de Viamão!**

Sou seu assistente de elaboração técnica de projetos culturais da plataforma Cultura Transparente. Vamos estruturar sua proposta juntos, passo a passo, em 11 etapas com fundamentação estritamente nas regras e editais oficiais.

Para qual edital ou política cultural você deseja preparar seu projeto (PNAB, Lei Paulo Gustavo, emenda parlamentar ou edital municipal de Viamão)?`;

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

  // Rascunho das 11 seções
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

  // Auto-save local draft
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          sections,
          manuallyEdited,
          currentEtapa,
        })
      );
    } catch (e) {
      console.warn('Falha ao salvar rascunho no localStorage:', e);
    }
  }, [sections, manuallyEdited, currentEtapa]);

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

  const currentEtapaConfig = ROTEIRO_ETAPAS.find(e => e.etapa === currentEtapa) || ROTEIRO_ETAPAS[0];

  // Envio de mensagem para a IA
  const handleSendMessage = async (userTextToSend?: string) => {
    const text = (userTextToSend || inputMessage).trim();
    if (!text || isLoading) return;

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
      // Injeta instrução leve de contexto local caso o usuário tenha editado seções
      const historyPayload = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendMessageToAssistant(historyPayload);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        etapaAtual: res.etapaAtual,
        secoesAtualizadas: res.secoesAtualizadas,
        fontesCitadas: res.fontesCitadas,
        pendencias: res.pendencias,
        isError: res.isError,
      };

      setMessages(prev => [...prev, botMsg]);

      if (res.etapaAtual && res.etapaAtual >= 1 && res.etapaAtual <= 11) {
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

            // Se o usuário editou manualmente esta seção e o valor é diferente, não sobrescreve!
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
    // Se o usuário editou, limpa qualquer sugestão pendente dessa seção
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
    };
    setSections(emptySections);
    setManuallyEdited({});
    setAiSuggestions({});
    setFontesCitadas([]);
    setPendencias([]);
    setCurrentEtapa(1);
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
        projectName: sections.ideia_projeto?.slice(0, 50) || 'Projeto_Cultural_Viamao',
        proponentName: sections.tipo_proponente,
        sections,
        fontesCitadas,
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
        title: sections.ideia_projeto?.slice(0, 60) || 'Projeto Cultural Viamão',
        sections,
        fontesCitadas,
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
    const lines = ROTEIRO_ETAPAS.map(e => {
      const val = sections[e.chave] || '[Pendente]';
      return `### ${e.etapa}. ${e.nome}\n${val}\n`;
    });
    const fullText = `# PROJETO CULTURAL - VIAMÃO/RS\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDraft(true);
    if (onShowToast) onShowToast('Texto do projeto copiado para a área de transferência!');
    setTimeout(() => setCopiedDraft(false), 3000);
  };

  // Carregar modelo temático
  const handleSelectExample = (ex: ExemploTema) => {
    setCurrentEtapa(2);
    const textToSend = `Meu edital pretendido é ${ex.editalSugerido}. Minha ideia é: ${ex.ideiaInicial}`;
    handleSendMessage(textToSend);
  };

  // Percentual de preenchimento
  const filledCount = ROTEIRO_ETAPAS.filter(e => Boolean(sections[e.chave]?.trim())).length;
  const progressPercent = Math.round((filledCount / 11) * 100);

  return (
    <div className="space-y-6">
      {/* Top Banner de Identidade Visual */}
      <div className="bg-[#FAF4EB] rounded-container p-6 sm:p-8 border border-[#2D0652]/10 shadow-tint-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 bg-[#EFE6FD] text-[#6A0DAD] border border-[#6A0DAD]/20 rounded-pill text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                Elaboração Orientada de Projetos Culturais
              </span>
              <span className="px-3 py-0.5 bg-white text-[#2D0652] rounded-pill text-xs font-bold border border-[#2D0652]/15">
                Roteiro de 11 Etapas • Base 100% Oficial
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-pill bg-[#6A0DAD] hover:bg-[#580B91] text-white font-bold text-xs transition-all shadow-tint-sm cursor-pointer disabled:opacity-50"
            >
              <FileDown className="w-4 h-4 text-[#F5EAD8]" />
              <span>{isExportingDocx ? 'Gerando .docx...' : 'Baixar Projeto em .docx'}</span>
            </button>

            {isGoogleDriveConfigured() && (
              <button
                onClick={handleSaveGoogleDrive}
                disabled={isExportingDrive}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-pill bg-white hover:bg-[#FAF4EB] text-[#2D0652] text-xs font-bold border border-[#2D0652]/15 transition-colors cursor-pointer disabled:opacity-50 shadow-tint-sm"
              >
                <FileText className="w-3.5 h-3.5 text-[#166534]" />
                <span>{isExportingDrive ? 'Salvando no Drive...' : 'Salvar no meu Google Drive'}</span>
              </button>
            )}

            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-pill bg-white hover:bg-[#FAF4EB] text-[#B91C1C] text-xs font-bold border border-[#B91C1C]/20 transition-colors cursor-pointer"
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
              <span className="font-bold text-[#2D0652]">
                Progresso: {filledCount} de 11 seções preenchidas ({progressPercent}%)
              </span>
              <span className="text-[#6A0DAD] font-semibold">
                • Etapa atual: {currentEtapa} de 11 ({currentEtapaConfig.nome})
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
              <span className="text-xs font-bold text-[#2D0652] px-2">
                Etapa {currentEtapa} / 11
              </span>
              <button
                onClick={() => setCurrentEtapa(p => Math.min(11, p + 1))}
                disabled={currentEtapa >= 11}
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
              style={{ width: `${Math.max(5, (currentEtapa / 11) * 100)}%` }}
            />
          </div>

          {/* Stepper horizontal clicável */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 scrollbar-none">
            {ROTEIRO_ETAPAS.map(et => {
              const isFilled = Boolean(sections[et.chave]?.trim());
              const isCurrent = currentEtapa === et.etapa;
              return (
                <button
                  key={et.etapa}
                  onClick={() => {
                    setCurrentEtapa(et.etapa);
                    setExpandedSection(et.chave);
                  }}
                  className={`shrink-0 px-2.5 py-1 rounded-pill text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`flex items-center gap-2 px-5 py-2 rounded-pill text-xs font-bold transition-all cursor-pointer ${
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
              className={`flex items-center gap-2 px-5 py-2 rounded-pill text-xs font-bold transition-all cursor-pointer ${
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
              <h4 className="text-xs font-bold text-[#B91C1C]">Tem certeza de que deseja apagar o rascunho?</h4>
              <p className="text-xs text-[#2D0652]/80 mt-0.5">
                Todo o conteúdo do chat e as seções preenchidas no seu navegador serão reiniciados para o estado inicial.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-white text-[#2D0652] rounded-pill border border-[#2D0652]/15 text-xs font-bold hover:bg-[#FAF4EB] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleResetDraft}
              className="px-3.5 py-1.5 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-pill text-xs font-bold cursor-pointer"
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
            {/* Header do Chat */}
            <div className="px-5 py-3.5 bg-[#FAF4EB] border-b border-[#2D0652]/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-pill bg-[#6A0DAD] flex items-center justify-center text-white font-bold shadow-tint-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#2D0652]">
                    Assistente Oficial ao Fazedor de Cultura
                  </h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#2D0652]/70 font-medium">
                    <span className="w-1.5 h-1.5 rounded-pill bg-emerald-500"></span>
                    <span>Etapa {currentEtapa} de 11: {currentEtapaConfig.nome} • Uma pergunta por vez</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#EFE6FD] text-[#6A0DAD] rounded-pill text-[10px] font-bold border border-[#6A0DAD]/20">
                  {currentEtapaConfig.chave}
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
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#6A0DAD]">
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
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#FF4500]">
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
                        ? 'Consultando normativas e estruturando a proposta técnica…'
                        : 'O assistente está consultando as bases oficiais de Viamão…'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chips de Sugestões Contextuais por Etapa */}
            <div className="px-4 py-2 bg-[#FAF4EB] border-t border-[#2D0652]/10 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#2D0652]/70 font-bold shrink-0 text-[11px]">
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
                  className="px-5 py-2.5 rounded-pill bg-[#6A0DAD] hover:bg-[#580B91] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-tint-sm cursor-pointer"
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
                  <h3 className="text-xs font-bold text-[#2D0652]">
                    Seu Projeto (Documento Editável)
                  </h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyProjectText}
                    className="p-1.5 rounded-pill bg-[#FAF4EB] text-[#2D0652] hover:bg-[#EFE6FD] text-[10px] font-bold border border-[#2D0652]/10 flex items-center gap-1 cursor-pointer"
                    title="Copiar texto completo"
                  >
                    {copiedDraft ? <Check className="w-3 h-3 text-[#166534]" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedDraft ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                  <button
                    onClick={handleDownloadDocx}
                    disabled={isExportingDocx}
                    className="px-2.5 py-1 rounded-pill bg-[#6A0DAD] text-white hover:bg-[#580B91] text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
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
                  <div className="flex items-center gap-2 text-[#166534] font-bold">
                    <Check className="w-4 h-4" />
                    <span>Documento salvo no Google Drive!</span>
                  </div>
                  <a
                    href={driveDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[#166534] text-white rounded-pill font-bold text-[11px] hover:bg-[#14532d]"
                  >
                    <span>Abrir Google Doc</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Lista Acordeão das 11 Seções Editáveis */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {ROTEIRO_ETAPAS.map(et => {
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
                            className={`w-5 h-5 rounded-pill flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              hasContent
                                ? 'bg-[#166534] text-white'
                                : 'bg-[#2D0652]/10 text-[#2D0652]'
                            }`}
                          >
                            {et.etapa}
                          </span>
                          <span className="text-xs font-bold text-[#2D0652] truncate">
                            {et.nome}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUserEdited && (
                            <span className="px-1.5 py-0.5 rounded-pill text-[9px] font-bold bg-[#EFE6FD] text-[#6A0DAD] border border-[#6A0DAD]/20">
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
                          <p className="text-[11px] text-[#2D0652]/70 font-medium">
                            {et.descricao}
                          </p>

                          {/* Alerta de sugestão da IA quando usuário já havia editado */}
                          {hasAiSuggestion && (
                            <div className="bg-[#FFF7ED] border border-[#FF4500]/30 rounded-card p-2.5 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between text-[#FF4500] font-bold text-[11px]">
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
                                  className="px-2.5 py-1 bg-[#FF4500] text-white rounded-pill font-bold text-[10px] hover:bg-[#E03D00] cursor-pointer"
                                >
                                  Substituir pela sugestão
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDismissAiSuggestion(et.chave)}
                                  className="px-2.5 py-1 bg-white text-[#2D0652] border border-[#2D0652]/15 rounded-pill font-bold text-[10px] hover:bg-[#FAF4EB] cursor-pointer"
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
            </div>

            {/* Painel de Exemplos Temáticos (Sem orçamentos inventados) */}
            <div className="bg-[#FAF4EB] border border-[#2D0652]/10 rounded-container p-4 shadow-tint-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#2D0652]/10">
                <Sparkles className="w-4 h-4 text-[#FF4500]" />
                <h4 className="text-xs font-bold text-[#2D0652]">
                  Exemplos Temáticos de Inspiração
                </h4>
              </div>

              <p className="text-[11px] text-[#2D0652]/70">
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
                      <span className="text-xs font-bold text-[#2D0652] group-hover:text-[#6A0DAD]">
                        {ex.titulo}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6A0DAD] group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                      <span className="bg-[#EFE6FD] text-[#6A0DAD] px-2 py-0.5 rounded-pill font-bold border border-[#6A0DAD]/20">
                        {ex.editalSugerido}
                      </span>
                      <span className="text-[#2D0652]/60">{ex.segmento}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visão Secundária: Base Oficial & Legislação de Viamão */}
      {activeTab === 'guia' && (
        <div className="space-y-4">
          <div className="bg-[#FAF4EB] border border-[#2D0652]/10 rounded-container p-6 space-y-4 shadow-tint-sm">
            <div className="flex items-center gap-2 text-[#2D0652]">
              <ShieldCheck className="w-5 h-5 text-[#166534]" />
              <h2 className="text-base font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                Base Oficial e Legislação Integrada
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#2D0652]/80 leading-relaxed font-medium">
              O assistente de elaboração cultural foi configurado com base estritamente nos marcos regulatórios, leis federais e normas de fomento vigentes no Brasil e em Viamão/RS:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-white p-4 rounded-card border border-[#2D0652]/10 shadow-tint-sm space-y-2">
                <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-[#EFE6FD] text-[#6A0DAD] border border-[#6A0DAD]/20">
                  Lei Federal nº 14.399/2022
                </span>
                <h3 className="text-xs font-bold text-[#2D0652]">PNAB - Política Nacional Aldir Blanc</h3>
                <p className="text-xs text-[#2D0652]/70 leading-relaxed">
                  Fomento cultural continuado e descentralizado. Exige destinação prioritária para ações periféricas, planos de acessibilidade física e comunicacional e contrapartida social gratuita.
                </p>
              </div>

              <div className="bg-white p-4 rounded-card border border-[#2D0652]/10 shadow-tint-sm space-y-2">
                <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-[#DCFCE7] text-[#166534] border border-[#166534]/20">
                  Lei Complementar nº 195/2022
                </span>
                <h3 className="text-xs font-bold text-[#2D0652]">LPG - Lei Paulo Gustavo</h3>
                <p className="text-xs text-[#2D0652]/70 leading-relaxed">
                  Ações emergenciais e estruturantes voltadas ao setor audiovisual, salas de cinema, mostras comunitárias e demais linguagens artísticas em âmbito municipal.
                </p>
              </div>

              <div className="bg-white p-4 rounded-card border border-[#2D0652]/10 shadow-tint-sm space-y-2">
                <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-[#FFE8E0] text-[#FF4500] border border-[#FF4500]/20">
                  Lei Federal nº 14.903/2024
                </span>
                <h3 className="text-xs font-bold text-[#2D0652]">Marco Regulatório do Fomento à Cultura</h3>
                <p className="text-xs text-[#2D0652]/70 leading-relaxed">
                  Estabelece o Termo de Execução Cultural (TEC), Termo de Premiação Cultural e procedimentos simplificados de prestação de informações com foco no objeto realizado.
                </p>
              </div>

              <div className="bg-white p-4 rounded-card border border-[#2D0652]/10 shadow-tint-sm space-y-2">
                <span className="px-2.5 py-0.5 rounded-pill text-[10px] font-bold bg-[#FAF4EB] text-[#2D0652] border border-[#2D0652]/20">
                  Lei Federal nº 13.019/2014 & Lei 13.146/2015
                </span>
                <h3 className="text-xs font-bold text-[#2D0652]">MROSC & Estatuto da Pessoa com Deficiência</h3>
                <p className="text-xs text-[#2D0652]/70 leading-relaxed">
                  Normas gerais para parcerias com a sociedade civil e garantia de acessibilidade comunicacional (Libras, audiodescrição e material ampliado) em eventos públicos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
