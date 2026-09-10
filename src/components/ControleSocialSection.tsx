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
      titulo: 'Execução e Rendimentos Financeiros da PNAB (Recursos em Conta Fiduciária)',
      objeto:
        'Requeiro o envio dos extratos bancários mensais e comprovante de rendimentos da conta corrente fiduciária vinculada ao Fundo Municipal de Cultura, referente aos recursos descentralizados da Política Nacional Aldir Blanc (PNAB), bem como a cópia do cronograma atualizado de publicação dos editais de fomento e chamamentos públicos.',
      fundamentacao:
        'Art. 5º, XXXIII e Art. 37, caput da Constituição Federal de 1988; Lei Federal nº 12.527/2011 (Lei de Acesso à Informação); Lei nº 14.399/2022 (PNAB) e Decreto Federal nº 11.740/2023.',
    },
    emendas: {
      titulo: 'Prestação de Contas de Emendas Parlamentares na Cultura',
      objeto:
        'Requeiro acesso integral aos processos administrativos, termos de fomento, planos de trabalho e notas fiscais de liquidação relativos às emendas parlamentares estaduais e federais destinadas a projetos culturais executados no município de Viamão nos exercícios de 2024 a 2026.',
      fundamentacao:
        'Lei Federal nº 12.527/2011 (LAI); Lei Complementar nº 131/2009 (Lei da Transparência) e Lei Federal nº 13.019/2014 (MROSC).',
    },
    lpg: {
      titulo: 'Relatório Final de Pagamentos da Lei Paulo Gustavo (LC 195/2022)',
      objeto:
        'Requeiro a listagem completa dos proponentes contemplados nos editais de Audiovisual e Demais Áreas da Lei Paulo Gustavo no município de Viamão, discriminando: nome do beneficiário, CPF/CNPJ, valor repassado, título da obra ou contrapartida e situação da prestação de contas.',
      fundamentacao:
        'Lei Complementar Federal nº 195/2022, Decreto Federal nº 11.525/2023 e Lei de Acesso à Informação (Lei 12.527/2011).',
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
      papel: 'Protocolo de pedidos de informação e reclamações sobre serviços públicos municipais.',
      link: 'https://www.viamao.rs.gov.br/ouvidoria',
      prazo: 'Até 20 dias',
    },
    {
      nome: 'Tribunal de Contas do Estado do RS (TCE-RS)',
      esfera: 'Estadual',
      papel: 'Fiscalização de conformidade contábil, financeira e orçamentária do município de Viamão.',
      link: 'https://portal.tce.rs.gov.br/',
      prazo: 'Ouvidoria TCE-RS',
    },
    {
      nome: 'Ministério Público do Estado do RS (MP-RS)',
      esfera: 'Estadual / Local',
      papel: 'Promotoria de Justiça de Viamão - Defesa do Patrimônio Público e Probidade Administrativa.',
      link: 'https://www.mprs.mp.br/',
      prazo: 'Notícia de Fato',
    },
    {
      nome: 'Controladoria-Geral da União (Fala.BR / CGU)',
      esfera: 'Federal',
      papel: 'Fiscalização e denúncias sobre recursos federais transferidos (PNAB, Lei Paulo Gustavo, Emendas).',
      link: 'https://falabr.cgu.gov.br/',
      prazo: 'Canal Federal',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-indigo-800/60 border border-indigo-400/30 px-3 py-1 rounded-full text-xs font-semibold text-indigo-200 mb-3">
            <Scale className="w-3.5 h-3.5 text-indigo-300" />
            Exercício Democrático da Cidadania Ativa
          </div>
          <h2 className="text-xl sm:text-3xl font-bold font-['Outfit'] tracking-tight">
            Controle Social & Pedidos de Informação (LAI)
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
            A transparência pública só se consolida quando os cidadãos participam ativamente da fiscalização. 
            Utilize nosso gerador de pedidos da <strong>Lei de Acesso à Informação</strong> com fundamentação jurídica pronta para protocolar na Prefeitura de Viamão.
          </p>
        </div>
      </div>

      {/* Interactive LAI Request Generator */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-blue-700" />
              Gerador Automático de Pedido de Informação (e-SIC Viamão)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecione o tema orçamentário desejado e copie o requerimento formulado com base nas leis vigentes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopiar}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Ofício Copiado!' : 'Copiar Texto do Requerimento'}</span>
            </button>
            <a
              href="https://www.viamao.rs.gov.br/ouvidoria"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
            >
              <span>Abrir e-SIC Viamão</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 block">
            1. Escolha o Objeto da Fiscalização:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: 'pnab', label: 'Extrato PNAB (R$ 2,16 Mi)', icon: '💰' },
              { id: 'emendas', label: 'Emendas Parlamentares', icon: '📋' },
              { id: 'lpg', label: 'Lei Paulo Gustavo', icon: '🎬' },
              { id: 'eventos', label: 'Contratos de Shows e Eventos', icon: '🎭' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTemaSelecionado(item.id)}
                className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                  temaSelecionado === item.id
                    ? 'border-blue-700 bg-blue-50/80 text-blue-950 shadow-2xs font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm mb-1">{item.icon}</div>
                <div>{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Citizen Identifiers (Optional for personalization) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
          <div>
            <label className="text-slate-600 font-medium block mb-1">
              Seu Nome Completo (Opcional - pode preencher no formulário oficial):
            </label>
            <input
              type="text"
              placeholder="Ex: Maria da Silva"
              value={nomeCidadao}
              onChange={e => setNomeCidadao(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600"
            />
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">
              Seu CPF ou RG (Opcional):
            </label>
            <input
              type="text"
              placeholder="Ex: 000.000.000-00"
              value={docCidadao}
              onChange={e => setDocCidadao(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-blue-600"
            />
          </div>
        </div>

        {/* Live Generated Preview */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Texto Pronto para Protocolo no e-SIC:</span>
            <span className="text-slate-500">Pressione "Copiar" e cole na Ouvidoria Municipal</span>
          </div>
          <textarea
            readOnly
            rows={12}
            value={textoOficioGerado}
            className="w-full p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl border border-slate-800 focus:outline-hidden resize-none leading-relaxed"
          ></textarea>
        </div>
      </div>

      {/* Official Audit & Reporting Channels */}
      <div className="bg-white rounded-xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
          <Building className="w-4 h-4 text-slate-700" />
          Canais Oficiais de Ouvidoria, Denúncia e Controle Externo
        </h3>
        <p className="text-xs text-slate-500">
          Caso você identifique indícios de irregularidades, ausência de resposta no prazo legal ou queira submeter uma representação formal:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {canaisFiscalizacao.map((canal, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900">{canal.nome}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {canal.esfera}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{canal.papel}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-medium">Prazo / Tipo: {canal.prazo}</span>
                <a
                  href={canal.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-blue-700 hover:text-blue-900 hover:underline"
                >
                  <span>Acessar Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
