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
  Award,
  AlertCircle,
  HelpCircle,
  FolderDown,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChatMessage,
  sendMessageToAssistant,
  PROJETOS_EXEMPLO,
} from '../services/culturalAiService';
import { exportElementToPdf } from '../utils/pdfGenerator';

interface AuxilioFazedorSectionProps {
  onShowToast?: (msg: string) => void;
}

export const AuxilioFazedorSection: React.FC<AuxilioFazedorSectionProps> = ({ onShowToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'projeto' | 'editais'>('chat');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedProject, setCopiedProject] = useState(false);
  const [consolidatedMarkdown, setConsolidatedMarkdown] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      timestamp: 'Agora',
      content: `👋 **Olá, Fazedor de Cultura de Viamão!**\n\nSou seu **Consultor Inteligente de Elaboração de Projetos Culturais**. Meu papel é te ajudar a estruturar uma proposta técnica sólida, competitiva e 100% aderente às exigências de editais como **PNAB (Lei Aldir Blanc)**, **FAC-RS**, **LPG** e **Lei Rouanet**.\n\nPara começarmos a construir seu projeto passo a passo:\n\n1. **Qual é a sua ideia ou projeto cultural** (ex: show, oficina comunitária, festival, peça de teatro, livro, documentário)?\n2. **Para qual edital você planeja se inscrever?**`,
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const projectPrintRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Garantir que ao abrir a aba ela sempre comece do topo da página
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  // Rolar apenas o container interno de mensagens quando houver nova mensagem (não a página inteira)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeSubTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading, activeSubTab]);

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
        isProjectFinal: res.hasFinalProject,
      };

      setMessages(prev => [...prev, botMsg]);

      if (res.hasFinalProject && res.finalProjectMarkdown) {
        setConsolidatedMarkdown(res.finalProjectMarkdown);
        if (onShowToast) {
          onShowToast('🎉 Projeto Cultural Consolidado! Pronto para exportação em PDF.');
        }
      }
    } catch (err) {
      console.error('Erro ao processar mensagem:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Desculpe, ocorreu uma instabilidade momentânea na conexão. Por favor, tente enviar novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectExample = (ex: typeof PROJETOS_EXEMPLO[0]) => {
    setInputMessage(ex.promptInicial);
  };

  const handleExportPdf = async () => {
    if (!projectPrintRef.current && !consolidatedMarkdown) {
      if (onShowToast) onShowToast('Gere o projeto antes de exportar.');
      return;
    }

    setIsExportingPdf(true);
    if (onShowToast) onShowToast('Gerando PDF com formatação técnica oficial...');

    try {
      if (projectPrintRef.current) {
        await exportElementToPdf(projectPrintRef.current, {
          projectName: 'Projeto_Cultural_Viamao',
        });
        if (onShowToast) onShowToast('PDF gerado e baixado com sucesso!');
      }
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast('Erro ao gerar PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!consolidatedMarkdown) return;
    navigator.clipboard.writeText(consolidatedMarkdown);
    setCopiedProject(true);
    if (onShowToast) onShowToast('Texto do projeto copiado para a área de transferência!');
    setTimeout(() => setCopiedProject(false), 3000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        timestamp: 'Agora',
        content: `👋 **Novo Atendimento Iniciado!**\n\nVamos começar um novo projeto cultural para Viamão/RS. Conte-me qual é a sua ideia, formato artístico e edital alvo!`,
      },
    ]);
    setConsolidatedMarkdown(null);
    if (onShowToast) onShowToast('Histórico do projeto reiniciado.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Identity */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17082e] via-[#10071f] to-[#1a0b32] p-6 sm:p-8 border border-purple-900/50 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-[#6A0DAD]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 -mb-10 w-60 h-60 bg-[#FF4500]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-[#6A0DAD]/30 text-purple-200 border border-purple-700/50 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                Assistente ao Proponente Cultural
              </span>
              <span className="px-2.5 py-0.5 bg-white/10 text-slate-300 rounded-full text-[11px] font-mono">
                PNAB • FAC-RS • Rouanet • LPG
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit'] tracking-tight">
              Auxílio ao Fazedor de Cultura
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Consultoria inteligente orientada para estruturar sua proposta técnica cultural, justificativa, metas, plano de acessibilidade e planilha orçamentária detalhada para editais públicos de Viamão/RS e âmbito estadual/federal.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            {consolidatedMarkdown && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#e03d00] text-white font-bold text-xs transition-all shadow-md shadow-orange-950/40 border border-orange-400/40 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPdf ? 'Gerando PDF...' : 'Exportar Projeto para PDF'}</span>
              </button>
            )}
            <button
              onClick={handleResetChat}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1037] hover:bg-purple-900/40 text-purple-200 text-xs font-semibold border border-purple-800/40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Novo Projeto / Limpar</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-purple-900/40 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'chat'
                ? 'bg-[#6A0DAD] text-white shadow-md shadow-purple-950/50 border border-purple-400/40'
                : 'bg-[#120822] text-slate-300 hover:text-white hover:bg-purple-900/30 border border-purple-900/40'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#FF4500]" />
            <span>Consultoria Interativa (Chat)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('projeto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeSubTab === 'projeto'
                ? 'bg-[#6A0DAD] text-white shadow-md shadow-purple-950/50 border border-purple-400/40'
                : 'bg-[#120822] text-slate-300 hover:text-white hover:bg-purple-900/30 border border-purple-900/40'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Projeto Consolidado</span>
            {consolidatedMarkdown && (
              <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('editais')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'editais'
                ? 'bg-[#6A0DAD] text-white shadow-md shadow-purple-950/50 border border-purple-400/40'
                : 'bg-[#120822] text-slate-300 hover:text-white hover:bg-purple-900/30 border border-purple-900/40'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-300" />
            <span>Guia de Editais</span>
          </button>
        </div>
      </div>

      {/* Main View Container */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left / Main Chat Box (3 cols) */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-[#10071f] border border-purple-900/40 rounded-2xl overflow-hidden shadow-xl">
            {/* Chat Header */}
            <div className="px-5 py-3.5 bg-[#170a2c] border-b border-purple-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#6A0DAD] flex items-center justify-center text-white font-bold border border-purple-400/30 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-white font-['Outfit']">
                    Consultor de Editais Culturais
                  </h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-300/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Inteligência especializada em PNAB, FAC-RS e Rouanet</span>
                  </div>
                </div>
              </div>

              {consolidatedMarkdown && (
                <button
                  onClick={() => setActiveSubTab('projeto')}
                  className="px-3 py-1.5 bg-[#FF4500]/20 hover:bg-[#FF4500]/30 text-[#FF4500] border border-[#FF4500]/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Proposta Final</span>
                </button>
              )}
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 scrollbar-thin"
            >
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-lg bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 mt-1 border border-purple-400/30">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#6A0DAD] text-white rounded-br-none shadow-md'
                        : 'bg-[#180d30] text-slate-200 border border-purple-900/50 rounded-bl-none'
                    }`}
                  >
                    <div className="prose prose-invert prose-xs max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.isProjectFinal && (
                      <div className="mt-3 pt-3 border-t border-purple-800/40 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveSubTab('projeto')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Abrir Projeto Consolidado</span>
                        </button>
                        <button
                          onClick={handleExportPdf}
                          disabled={isExportingPdf}
                          className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#e03d00] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Baixar PDF</span>
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-right mt-1.5 text-purple-300/50">
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-[#FF4500] text-white flex items-center justify-center shrink-0 mt-1 border border-orange-400/30">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-7 h-7 rounded-lg bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 border border-purple-400/30 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#180d30] border border-purple-900/50 rounded-2xl px-4 py-3 text-xs text-purple-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-[#6A0DAD] animate-bounce delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200"></span>
                    <span className="ml-1 text-[11px] font-medium text-slate-300">
                      Consultor estruturando resposta técnica...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="px-4 py-2 bg-[#140926] border-t border-purple-900/30 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
              <span className="text-purple-400/60 font-bold shrink-0">Sugestões:</span>
              <button
                onClick={() => handleSendMessage('Terminei de responder, por favor gere o [PROJETO_FINAL] consolidado.')}
                className="shrink-0 px-2.5 py-1 bg-purple-900/30 hover:bg-purple-900/60 text-purple-200 rounded-lg border border-purple-800/40 transition-colors"
              >
                ✨ Consolidar Projeto Final
              </button>
              <button
                onClick={() => handleSendMessage('Como devo montar o plano de acessibilidade exigido pela PNAB?')}
                className="shrink-0 px-2.5 py-1 bg-purple-900/30 hover:bg-purple-900/60 text-purple-200 rounded-lg border border-purple-800/40 transition-colors"
              >
                ♿ Medidas de Acessibilidade
              </button>
              <button
                onClick={() => handleSendMessage('Como estruturar os objetivos gerais e específicos com indicadores de impacto?')}
                className="shrink-0 px-2.5 py-1 bg-purple-900/30 hover:bg-purple-900/60 text-purple-200 rounded-lg border border-purple-800/40 transition-colors"
              >
                🎯 Objetivos & Metas
              </button>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 sm:p-4 bg-[#170a2c] border-t border-purple-900/40">
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
                  placeholder="Descreva seu projeto, tire dúvidas ou responda ao consultor..."
                  disabled={isLoading}
                  className="flex-1 bg-[#10071f] border border-purple-900/60 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-[#6A0DAD] focus:ring-1 focus:ring-[#6A0DAD]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-3 rounded-xl bg-[#6A0DAD] hover:bg-[#7e12cf] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/40 cursor-pointer"
                >
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Pre-configured Models & Guidelines (1 col) */}
          <div className="space-y-4">
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-purple-900/30">
                <Sparkles className="w-4 h-4 text-[#FF4500]" />
                <h3 className="text-xs font-bold text-white font-['Outfit'] uppercase tracking-wider">
                  Modelos de Propostas
                </h3>
              </div>

              <p className="text-[11px] text-purple-200/70">
                Clique em um modelo para carregar a estrutura inicial na conversa:
              </p>

              <div className="space-y-2.5">
                {PROJETOS_EXEMPLO.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectExample(ex)}
                    className="w-full text-left p-3 rounded-xl bg-[#170c2e] hover:bg-[#231244] border border-purple-900/40 hover:border-[#FF4500]/50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-white group-hover:text-purple-200">
                        {ex.titulo}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-purple-300/60">
                      <span className="bg-[#6A0DAD]/30 px-1.5 py-0.5 rounded text-purple-200 font-medium">
                        {ex.edital}
                      </span>
                      <span className="text-orange-400 font-semibold">{ex.orcamento}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Helpful checklist box */}
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-5 shadow-lg space-y-3 text-xs">
              <div className="flex items-center gap-2 text-white font-bold font-['Outfit']">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Critérios de Pontuação PNAB</span>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Ações em periferias e zonas rurais de Viamão (bonificação territorial).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Medidas comprovadas de Libras e Audiodescrição.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>Planilha orçamentária compatível com a média de mercado local.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SubTab: Projeto Consolidado */}
      {activeSubTab === 'projeto' && (
        <div className="space-y-4">
          {/* Action Ribbon */}
          <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF4500]" />
                <span>Visualizador do Projeto Consolidado</span>
              </h2>
              <p className="text-xs text-purple-200/70 mt-0.5">
                Proposta formatada e paginada pronta para revisão, cópia e exportação direta em PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyMarkdown}
                disabled={!consolidatedMarkdown}
                className="px-4 py-2.5 rounded-xl bg-[#1e1037] hover:bg-purple-900/40 text-purple-200 border border-purple-800/40 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {copiedProject ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedProject ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={!consolidatedMarkdown || isExportingPdf}
                className="px-5 py-2.5 rounded-xl bg-[#FF4500] hover:bg-[#e03d00] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-950/40 border border-orange-400/40 transition-all disabled:opacity-50 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPdf ? 'Processando PDF...' : 'Exportar Projeto para PDF'}</span>
              </button>
            </div>
          </div>

          {/* Rendered Markdown Document / Print Node */}
          {consolidatedMarkdown ? (
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden">
              <div
                ref={projectPrintRef}
                className="prose prose-invert prose-purple max-w-none text-slate-200 space-y-4 text-xs sm:text-sm"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {consolidatedMarkdown}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-900/30 border border-purple-800/40 mx-auto flex items-center justify-center text-purple-300">
                <FileText className="w-8 h-8 text-[#FF4500]" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">Nenhum projeto consolidado ainda</h3>
                <p className="text-xs text-purple-200/70">
                  Interaja com o consultor no chat ou escolha um dos modelos prontos. Ao concluir as etapas, o documento completo aparecerá aqui automaticamente.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveSubTab('chat')}
                  className="px-4 py-2 bg-[#6A0DAD] hover:bg-[#7e12cf] text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Ir para o Chat com o Consultor
                </button>
                <button
                  onClick={() => handleSendMessage('Por favor, gere uma proposta consolidada com base no edital da PNAB.')}
                  className="px-4 py-2 bg-[#1e1037] hover:bg-purple-900/40 text-purple-200 border border-purple-800/40 rounded-xl text-xs font-bold transition-colors"
                >
                  Gerar Exemplo Automático
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SubTab: Guia de Editais */}
      {activeSubTab === 'editais' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PNAB */}
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-5 space-y-3">
              <span className="px-2.5 py-0.5 bg-[#6A0DAD]/30 text-purple-200 border border-purple-700/50 rounded text-[10px] font-bold">
                Lei nº 14.399/2022
              </span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Política Nacional Aldir Blanc (PNAB)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Repasses contínuos e anuais da União para Viamão/RS. Foco em fomento direto, premiações, subsídios a Pontos de Cultura e infraestrutura cultural.
              </p>
              <div className="pt-2 text-[11px] font-medium text-emerald-400">
                Público: Artistas individuais, MEI, Coletivos e Pontos de Cultura.
              </div>
            </div>

            {/* FAC-RS */}
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-5 space-y-3">
              <span className="px-2.5 py-0.5 bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/40 rounded text-[10px] font-bold">
                SEDAC / Pró-Cultura RS
              </span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Fundo de Apoio à Cultura (FAC-RS)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Editais estaduais da Secretaria de Estado da Cultura do Rio Grande do Sul (SEDAC) com foco em descentralização, patrimônio e artes integradas.
              </p>
              <div className="pt-2 text-[11px] font-medium text-purple-300">
                Exige CEPC (Cadastro Estadual de Produtor Cultural) atualizado.
              </div>
            </div>

            {/* Lei Rouanet */}
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-5 space-y-3">
              <span className="px-2.5 py-0.5 bg-blue-900/30 text-blue-300 border border-blue-700/50 rounded text-[10px] font-bold">
                Lei nº 8.313/1991 (Pronac)
              </span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Lei Rouanet / Incentivo Federal
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mecanismo de renúncia fiscal federal via captação de patrocínio junto a empresas tributadas pelo Lucro Real ou pessoas físicas.
              </p>
              <div className="pt-2 text-[11px] font-medium text-blue-300">
                Submissão permanente via Sistema SALIC / MinC.
              </div>
            </div>

            {/* LPG */}
            <div className="bg-[#10071f] border border-purple-900/40 rounded-2xl p-5 space-y-3">
              <span className="px-2.5 py-0.5 bg-emerald-900/30 text-emerald-300 border border-emerald-700/50 rounded text-[10px] font-bold">
                LC nº 195/2022
              </span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">
                Lei Paulo Gustavo (LPG)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Apoio emergencial prioritário ao setor audiovisual, salas de cinema, mostras, festivais e demais áreas culturais.
              </p>
              <div className="pt-2 text-[11px] font-medium text-emerald-300">
                Execução e acompanhamento municipal em Viamão.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
