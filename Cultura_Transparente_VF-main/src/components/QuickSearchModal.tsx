import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, FileText, Landmark, Film, ArrowRight, Flame } from 'lucide-react';
import { Emenda, PnabRecord, LeiIncentivo, PontoCultural } from '../types/culture';
import { INITIAL_FAC_EDITAIS } from '../data/initialData';
import { formatBRL } from '../utils/formatters';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  emendas: Emenda[];
  pnabList: PnabRecord[];
  leisIncentivo: LeiIncentivo[];
  pontos: PontoCultural[];
  onSelectResult: (tab: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  emendas,
  pnabList,
  leisIncentivo,
  pontos,
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

    const lpg = leisIncentivo
      .filter(
        l =>
          l.projeto_objeto.toLowerCase().includes(q) ||
          l.responsavel_execucao.toLowerCase().includes(q) ||
          l.mecanismo.toLowerCase().includes(q) ||
          (l.pronac_numero && l.pronac_numero.toLowerCase().includes(q))
      )
      .slice(0, 3)
      .map(l => {
        const isRouanet = l.mecanismo.toLowerCase().includes('rouanet') || Boolean(l.pronac_numero);
        return {
          tipo: isRouanet ? 'Lei Rouanet / SalicNet' : 'Lei Paulo Gustavo (LPG)',
          tab: isRouanet ? 'rouanet' : 'lpg',
          icon: isRouanet ? '✨' : '🎬',
          titulo: l.projeto_objeto,
          subtitulo: `${l.mecanismo} - ${l.responsavel_execucao}`,
          valor: formatBRL(l.valor_aprovado),
        };
      });

    const pt = pontos
      .filter(
        p =>
          p.nome.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.descricao.toLowerCase().includes(q) ||
          (p.endereco && p.endereco.toLowerCase().includes(q)) ||
          (p.resumo_geral_cultura && p.resumo_geral_cultura.toLowerCase().includes(q)) ||
          (p.o_que_costumam_fazer && p.o_que_costumam_fazer.toLowerCase().includes(q)) ||
          p.informacoes_detalhadas?.atividades_principais?.some(a => a.toLowerCase().includes(q))
      )
      .slice(0, 5)
      .map(p => ({
        tipo: 'Ponto Cultural',
        tab: 'acompanhe-cultura',
        icon: p.categoria.includes('Hip-Hop') ? '🎤' : '📍',
        titulo: p.nome,
        subtitulo: `${p.categoria} • Viamão/RS`,
        valor: 'Viamão/RS',
      }));

    const fac = INITIAL_FAC_EDITAIS
      .filter(
        f =>
          f.nome.toLowerCase().includes(q) ||
          f.numero_edital.toLowerCase().includes(q) ||
          f.segmento.toLowerCase().includes(q) ||
          f.publico_alvo.toLowerCase().includes(q) ||
          'fundo de apoio à cultura fac sedac-rs pró-cultura'.includes(q)
      )
      .slice(0, 3)
      .map(f => ({
        tipo: 'Fundo de Apoio à Cultura (FAC)',
        tab: 'fac',
        icon: '🏛️',
        titulo: `${f.numero_edital} - ${f.nome}`,
        subtitulo: `${f.segmento} • SEDAC-RS (Pró-cultura RS)`,
        valor: f.valor_maximo_projeto ? formatBRL(f.valor_maximo_projeto) : 'Pró-cultura RS',
      }));

    const pnab = pnabList
      .filter(
        p =>
          p.rubrica.toLowerCase().includes(q) ||
          p.origem_detalhada.toLowerCase().includes(q) ||
          p.termo_numero.toLowerCase().includes(q) ||
          'pnab aldir blanc transferegov minc fundo municipal cultura'.includes(q)
      )
      .slice(0, 2)
      .map(p => ({
        tipo: 'Política Nacional Aldir Blanc (PNAB)',
        tab: 'pnab',
        icon: '💰',
        titulo: p.rubrica,
        subtitulo: p.termo_numero && p.termo_numero.trim() !== '' && !p.termo_numero.includes('registrado')
          ? `Termo nº ${p.termo_numero} • ${p.conta_vinculada}`
          : `PNAB Viamão/RS • ${p.conta_vinculada}`,
        valor: p.valor_exato && p.valor_exato > 0 ? formatBRL(p.valor_exato) : 'Conta Fiduciária',
      }));

    return [...em, ...fac, ...pnab, ...pt, ...lpg];
  }, [query, emendas, leisIncentivo, pontos]);

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
