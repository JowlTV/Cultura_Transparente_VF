import React, { useState } from 'react';
import {
  Sparkles,
  Building,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Info,
  Calendar,
  Layers,
  Search,
  BookOpen,
  Award,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { LeiIncentivo } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface RouanetSectionProps {
  leisIncentivo: LeiIncentivo[];
}

export const RouanetSection: React.FC<RouanetSectionProps> = ({ leisIncentivo }) => {
  const [termoBusca, setTermoBusca] = useState<string>('');

  // Filtrar apenas projetos da Lei Rouanet (Lei 8.313/1991 / Salic)
  const rouanetProjetos = leisIncentivo.filter(item =>
    item.mecanismo.toLowerCase().includes('rouanet') || item.mecanismo.toLowerCase().includes('salic') || Boolean(item.pronac_numero)
  );

  const projetosFiltrados = rouanetProjetos.filter(item => {
    if (!termoBusca.trim()) return true;
    const query = termoBusca.toLowerCase();
    return (
      item.projeto_objeto.toLowerCase().includes(query) ||
      (item.pronac_numero && item.pronac_numero.toLowerCase().includes(query)) ||
      (item.responsavel_execucao && item.responsavel_execucao.toLowerCase().includes(query)) ||
      (item.proponente && item.proponente.toLowerCase().includes(query))
    );
  });

  const totalAprovado = rouanetProjetos.reduce((acc, curr) => acc + curr.valor_aprovado, 0);
  const totalCaptado = rouanetProjetos.reduce((acc, curr) => acc + (curr.valor_captado || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner - Lei Rouanet / SalicNet */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-800/80 border border-blue-400/40 px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Lei nº 8.313/1991 (PRONAC & Renúncia Fiscal Federal)
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight">
              Lei Rouanet & SalicNet em Viamão
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Consulta pública e transparente dos projetos chancelados pelo <strong>Programa Nacional de Apoio à Cultura (PRONAC)</strong> com impacto territorial em Viamão. Acesse o novo sistema oficial de comparação e consulta de dados no SalicNet.
            </p>

            <div className="pt-2">
              <a
                href="https://aplicacoes.cultura.gov.br/comparar/salicnet/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs transition-all shadow-xs"
              >
                <span>Acessar o Novo SalicNet (aplicacoes.cultura.gov.br)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold block">
                Total Homologado PRONAC
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-['Outfit'] block mt-1">
                {formatBRL(totalAprovado)}
              </span>
            </div>

            <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-xl text-center shrink-0">
              <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-semibold block">
                Total Captado no Mercado
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-300 font-['Outfit'] block mt-1">
                {formatBRL(totalCaptado)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Artigo 18 vs Artigo 26 - Cartões Explicativos Técnicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-[#1e40af] rounded-full">
              Artigo 18 (100% de Dedução Fiscal)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700">Abatimento Integral</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
            Áreas Prioritárias de Fomento Federal
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Patrocinadores (pessoas jurídicas tributadas com base no Lucro Real) abatem <strong>100% do valor investido</strong> do Imposto de Renda devido, até o limite de 4% do IRPJ. Destinado a <strong>preservação de patrimônio histórico tombado</strong>, museus, bibliotecas, concertos de música erudita e literatura.
          </p>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Exemplo em Viamão: Restauro e Conservação da Igreja Matriz (PRONAC 23.9012)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
              Artigo 26 (Dedução Parcial)
            </span>
            <span className="text-xs font-mono font-bold text-slate-600">30% a 40% de Dedução</span>
          </div>
          <h4 className="font-bold text-slate-900 text-sm font-['Outfit']">
            Demais Segmentos da Produção Cultural
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Aplicado aos projetos de entretenimento e difusão em que a dedução varia entre 30% a 40% para empresas (e de 60% a 80% para pessoas físicas). O restante do valor aportado pode ser lançado como despesa operacional dedutível da empresa incentivadora.
          </p>
          <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>Exige plano de democratização e oferta de ingressos a preços acessíveis</span>
          </div>
        </div>
      </div>

      {/* Guia Técnico para Submissão e Captação no SalicNet */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-['Outfit'] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#1e40af]" />
              Roteiro Prático: Como Propor Projetos na Lei Rouanet
            </h3>
            <p className="text-xs text-slate-500">
              Passos fundamentais para proponentes individuais (PF) e coletivos/empresas culturais (PJ)
            </p>
          </div>
          <a
            href="https://aplicacoes.cultura.gov.br/comparar/salicnet/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-[#1e40af] hover:underline inline-flex items-center gap-1"
          >
            <span>Consultar SalicNet Oficial</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1e40af] flex items-center justify-center text-[10px]">1</span>
              Habilitação no Salic
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Cadastro via conta Gov.br (prata ou ouro). Pessoa Jurídica com CNAE cultural ou Pessoa Física com histórico comprovado no portfólio.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1e40af] flex items-center justify-center text-[10px]">2</span>
              Planilha Orçamentária
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Orçamento balizado nos preços médios praticados pelo MinC (Tabela Salic), discriminando custos pré-produção, produção e divulgação.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1e40af] flex items-center justify-center text-[10px]">3</span>
              Plano de Acessibilidade
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Obrigatória comprovação de acessibilidade para PcD (intérprete de LIBRAS, audiodescrição ou rampas de acesso) sem cobrança extra.
            </p>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1e40af] flex items-center justify-center text-[10px]">4</span>
              Conta no Banco do Brasil
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Abertura automática de conta fiduciária de captação após homologação da proposta no Diário Oficial da União (DOU).
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por PRONAC, objeto ou proponente..."
            value={termoBusca}
            onChange={e => setTermoBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-[#1e40af]"
          />
        </div>

        <span className="text-xs text-slate-500">
          Exibindo <strong>{projetosFiltrados.length}</strong> projetos registrados
        </span>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projetosFiltrados.map(item => {
          const percentualCaptado = item.valor_captado
            ? Math.round((item.valor_captado / item.valor_aprovado) * 100)
            : 0;

          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1e40af] border border-blue-200">
                      Lei Rouanet
                    </span>
                    {item.pronac_numero && (
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.pronac_numero}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-semibold text-slate-600">{item.periodo_execucao || '2023 - 2026'}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {item.status_atual || item.status || 'Homologado'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] pt-1">
                    {item.projeto_objeto}
                  </h3>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs text-slate-500 font-medium block">Valor Autorizado no DOU:</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-['Outfit'] block">
                    {formatBRL(item.valor_aprovado)}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold block">
                    {formatBRL(item.valor_captado || 0)} captado ({percentualCaptado}%)
                  </span>
                </div>
              </div>

              {/* Progress Bar for Rouanet */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Progresso de Captação no SalicNet</span>
                  <span className="font-bold">{percentualCaptado}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#1e40af] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(percentualCaptado, 100)}%` }}
                  ></div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.como_sera_feito || item.detalhes}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 text-xs text-slate-600">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Proponente Homologado</span>
                  <span className="font-semibold text-slate-800">{item.responsavel_execucao || item.proponente}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Enquadramento Legal</span>
                  <span className="font-semibold text-slate-800">{item.mecanismo || 'Lei nº 8.313/1991 (Art. 18)'}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Órgão Regulador</span>
                  <span className="font-semibold text-slate-800">{item.orgao_liberador || 'Ministério da Cultura (MinC)'}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <a
                  href="https://aplicacoes.cultura.gov.br/comparar/salicnet/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1e40af] text-xs font-semibold rounded-lg transition-colors border border-blue-200"
                >
                  <span>Consultar dados atualizados no SalicNet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
