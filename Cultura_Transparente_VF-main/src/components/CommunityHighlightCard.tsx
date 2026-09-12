import React, { useState } from 'react';
import {
  MapPin,
  ExternalLink,
  Phone,
  Share2,
  Check,
  Sparkles,
  ChevronRight,
  Landmark,
  Info,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { PontoCultural } from '../types/culture';
import { validateInstitutionalContact } from '../utils/institutionalValidation';
import { sanitizeUrl } from '../utils/security';

interface CommunityHighlightCardProps {
  pontos: PontoCultural[];
  onNavigateToMap?: (pontoId: string) => void;
  onNavigateToEngajamento?: () => void;
  onSupportPoint?: (pontoId: string) => void;
}

export const CommunityHighlightCard: React.FC<CommunityHighlightCardProps> = ({
  pontos,
}) => {
  // Find community highlights, prioritizing Associação Hip-Hop
  const destaques = pontos.filter(p => p.destaque_comunitario || p.id === 'ponto-02');
  const [selectedPontoId, setSelectedPontoId] = useState<string>(() => {
    return destaques.find(p => p.id === 'ponto-02')?.id || destaques[0]?.id || pontos[0]?.id || 'ponto-02';
  });

  const ponto = pontos.find(p => p.id === selectedPontoId) || destaques[0] || pontos[0];

  const [copiedLink, setCopiedLink] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  if (!ponto) return null;

  const handleShare = () => {
    const text = `Conheça o Centro de Cultura "${ponto.nome}" em Viamão/RS! Saiba mais sobre as ações culturais e patrimônio da nossa cidade.`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getCategoryIcon = (cat: string, id: string) => {
    if (id === 'ponto-02' || cat === 'Música & Hip-Hop') return '🎤';
    if (cat === 'Matriz Afro-Brasileira & Memória') return '🥁';
    if (cat === 'Patrimônio Histórico') return '⛪';
    if (cat === 'Tradição & Folclore') return '🐎';
    if (cat === 'Literatura & Biblioteca') return '📚';
    if (cat === 'Centro Religioso/Espírita') return '🕊️';
    if (cat === 'Artes Cênicas & Audiovisual') return '🎭';
    return '🏛️';
  };

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'Música & Hip-Hop':
        return 'bg-[#1e40af] text-white';
      case 'Patrimônio Histórico':
        return 'bg-[#dc2626] text-white';
      case 'Tradição & Folclore':
        return 'bg-[#15803d] text-white';
      case 'Literatura & Biblioteca':
        return 'bg-[#0369a1] text-white';
      case 'Centro Religioso/Espírita':
        return 'bg-[#701a75] text-white';
      case 'Matriz Afro-Brasileira & Memória':
        return 'bg-[#78350f] text-white';
      case 'Artes Cênicas & Audiovisual':
        return 'bg-[#4338ca] text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="bg-white border-2 border-blue-200/90 rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden space-y-5">
      {/* Background ambient accent */}
      <div className="absolute right-0 top-0 w-80 h-80 bg-blue-50/60 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1e40af] text-white flex items-center justify-center shadow-xs">
            <Landmark className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-[#1e40af] uppercase tracking-wider block">
              Destaques do Patrimônio & Cultura Viva
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 font-['Outfit']">
              Centros & Espaços Culturais de Viamão
            </h3>
          </div>
        </div>

        {/* Point Picker Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {destaques.map(d => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedPontoId(d.id);
                setShowFullDetails(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedPontoId === d.id
                  ? 'bg-[#1e40af] text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border border-slate-200'
              }`}
            >
              <span>{getCategoryIcon(d.categoria, d.id)}</span>
              <span>{d.nome.length > 25 ? d.nome.slice(0, 23) + '...' : d.nome}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start relative z-10">
        {/* Left Column: Google Maps Information, Location Status & Support (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${getCategoryBadgeClass(
                  ponto.categoria
                )}`}
              >
                {ponto.categoria}
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Escopo Isolado & Auditado
              </span>
            </div>

            {/* Google Maps Details */}
            {ponto.google_maps_presente ? (
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">
                    Localização mapeada em Viamão
                  </span>
                  {ponto.google_maps_url && (
                    <a
                      href={sanitizeUrl(ponto.google_maps_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Abrir no Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Atuação Cultural Territorial Itinerante</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {ponto.nota_maps_explicacao ||
                    'Entidade de atuação cultural e comunitária territorial itinerante sem endereço físico fixo. As atividades ocorrem em espaços públicos de Viamão (praças, escolas e locais abertos).'}
                </p>
              </div>
            )}

            {(() => {
              const contactInfo = validateInstitutionalContact(ponto.contato);
              if (contactInfo.isAvailable) {
                return (
                  <div className="text-xs text-slate-700 flex items-center gap-1.5 pt-1 font-medium">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Contato Registrado: {contactInfo.display}</span>
                  </div>
                );
              }
              return (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1 italic">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Informação de contato não disponível no cadastro oficial validado.</span>
                </div>
              );
            })()}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              title="Copiar resumo"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-[#1e40af]" />}
              <span>{copiedLink ? 'Resumo Copiado!' : 'Compartilhar Espaço Cultural'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Cultural Role & Area (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              {ponto.nome}
            </h2>
          </div>

          {/* Área de Atuação e Resumo Descritivo */}
          <div className="space-y-2 p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1e40af]">
              <Sparkles className="w-4 h-4 text-[#1e40af] shrink-0" />
              <span className="uppercase tracking-wider text-[11px]">Área de Atuação:</span>
              <span className="text-slate-900 font-semibold">{ponto.categoria}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal pt-1">
              {ponto.resumo_geral_cultura || ponto.descricao}
            </p>
          </div>

          {/* Toggle Full Details */}
          <div className="pt-1">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e40af] hover:text-[#1d4ed8]"
            >
              <span>{showFullDetails ? 'Ocultar Detalhes Institucionais' : 'Ver Detalhes Institucionais & Atividades'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFullDetails ? 'rotate-90' : ''}`} />
            </button>

            {showFullDetails && (
              <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs animate-in fade-in duration-200">
                {ponto.informacoes_detalhadas?.atividades_principais && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-800 block">Oficinas e Ações Formativas:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {ponto.informacoes_detalhadas.atividades_principais.map((ativ, idx) => (
                        <li key={idx}>{ativ}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {ponto.informacoes_detalhadas?.publico_alvo && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Público-alvo: </span>
                    <span className="text-slate-700">{ponto.informacoes_detalhadas.publico_alvo}</span>
                  </div>
                )}

                {ponto.links_referencia && ponto.links_referencia.length > 0 ? (
                  <div className="pt-2 border-t border-slate-200 space-y-1.5">
                    <span className="font-bold text-slate-800 block text-xs">Documentos Oficiais Auditados:</span>
                    <div className="space-y-1">
                      {ponto.links_referencia.map((ref, idx) => (
                        <a
                          key={idx}
                          href={sanitizeUrl(ref.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-[#1e40af] text-slate-800 text-[11px] transition-colors"
                        >
                          <span className="font-medium">{ref.titulo}</span>
                          <ExternalLink className="w-3 h-3 text-[#1e40af] shrink-0 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Sem publicações ou links de referência vinculados no cadastro oficial.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
