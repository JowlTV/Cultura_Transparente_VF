import React, { useState } from 'react';
import {
  ShieldAlert,
  FileCheck2,
  Send,
  ExternalLink,
  Copy,
  Check,
  Scale,
  Building,
  AlertOctagon,
  Users,
  FileText,
  HelpCircle
} from 'lucide-react';

export const ControleSocialSection: React.FC = () => {
  const [temaSelecionado, setTemaSelecionado] = useState<string>('pnab');
  const [nomeCidadao, setNomeCidadao] = useState<string>('');
  const [docCidadao, setDocCidadao] = useState<string>('');
  const [copiado, setCopiado] = useState(false);

  const temasModelos: Record<
    string,
    { titulo: string; objeto: string; fundamentacao: string }
  > = {
    pnab: {
      titulo: 'Extrato Bancário e Execução da PNAB (Recursos em Conta Fiduciária)',
      objeto:
        'Requeiro o envio dos extratos bancários mensais detalhados e comprovante de rendimentos da conta corrente fiduciária vinculada ao Fundo Municipal de Cultura referente aos recursos da Política Nacional Aldir Blanc (PNAB - Lei nº 14.399/2022), bem como o cronograma e o estágio de execução do Plano Anual de Aplicação dos Recursos (PAAR).',
      fundamentacao:
        'Art. 5º, XXXIII e Art. 37, caput da Constituição Federal de 1988; Lei Federal nº 12.527/2011 (Lei de Acesso à Informação); Lei Federal nº 14.399/2022 (PNAB) e Decreto Federal nº 11.740/2023.',
    },
    emendas: {
      titulo: 'Prestação de Contas de Emendas Parlamentares na Cultura',
      objeto:
        'Requeiro acesso integral aos processos administrativos, termos de fomento, planos de trabalho e notas fiscais de liquidação relativos às emendas parlamentares estaduais e federais destinadas a projetos culturais executados no município de Viamão nos exercícios de 2024 a 2026.',
      fundamentacao:
        'Lei Federal nº 12.527/2011 (LAI); Lei Complementar nº 131/2009 (Lei da Transparência) e Lei Federal nº 13.019/2014 (MROSC).',
    },
    editais: {
      titulo: 'Execução e Resultados de Editais Municipais de Fomento Cultural',
      objeto:
        'Requeiro a listagem completa dos projetos inscritos, habilitados e contemplados nos editais e chamamentos públicos de fomento à cultura promovidos pelo Município de Viamão, com discriminação de proponentes, notas de avaliação, valores repassados e relatórios de execução das contrapartidas.',
      fundamentacao:
        'Lei Federal nº 12.527/2011 (LAI); Lei Federal nº 13.019/2014 (MROSC) e princípios da impessoalidade e publicidade administrativa.',
    },
    eventos: {
      titulo: 'Contratos e Cachês de Shows e Eventos Públicos Municipais',
      objeto:
        'Requeiro cópia dos contratos de inexigibilidade ou dispensa de licitação celebrados para a contratação de apresentações artísticas, estruturas de som, palco e iluminação em eventos oficiais realizados pela Secretaria Municipal de Cultura de Viamão nos últimos 12 meses.',
      fundamentacao:
        'Lei Federal nº 14.133/2021 (Nova Lei de Licitações), Art. 74, II; e Lei Federal nº 12.527/2011.',
    },
  };

  const modeloAtual = temasModelos[temaSelecionado] || temasModelos['pnab'];

  const textoOficioGerado = `SOLICITAÇÃO FORMAL DE INFORMAÇÕES PÚBLICAS (LEI Nº 12.527/2011 - LAI)

AO SERVIÇO DE INFORMAÇÃO AO CIDADÃO (e-SIC) / OUVIDORIA GERAL
PREFEITURA MUNICIPAL DE VIAMÃO - RS
SECRETARIA MUNICIPAL DE CULTURA

IDENTIFICAÇÃO DO REQUERENTE:
Nome: ${nomeCidadao.trim() || '[SEU NOME COMPLETO]'}
Documento de Identificação (CPF/RG): ${docCidadao.trim() || '[SEU CPF OU RG]'}
Município: Viamão / RS

ASSUNTO: ${modeloAtual.titulo}

Prezados(as) Senhores(as),

Com fulcro no Artigo 5º, inciso XXXIII e Artigo 37, caput, da Constituição da República Federativa do Brasil de 1988, e nos termos da Lei Federal nº 12.527, de 18 de novembro de 2011 (Lei de Acesso à Informação), venho respeitosamente perante este órgão público solicitar:

${modeloAtual.objeto}

FUNDAMENTAÇÃO JURÍDICA:
O presente requerimento ampara-se no princípio da publicidade administrativa, na transparência ativa e passiva dos gastos públicos, com amparo legal específico em:
${modeloAtual.fundamentacao}

PRAZO LEGAL:
Recorda-se que, conforme estabelece o Artigo 11 da Lei Federal nº 12.527/2011, o prazo para resposta à presente solicitação é de até 20 (vinte) dias corridos, prorrogável justificadamente por mais 10 (dez) dias.

Nestes termos,
Pede e aguarda deferimento.

Viamão / RS, ${new Date().toLocaleDateString('pt-BR')}.`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(textoOficioGerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const canaisFiscalizacao = [
    {
      nome: 'Ouvidoria & e-SIC da Prefeitura de Viamão',
      esfera: 'Municipal',
      papel: 'Protocolo oficial online de pedidos de informação (e-SIC), denúncias e reclamações na Central 1Doc / Tel: 156.',
      link: 'https://viamao.1doc.com.br/atendimento',
      portalSecundario: 'https://www.viamao.rs.gov.br/',
      prazo: 'Até 20 dias',
    },
    {
      nome: 'Tribunal de Contas do Estado do RS (TCE-RS)',
      esfera: 'Estadual',
      papel: 'Ouvidoria e fiscalização da conformidade contábil, financeira e orçamentária do município de Viamão. Canal direto: 0800-541 9800 / E-mail: ouvidoria@tce.rs.gov.br.',
      link: 'https://tce.rs.gov.br/ouvidoria',
      portalSecundario: 'https://www.tce.rs.gov.br/',
      prazo: 'Ouvidoria TCE-RS',
    },
    {
      nome: 'Ministério Público do Estado do RS (MP-RS)',
      esfera: 'Estadual / Local',
      papel: 'Atendimento ao Cidadão e Promotoria de Justiça de Viamão - Defesa do Patrimônio Público e Probidade.',
      link: 'https://www.mprs.mp.br/atendimento/',
      portalSecundario: 'https://www.mprs.mp.br/',
      prazo: 'Notícia de Fato',
    },
    {
      nome: 'Controladoria-Geral da União (Fala.BR / CGU)',
      esfera: 'Federal',
      papel: 'Plataforma Integrada de Ouvidoria e Acesso à Informação para fiscalização de recursos federais (PNAB, Emendas).',
      link: 'https://falabr.cgu.gov.br/',
      portalSecundario: 'https://portaldatransparencia.gov.br/',
      prazo: 'Canal Federal Fala.BR',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1b0a2f] via-[#220d3a] to-[#120622] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
        {/* Background Graphic Accents */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-72 h-72 bg-[#6A0DAD]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-[#FF4500]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-[#6A0DAD]/30 border border-purple-700/50 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-purple-200">
            <Scale className="w-3.5 h-3.5 text-[#FF4500]" />
            Exercício Democrático da Cidadania Ativa
          </div>
          <h2 className="text-xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
            Controle Social & Pedidos de Informação (LAI)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A transparência pública só se consolida quando os cidadãos participam ativamente da fiscalização. 
            Utilize nosso gerador de pedidos da <strong className="text-white">Lei de Acesso à Informação</strong> com fundamentação jurídica pronta para protocolar na Prefeitura de Viamão.
          </p>
        </div>
      </div>

      {/* Interactive LAI Request Generator */}
      <div className="bg-[#150b24] rounded-3xl p-5 sm:p-7 border border-purple-900/40 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-purple-900/30">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#FF4500]" />
              Gerador Automático de Pedido de Informação (e-SIC Viamão)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Selecione o tema orçamentário desejado e copie o requerimento formulado com base nas leis vigentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopiar}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#FF4500] hover:bg-[#e03d00] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-950/40 border border-orange-400/30"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Ofício Copiado!' : 'Copiar Texto do Requerimento'}</span>
            </button>
            <a
              href="https://viamao.1doc.com.br/atendimento"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-[#1e1037] hover:bg-purple-900/40 text-purple-200 rounded-xl text-xs font-bold border border-purple-800/40 transition-colors"
            >
              <span>Abrir Central e-SIC Viamão (1Doc)</span>
              <ExternalLink className="w-3.5 h-3.5 text-purple-300" />
            </a>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-purple-200 uppercase tracking-wider block">
            1. Escolha o Objeto da Fiscalização:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { id: 'pnab', label: 'Extrato PNAB (Conta Fiduciária)', icon: '💰' },
              { id: 'emendas', label: 'Emendas Parlamentares', icon: '📋' },
              { id: 'editais', label: 'Editais & Fomento Municipal', icon: '🏛️' },
              { id: 'eventos', label: 'Contratos de Shows e Eventos', icon: '🎭' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTemaSelecionado(item.id)}
                className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                  temaSelecionado === item.id
                    ? 'border-[#FF4500] bg-[#FF4500]/15 text-white shadow-xs font-bold ring-1 ring-[#FF4500]/50'
                    : 'border-purple-900/40 bg-[#10071e] hover:bg-purple-900/30 text-slate-300 font-semibold'
                }`}
              >
                <div className="text-base mb-1.5">{item.icon}</div>
                <div>{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Citizen Identifiers (Optional for personalization) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              Seu Nome Completo (Opcional - pode preencher no formulário oficial):
            </label>
            <input
              type="text"
              placeholder="Ex: Maria da Silva"
              value={nomeCidadao}
              onChange={e => setNomeCidadao(e.target.value)}
              className="w-full p-3 bg-[#10071e] border border-purple-900/40 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-[#FF4500]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium block">
              Seu CPF ou RG (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: 000.000.000-00"
              value={docCidadao}
              onChange={e => setDocCidadao(e.target.value)}
              className="w-full p-3 bg-[#10071e] border border-purple-900/40 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-[#FF4500]"
            />
          </div>
        </div>

        {/* Live Generated Preview */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-200">Texto Pronto para Protocolo no e-SIC:</span>
            <span className="text-slate-400">Pressione "Copiar" e cole na Ouvidoria Municipal</span>
          </div>
          <textarea
            readOnly
            rows={12}
            value={textoOficioGerado}
            className="w-full p-4 bg-[#0c0714] text-purple-100 font-mono text-xs rounded-2xl border border-purple-900/60 focus:outline-hidden resize-none leading-relaxed"
          ></textarea>
        </div>
      </div>

      {/* Official Audit & Reporting Channels */}
      <div className="bg-[#150b24] rounded-3xl p-5 sm:p-7 border border-purple-900/40 shadow-xs space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Building className="w-4 h-4 text-[#FF4500]" />
          Canais Oficiais de Ouvidoria, Denúncia e Controle Externo
        </h3>
        <p className="text-xs text-slate-300">
          Caso você identifique indícios de irregularidades, ausência de resposta no prazo legal ou queira submeter uma representação formal:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {canaisFiscalizacao.map((canal, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-purple-900/40 bg-[#10071e] hover:bg-purple-950/40 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-white">{canal.nome}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#6A0DAD]/30 text-purple-200 border border-purple-700/40">
                    {canal.esfera}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{canal.papel}</p>
              </div>

              <div className="pt-2.5 border-t border-purple-900/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[11px] text-slate-400 font-medium">{canal.prazo}</span>
                <div className="flex items-center gap-2">
                  {canal.portalSecundario && (
                    <a
                      href={canal.portalSecundario}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-300 hover:text-white transition-colors"
                      title="Portal Institucional"
                    >
                      Site Oficial
                    </a>
                  )}
                  <a
                    href={canal.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#FF4500] hover:text-orange-400 transition-colors bg-[#1e1037] px-2.5 py-1 rounded-lg border border-purple-800/40"
                  >
                    <span>Acessar Ouvidoria / Protocolo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
