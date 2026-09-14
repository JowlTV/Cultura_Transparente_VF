import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { Emenda } from '../types/culture';
import { formatBRL } from '../utils/formatters';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  emendas: Emenda[];
  onSelectResult: (tab: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  emendas,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');

  const resultados = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();

    const em = emendas
      .filter(
        e =>
          e.parlamentar.toLowerCase().includes(q) ||
          e.subprojeto.toLowerCase().includes(q) ||
          e.orgao.toLowerCase().includes(q) ||
          (e.numeroEmenda && e.numeroEmenda.toLowerCase().includes(q)) ||
          (e.beneficiario && e.beneficiario.toLowerCase().includes(q)) ||
          (e.tipo_projeto_cultural && e.tipo_projeto_cultural.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map(e => ({
        tipo: 'Emenda Parlamentar',
        tab: 'emendas',
        icon: '📋',
        titulo: `${e.parlamentar} ${e.numeroEmenda ? `(${e.numeroEmenda})` : ''}`,
        subtitulo: `${e.subprojeto} • ${e.beneficiario || e.secretaria}`,
        valor: formatBRL(e.valor),
      }));

    const pnabEntry = (
      'pnab aldir blanc transferegov minc fundo municipal cultura repasse fiduciario painel power bi'.includes(q) ||
      q.includes('pnab') ||
      q.includes('aldir')
    )
      ? [
          {
            tipo: 'Política Nacional Aldir Blanc (PNAB)',
            tab: 'pnab',
            icon: '🏛️',
            titulo: 'Painel Oficial PNAB (Ministério da Cultura)',
            subtitulo: 'Acompanhamento interativo e indicadores oficiais no Power BI do MinC',
            valor: 'Painel MinC',
          },
        ]
      : [];

    const fomentoTabs = [
      {
        keywords: 'lpg lei paulo gustavo audiovisual plano acao metas repasse',
        tipo: 'Lei Paulo Gustavo (LPG)',
        tab: 'lpg',
        icon: '🎬',
        titulo: 'Lei Paulo Gustavo (LPG)',
        subtitulo: 'Auditoria do Plano de Ação nº 30882120230006-010014 e metas em Viamão',
        valor: 'LC 195/2022',
      },
      {
        keywords: 'api apis rest json serverless dados abertos python vercel endpoint',
        tipo: 'Dados Abertos & APIs',
        tab: 'apis',
        icon: '⚡',
        titulo: 'Central de APIs & Dados Abertos',
        subtitulo: 'Catálogo de endpoints públicos e sandbox interativo de testes',
        valor: 'REST API',
      },
      {
        keywords: 'controle social lai ouvidoria tce tce-rs denúncia fiscalização ministério público transparência',
        tipo: 'Cidadania & Fiscalização',
        tab: 'controle-social',
        icon: '🛡️',
        titulo: 'Controle Social & LAI',
        subtitulo: 'Canais de ouvidoria oficiais (TCE-RS, Câmaras, Ministério Público e LAI)',
        valor: 'Cidadania',
      },
    ].filter(item => item.keywords.includes(q));

    const aiAssistant = (
      'auxilio fazedor cultura projeto edital consultor ia inteligência artificial elaborar proposta pdf lpg pnab'
    ).includes(q)
      ? [
          {
            tipo: 'Assistente Inteligente',
            tab: 'auxilio-fazedor',
            icon: '✨',
            titulo: 'Auxílio ao Fazedor de Cultura (Consultor IA)',
            subtitulo: 'Estruturação de propostas técnicas e exportação em PDF',
            valor: 'Consultor IA',
          },
        ]
      : [];

    return [...aiAssistant, ...em, ...pnabEntry, ...fomentoTabs];
  }, [query, emendas]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Search Header Input */}
        <div className="p-4 border-b border-stone-200 flex items-center gap-3">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Pesquise por Hip-Hop, Ep 1692, edital FAC, deputado ou entidade cultural..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          />
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-stone-100 text-xs">
          {query.trim().length < 2 ? (
            <div className="text-center py-10 text-stone-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-medium">Digite pelo menos 2 caracteres para pesquisar em toda a base de dados de Viamão.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                {['Hip-Hop', 'Ep 1692', 'FAC / SEDAC', 'Pró-cultura', 'Bonatto', 'Matriz', 'PNAB'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2 py-1 rounded-md bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 text-[11px] font-semibold transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-10 text-stone-400">
              <p className="font-semibold text-stone-600">Nenhum registro encontrado para "{query}".</p>
              <p className="text-[11px] mt-1">Tente pesquisar termos como "Hip-hop", "Bonatto", "Igreja Matriz", "Aldir Blanc" ou "FAC".</p>
            </div>
          ) : (
            resultados.map((res, i) => (
              <div
                key={i}
                onClick={() => {
                  onSelectResult(res.tab);
                  onClose();
                }}
                className="p-3 hover:bg-amber-50/70 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{res.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-700">
                        {res.tipo}
                      </span>
                      <span className="font-bold text-stone-900 truncate text-xs">{res.titulo}</span>
                    </div>
                    <div className="text-stone-500 truncate text-[11px] mt-0.5">{res.subtitulo}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-[#c2410c]">{res.valor}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
          <span>Pressione ESC para fechar</span>
          <span>Base oficial: Viamão / RS (ALRS, CGU, DOM)</span>
        </div>
      </div>
    </div>
  );
};
