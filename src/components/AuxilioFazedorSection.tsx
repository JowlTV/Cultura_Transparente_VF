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
      content: `👋 **Olá, Fazedor de Cultura de Viamão!**\n\nSou seu **Consultor Inteligente de Elaboração de Projetos Culturais**. Meu papel é te ajudar a estruturar uma proposta técnica sólida, competitiva e 100% aderente às exigências de editais como **PNAB (Lei Aldir Blanc)**, **LPG (Lei Paulo Gustavo)**, **Emendas Parlamentares** e **Editais Municipais de Viamão**.\n\nPara começarmos a construir seu projeto passo a passo:\n\n1. **Qual é a sua ideia ou projeto cultural** (ex: show, oficina comunitária, festival, peça de teatro, livro, documentário)?\n2. **Para qual instrumento ou edital você planeja se inscrever?**`,
    },
  ]);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const projectPrintRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

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
    <div className="space-y-6">
      {/* Top Banner Identity */}
      <div className="bg-[#FAF4EB] rounded-3xl p-6 sm:p-8 border border-[#E2D2BC] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1 bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB] rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                Assistente ao Proponente Cultural
              </span>
              <span className="px-3 py-0.5 bg-white text-[#2D0652] rounded-full text-xs font-bold border border-[#E2D2BC]">
                PNAB • LPG • Emendas • Editais Municipais
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
              Auxílio ao Fazedor de Cultura
            </h1>

            <p className="text-xs sm:text-sm text-[#2D0652]/80 leading-relaxed font-medium">
              Consultoria orientada para estruturar sua proposta técnica cultural, justificativa, metas, plano de acessibilidade e planilha orçamentária detalhada para editais públicos de Viamão/RS e âmbito estadual/federal.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2 shrink-0">
            {consolidatedMarkdown && (
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPdf ? 'Gerando PDF...' : 'Exportar Projeto para PDF'}</span>
              </button>
            )}
            <button
              onClick={handleResetChat}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#FAF4EB] text-[#2D0652] text-xs font-bold border border-[#E2D2BC] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#6A0DAD]" />
              <span>Novo Projeto / Limpar</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-[#E2D2BC] flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'chat'
                ? 'bg-[#6A0DAD] text-white shadow-xs'
                : 'bg-white text-[#2D0652] hover:bg-[#F5EAD8] border border-[#E2D2BC]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#FF4500]" />
            <span>Consultoria Interativa (Chat)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('projeto')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all relative cursor-pointer ${
              activeSubTab === 'projeto'
                ? 'bg-[#6A0DAD] text-white shadow-xs'
                : 'bg-white text-[#2D0652] hover:bg-[#F5EAD8] border border-[#E2D2BC]'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-600" />
            <span>Projeto Consolidado</span>
            {consolidatedMarkdown && (
              <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('editais')}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'editais'
                ? 'bg-[#6A0DAD] text-white shadow-xs'
                : 'bg-white text-[#2D0652] hover:bg-[#F5EAD8] border border-[#E2D2BC]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#6A0DAD]" />
            <span>Guia de Editais</span>
          </button>
        </div>
      </div>

      {/* Main View Container */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Chat Box */}
          <div className="lg:col-span-3 flex flex-col h-[650px] bg-white border border-[#E2D2BC] rounded-3xl overflow-hidden shadow-xs">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#FAF4EB] border-b border-[#E2D2BC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#6A0DAD] flex items-center justify-center text-white font-bold shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#2D0652]">
                    Consultor de Editais Culturais
                  </h2>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#2D0652]/70 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Inteligência especializada em PNAB, FAC-RS e Rouanet</span>
                  </div>
                </div>
              </div>

              {consolidatedMarkdown && (
                <button
                  onClick={() => setActiveSubTab('projeto')}
                  className="px-3 py-1.5 bg-[#FFE8E0] hover:bg-[#FFD6CA] text-[#FF4500] border border-[#FFC2B2] rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Proposta Final</span>
                </button>
              )}
            </div>

            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4"
            >
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#6A0DAD] text-white rounded-br-none shadow-xs'
                        : 'bg-[#FAF4EB] text-[#2D0652] border border-[#E2D2BC] rounded-bl-none'
                    }`}
                  >
                    <div className="prose prose-xs max-w-none text-current">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>

                    {msg.isProjectFinal && (
                      <div className="mt-3 pt-3 border-t border-[#E2D2BC] flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setActiveSubTab('projeto')}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Abrir Projeto Consolidado</span>
                        </button>
                        <button
                          onClick={handleExportPdf}
                          disabled={isExportingPdf}
                          className="px-3.5 py-1.5 bg-[#FF4500] hover:bg-[#E03D00] text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Baixar PDF</span>
                        </button>
                      </div>
                    )}

                    <div className="text-[10px] text-right mt-1.5 text-current opacity-60">
                      {msg.timestamp}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-[#FF4500] text-white flex items-center justify-center shrink-0 mt-1">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start items-center">
                  <div className="w-7 h-7 rounded-full bg-[#6A0DAD] text-white flex items-center justify-center shrink-0 animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-2xl px-4 py-3 text-xs text-[#2D0652] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF4500] animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-[#6A0DAD] animate-bounce delay-100"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce delay-200"></span>
                    <span className="ml-1 text-xs font-medium text-[#2D0652]">
                      Consultor estruturando resposta técnica...
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Chips */}
            <div className="px-4 py-2.5 bg-[#FAF4EB] border-t border-[#E2D2BC] flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#2D0652]/70 font-bold shrink-0">Sugestões:</span>
              <button
                onClick={() => handleSendMessage('Terminei de responder, por favor gere o [PROJETO_FINAL] consolidado.')}
                className="shrink-0 px-3 py-1 bg-white hover:bg-[#F5EAD8] text-[#2D0652] rounded-full border border-[#E2D2BC] font-medium transition-colors cursor-pointer"
              >
                ✨ Consolidar Projeto Final
              </button>
              <button
                onClick={() => handleSendMessage('Como devo montar o plano de acessibilidade exigido pela PNAB?')}
                className="shrink-0 px-3 py-1 bg-white hover:bg-[#F5EAD8] text-[#2D0652] rounded-full border border-[#E2D2BC] font-medium transition-colors cursor-pointer"
              >
                ♿ Medidas de Acessibilidade
              </button>
              <button
                onClick={() => handleSendMessage('Como estruturar os objetivos gerais e específicos com indicadores de impacto?')}
                className="shrink-0 px-3 py-1 bg-white hover:bg-[#F5EAD8] text-[#2D0652] rounded-full border border-[#E2D2BC] font-medium transition-colors cursor-pointer"
              >
                🎯 Objetivos & Metas
              </button>
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-[#FAF4EB] border-t border-[#E2D2BC]">
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
                  className="flex-1 bg-white border border-[#E2D2BC] rounded-full px-4 py-2.5 text-xs sm:text-sm text-[#2D0652] placeholder-[#2D0652]/40 focus:outline-hidden focus:ring-2 focus:ring-[#6A0DAD]"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-5 py-2.5 rounded-full bg-[#6A0DAD] hover:bg-[#580B91] disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E2D2BC]">
                <Sparkles className="w-4 h-4 text-[#FF4500]" />
                <h3 className="text-xs font-bold text-[#2D0652] uppercase tracking-wider">
                  Modelos de Propostas
                </h3>
              </div>

              <p className="text-xs text-[#2D0652]/70 font-medium">
                Clique em um modelo para carregar a estrutura inicial na conversa:
              </p>

              <div className="space-y-2.5">
                {PROJETOS_EXEMPLO.map((ex, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectExample(ex)}
                    className="w-full text-left p-3.5 rounded-2xl bg-white hover:bg-[#F5EAD8] border border-[#E2D2BC] transition-all group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-xs font-bold text-[#2D0652]">
                        {ex.titulo}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#6A0DAD] group-hover:translate-x-1 transition-transform shrink-0 mt-0.5" />
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="bg-[#EFE6FD] text-[#6A0DAD] px-2 py-0.5 rounded-full font-bold border border-[#DCC7FB]">
                        {ex.edital}
                      </span>
                      <span className="text-[#FF4500] font-bold">{ex.orcamento}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center gap-2 text-[#2D0652] font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Critérios de Pontuação PNAB</span>
              </div>
              <ul className="space-y-2 text-xs text-[#2D0652]/80">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Ações em periferias e zonas rurais de Viamão (bonificação territorial).</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Medidas comprovadas de Libras e Audiodescrição.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
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
          <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#2D0652] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                <FileText className="w-4 h-4 text-[#FF4500]" />
                <span>Visualizador do Projeto Consolidado</span>
              </h2>
              <p className="text-xs text-[#2D0652]/70 mt-0.5 font-medium">
                Proposta formatada e paginada pronta para revisão, cópia e exportação direta em PDF.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleCopyMarkdown}
                disabled={!consolidatedMarkdown}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#F5EAD8] text-[#2D0652] border border-[#E2D2BC] text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {copiedProject ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedProject ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleExportPdf}
                disabled={!consolidatedMarkdown || isExportingPdf}
                className="px-5 py-2 rounded-full bg-[#FF4500] hover:bg-[#E03D00] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isExportingPdf ? 'Processando PDF...' : 'Exportar Projeto para PDF'}</span>
              </button>
            </div>
          </div>

          {consolidatedMarkdown ? (
            <div className="bg-white border border-[#E2D2BC] rounded-3xl p-6 sm:p-10 shadow-xs overflow-hidden">
              <div
                ref={projectPrintRef}
                className="prose prose-purple max-w-none text-[#2D0652] space-y-4 text-xs sm:text-sm"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {consolidatedMarkdown}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white border border-[#E2D2BC] mx-auto flex items-center justify-center text-[#6A0DAD]">
                <FileText className="w-8 h-8 text-[#FF4500]" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-bold text-[#2D0652]">Nenhum projeto consolidado ainda</h3>
                <p className="text-xs text-[#2D0652]/70 font-medium">
                  Interaja com o consultor no chat ou escolha um dos modelos prontos. Ao concluir as etapas, o documento completo aparecerá aqui automaticamente.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setActiveSubTab('chat')}
                  className="px-5 py-2 bg-[#6A0DAD] hover:bg-[#580B91] text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
                >
                  Ir para o Chat com o Consultor
                </button>
                <button
                  onClick={() => handleSendMessage('Por favor, gere uma proposta consolidada com base no edital da PNAB.')}
                  className="px-5 py-2 bg-white hover:bg-[#F5EAD8] text-[#2D0652] border border-[#E2D2BC] rounded-full text-xs font-bold transition-colors cursor-pointer"
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
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 space-y-3 shadow-xs">
              <span className="px-3 py-0.5 bg-[#EFE6FD] text-[#6A0DAD] border border-[#DCC7FB] rounded-full text-[10px] font-bold">
                Lei nº 14.399/2022
              </span>
              <h3 className="text-sm font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
                Política Nacional Aldir Blanc (PNAB)
              </h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Repasses contínuos e anuais da União para Viamão/RS. Foco em fomento direto, premiações, subsídios a Pontos de Cultura e infraestrutura cultural.
              </p>
              <div className="pt-2 text-xs font-bold text-emerald-700">
                Público: Artistas individuais, MEI, Coletivos e Pontos de Cultura.
              </div>
            </div>

            {/* LPG */}
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 space-y-3 shadow-xs">
              <span className="px-3 py-0.5 bg-[#E3F7E8] text-[#166534] border border-[#B7ECC3] rounded-full text-[10px] font-bold">
                LC nº 195/2022
              </span>
              <h3 className="text-sm font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
                Lei Paulo Gustavo (LPG)
              </h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Apoio emergencial ao setor audiovisual, salas de cinema, mostras e demais linguagens culturais com plano de ação homologado no MinC.
              </p>
              <div className="pt-2 text-xs font-bold text-[#166534]">
                Execução e acompanhamento municipal em Viamão.
              </div>
            </div>

            {/* Emendas Parlamentares */}
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 space-y-3 shadow-xs">
              <span className="px-3 py-0.5 bg-[#FFE8E0] text-[#FF4500] border border-[#FFC2B2] rounded-full text-[10px] font-bold">
                CGU & CAGE/RS
              </span>
              <h3 className="text-sm font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
                Emendas Parlamentares para Cultura
              </h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Recursos orçamentários indicados por deputados federais e estaduais para infraestrutura, eventos tradicionais e projetos culturais em Viamão.
              </p>
              <div className="pt-2 text-xs font-bold text-[#FF4500]">
                Rastreamento por empenho, liquidação e pagamento.
              </div>
            </div>

            {/* Editais Municipais */}
            <div className="bg-[#FAF4EB] border border-[#E2D2BC] rounded-3xl p-5 space-y-3 shadow-xs">
              <span className="px-3 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold">
                Secretaria Municipal de Cultura
              </span>
              <h3 className="text-sm font-bold text-[#2D0652]" style={{ fontFamily: 'var(--font-display)' }}>
                Editais e Chamamentos Municipais
              </h3>
              <p className="text-xs text-[#2D0652]/80 leading-relaxed font-medium">
                Chamamentos públicos diretos da Prefeitura de Viamão para feiras comunitárias, eventos tradicionais, artes cênicas e música local.
              </p>
              <div className="pt-2 text-xs font-bold text-blue-700">
                Inscrição e habilitação via Diário Oficial e Secretaria.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
