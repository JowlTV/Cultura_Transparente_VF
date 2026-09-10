import React, { useState, useMemo } from 'react';
import {
  Share2,
  ExternalLink,
  PlusCircle,
  Heart,
  Search,
  Check,
  Sparkles,
  MessageCircle,
  FileText,
  MapPin,
  CheckCircle2,
  Users,
  Award,
  ShieldCheck,
  Info
} from 'lucide-react';
import { PontoCultural, SharedCommunityLink } from '../types/culture';
import { sanitizeUrl } from '../utils/security';

interface RedesEngajamentoSectionProps {
  pontos: PontoCultural[];
  sharedLinks: SharedCommunityLink[];
  onAddSharedLink: (link: Omit<SharedCommunityLink, 'id' | 'data'>) => void;
  onSupportPoint: (pontoId: string) => void;
  onNavigateToMap: (pontoId: string) => void;
}

export const RedesEngajamentoSection: React.FC<RedesEngajamentoSectionProps> = ({
  pontos,
  sharedLinks,
  onAddSharedLink,
  onSupportPoint,
  onNavigateToMap,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroPonto, setFiltroPonto] = useState<string>('todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [supportedPoints, setSupportedPoints] = useState<Record<string, boolean>>({});

  // Form State
  const [novoPontoId, setNovoPontoId] = useState<string>(pontos[0]?.id || 'ponto-02');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaUrl, setNovaUrl] = useState('');
  const [novoTipo, setNovoTipo] = useState<SharedCommunityLink['tipo']>('instagram');
  const [novoEnviadoPor, setNovoEnviadoPor] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');

  // Total engagement statistics
  const totalPontos = pontos.length;
  const totalLinks = sharedLinks.length;
  const totalApoios = useMemo(() => {
    return pontos.reduce((acc, curr) => acc + (curr.apoios_comunitarios || 0), 0) +
      Object.keys(supportedPoints).length;
  }, [pontos, supportedPoints]);

  // Filtered links
  const linksFiltrados = useMemo(() => {
    return sharedLinks.filter(item => {
      if (filtroTipo !== 'todos' && item.tipo !== filtroTipo) return false;
      if (filtroPonto !== 'todos' && item.pontoId !== filtroPonto) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const matchTitulo = item.titulo.toLowerCase().includes(q);
        const matchPonto = item.pontoNome.toLowerCase().includes(q);
        const matchDesc = item.descricao?.toLowerCase().includes(q) || false;
        const matchAutor = item.enviadoPor?.toLowerCase().includes(q) || false;
        if (!matchTitulo && !matchPonto && !matchDesc && !matchAutor) return false;
      }
      return true;
    });
  }, [sharedLinks, filtroTipo, filtroPonto, busca]);

  const handleSubmitLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !novaUrl.trim()) return;

    const pontoObj = pontos.find(p => p.id === novoPontoId);
    const pontoNome = pontoObj ? pontoObj.nome : 'Ponto Cultural de Viamão';

    onAddSharedLink({
      pontoId: novoPontoId,
      pontoNome,
      titulo: novoTitulo.trim(),
      url: novaUrl.trim(),
      tipo: novoTipo,
      enviadoPor: novoEnviadoPor.trim() || 'Cidadão / Artista Local',
      descricao: novaDescricao.trim(),
    });

    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setIsFormOpen(false);
      setNovoTitulo('');
      setNovaUrl('');
      setNovoTipo('instagram');
      setNovoEnviadoPor('');
      setNovaDescricao('');
    }, 1600);
  };

  const handleCopyLink = (item: SharedCommunityLink) => {
    const text = `Confira o link cultural de Viamão: "${item.titulo}" (${item.pontoNome})\nAcesse: ${item.url}`;
    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleShareWhatsApp = (item: SharedCommunityLink) => {
    const text = encodeURIComponent(
      `🎭 *Engajamento Cultural Viamão / RS*\n\n📌 *${item.titulo}*\n🏛️ Espaço: ${item.pontoNome}\n✨ ${item.descricao || ''}\n🔗 Acesse aqui: ${item.url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSupportPoint = (pontoId: string) => {
    if (supportedPoints[pontoId]) return;
    setSupportedPoints(prev => ({ ...prev, [pontoId]: true }));
    onSupportPoint(pontoId);
  };

  const getTipoBadgeStyle = (tipo: SharedCommunityLink['tipo']) => {
    switch (tipo) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white';
      case 'youtube':
        return 'bg-[#dc2626] text-white';
      case 'spotify':
        return 'bg-[#15803d] text-white';
      case 'facebook':
        return 'bg-[#1e40af] text-white';
      case 'whatsapp':
        return 'bg-emerald-600 text-white';
      case 'documento':
        return 'bg-slate-700 text-white';
      case 'noticia':
        return 'bg-slate-800 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner - Cores da Bandeira de Viamão */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] rounded-3xl p-6 sm:p-8 text-white shadow-xs border border-blue-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-300">
              <Share2 className="w-3.5 h-3.5 text-amber-300" />
              Espaço de Redes & Engajamento Cultural Coletivo
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
              Conecte-se aos Pontos Culturais de Viamão
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Aqui a comunidade compartilha canais, perfis de Instagram, playlists, vídeos e documentos de referência para gerar público e fortalecimento contínuo para os coletivos artísticos da cidade.
            </p>
          </div>

          {/* Call to action button */}
          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="px-4 py-3 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all border border-blue-400/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Compartilhar Nova Rede / Link</span>
            </button>
          </div>
        </div>

        {/* Aggregate Engagement Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/20 text-xs">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
            <span className="text-slate-300 block text-[11px]">Pontos Conectados:</span>
            <span className="text-lg font-bold text-amber-300 font-['Outfit']">{totalPontos} Espaços</span>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
            <span className="text-slate-300 block text-[11px]">Links Compartilhados:</span>
            <span className="text-lg font-bold text-white font-['Outfit']">{totalLinks} Referências</span>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
            <span className="text-slate-300 block text-[11px]">Apoios da Comunidade:</span>
            <span className="text-lg font-bold text-rose-300 font-['Outfit']">{totalApoios} Demonstrações</span>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-white/10">
            <span className="text-slate-300 block text-[11px]">Destaque Comunitário:</span>
            <span className="text-xs font-bold text-blue-200 font-['Outfit'] truncate block mt-1">
              Associação da Cultura Hip-Hop
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Sharing Form */}
      {isFormOpen && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border-2 border-blue-200 shadow-lg space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-['Outfit'] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#1e40af]" />
                Compartilhar Link ou Rede de um Ponto Cultural
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Divulgue um Instagram, canal do YouTube, playlist no Spotify ou documento público para apoiar a cultura de Viamão.
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
            >
              ✕
            </button>
          </div>

          {formSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#15803d] mx-auto" />
              <h4 className="font-bold text-emerald-900 text-sm font-['Outfit']">
                Link Cultural Compartilhado com Sucesso!
              </h4>
              <p className="text-xs text-emerald-700">
                O link já está visível para todos os cidadãos no mural comunitário. Obrigado por apoiar a cultura de Viamão!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitLink} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Cultural Point */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Ponto de Cultura Correspondente *:
                  </label>
                  <select
                    value={novoPontoId}
                    onChange={e => setNovoPontoId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                    required
                  >
                    {pontos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Platform / Link Type */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Tipo de Link / Rede *:
                  </label>
                  <select
                    value={novoTipo}
                    onChange={e => setNovoTipo(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                    required
                  >
                    <option value="instagram">Instagram (@)</option>
                    <option value="youtube">YouTube (Canal / Vídeo)</option>
                    <option value="spotify">Spotify (Música / Playlist)</option>
                    <option value="facebook">Facebook</option>
                    <option value="whatsapp">Grupo / Canal WhatsApp</option>
                    <option value="documento">Documento / MROSC / Prestação de Contas</option>
                    <option value="noticia">Notícia / Matéria de Imprensa</option>
                    <option value="website">Site Oficial / Portal MinC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Título Chamativo do Conteúdo *:
                  </label>
                  <input
                    type="text"
                    value={novoTitulo}
                    onChange={e => setNovoTitulo(e.target.value)}
                    placeholder="Ex: Oficinas Gratuitas de Breakdance e Hip-Hop em Viamão"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                    required
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Endereço Web / Link (URL) *:
                  </label>
                  <input
                    type="url"
                    value={novaUrl}
                    onChange={e => setNovaUrl(e.target.value)}
                    placeholder="https://instagram.com/hiphopviamao ou https://youtube.com/..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Shared By */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Seu Nome ou Nome do Coletivo / Artista:
                  </label>
                  <input
                    type="text"
                    value={novoEnviadoPor}
                    onChange={e => setNovoEnviadoPor(e.target.value)}
                    placeholder="Ex: Coletivo Rima e Cidadania / Amigos da Matriz"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Por que as pessoas devem acessar este link?
                  </label>
                  <input
                    type="text"
                    value={novaDescricao}
                    onChange={e => setNovaDescricao(e.target.value)}
                    placeholder="Ex: Fotos dos ensaios e orientações para inscrição gratuita de jovens."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Publicar no Mural de Engajamento
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Directory of Cultural Points Social Hubs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Acompanhe a cultura de Viamão!
            </h3>
            <p className="text-xs text-slate-500">
              Canais oficiais, páginas e atalhos de contato direto para você seguir, compartilhar e apoiar os coletivos locais.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pontos.map(p => {
            const supports = (p.apoios_comunitarios || 0) + (supportedPoints[p.id] ? 1 : 0);
            const isSupported = supportedPoints[p.id];

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo & Header Badge */}
                  <div className="h-44 relative overflow-hidden bg-slate-900">
                    <img
                      src={p.link_foto}
                      alt={p.nome}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#1e40af] text-white shadow-md">
                        {p.categoria}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-bold text-sm leading-snug font-['Outfit'] text-white truncate">
                        {p.nome}
                      </h4>
                      <p className="text-[11px] text-blue-100 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-amber-300 shrink-0" />
                        <span>
                          {p.endereco && p.endereco.trim().length > 0
                            ? p.endereco
                            : 'Atuação Comunitária Territorial'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Body & Description */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {p.descricao}
                    </p>

                    {/* Direct Social Networks Row */}
                    {p.redes && Object.values(p.redes).some(v => Boolean(v)) ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Redes Oficiais do Ponto:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {p.redes.instagram && (
                            <a
                              href={sanitizeUrl(p.redes.instagram)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-900 text-[11px] font-semibold transition-colors border border-pink-200"
                              title="Instagram"
                            >
                              <span>Instagram</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
                          {p.redes.youtube && (
                            <a
                              href={sanitizeUrl(p.redes.youtube)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 text-[11px] font-semibold transition-colors border border-red-200"
                              title="YouTube"
                            >
                              <span>YouTube</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
                          {p.redes.spotify && (
                            <a
                              href={sanitizeUrl(p.redes.spotify)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-semibold transition-colors border border-emerald-200"
                              title="Spotify"
                            >
                              <span>Spotify</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
                          {p.redes.whatsapp && (
                            <a
                              href={sanitizeUrl(p.redes.whatsapp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#15803d] text-[11px] font-semibold transition-colors border border-emerald-200"
                              title="WhatsApp"
                            >
                              <span>WhatsApp</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          )}
                          {p.redes.facebook && (
                            <a
                              href={sanitizeUrl(p.redes.facebook)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-semibold transition-colors border border-blue-200"
                              title="Facebook"
                            >
                              <span>Facebook</span>
                            </a>
                          )}
                          {p.redes.site && (
                            <a
                              href={sanitizeUrl(p.redes.site)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold transition-colors border border-slate-300"
                              title="Portal / Informações"
                            >
                              <span>Portal</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Sem perfis digitais oficiais vinculados no cadastro validado.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 pt-0 space-y-2 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      onClick={() => handleSupportPoint(p.id)}
                      className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                        isSupported
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-white hover:bg-rose-50 text-rose-700 border border-slate-200'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isSupported ? 'fill-rose-600 text-rose-600' : 'text-rose-500'}`} />
                      <span>{isSupported ? 'Apoiado!' : 'Apoiar Espaço'}</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-200/70 text-rose-900 text-[10px] font-bold">
                        {supports}
                      </span>
                    </button>

                    <button
                      onClick={() => onNavigateToMap(p.id)}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
                      title="Ver catálogo de centros culturais"
                    >
                      Ver Espaço
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Community Shared Links Wall */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit'] flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#1e40af]" />
              Mural Comunitário de Links & Referências Culturais
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Links compartilhados por cidadãos, agentes culturais e coletivos de Viamão para divulgação pública.
            </p>
          </div>

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-3.5 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold self-start md:self-auto transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Compartilhar um Link</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, espaço cultural (Hip-Hop, Matriz...), linguagem ou autor..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filtroTipo}
              onChange={e => setFiltroTipo(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="instagram">Instagram</option>
              <option value="youtube">YouTube</option>
              <option value="spotify">Spotify</option>
              <option value="facebook">Facebook</option>
              <option value="documento">Documento / MROSC</option>
              <option value="noticia">Notícias</option>
            </select>

            <select
              value={filtroPonto}
              onChange={e => setFiltroPonto(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden"
            >
              <option value="todos">Todos os Pontos</option>
              {pontos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Wall Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {linksFiltrados.length === 0 ? (
            <div className="col-span-2 text-center py-10 bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
              <Info className="w-8 h-8 mx-auto text-slate-400" />
              <p className="font-bold text-slate-700 text-sm">
                Nenhuma publicação ou link oficial vinculado
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {filtroPonto !== 'todos'
                  ? `Não há publicações, mídias ou documentos adicionais vinculados a "${pontos.find(p => p.id === filtroPonto)?.nome || 'este ponto'}" no cadastro oficial.`
                  : 'Nenhum registro corresponde aos filtros ou termos pesquisados.'}
              </p>
              <p className="text-[11px] text-slate-400 pt-1">
                A plataforma só exibe registros e canais oficiais auditados.
              </p>
            </div>
          ) : (
            linksFiltrados.map(item => {
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-4 sm:p-5 border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${getTipoBadgeStyle(
                          item.tipo
                        )}`}
                      >
                        {item.tipo}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.data}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 font-['Outfit'] leading-snug">
                      {item.titulo}
                    </h4>

                    <div className="flex items-center gap-1 text-xs text-[#1e40af] font-semibold">
                      <MapPin className="w-3 h-3 text-[#1e40af]" />
                      <span>{item.pontoNome}</span>
                    </div>

                    {item.descricao && (
                      <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                        {item.descricao}
                      </p>
                    )}

                    {item.enviadoPor && (
                      <div className="text-[11px] text-slate-500 pt-0.5">
                        Compartilhado por: <strong className="text-slate-700">{item.enviadoPor}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <a
                      href={sanitizeUrl(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <span>Acessar Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleShareWhatsApp(item)}
                        className="p-1.5 bg-[#15803d] hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        title="Enviar no WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleCopyLink(item)}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                        title="Copiar Link"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-[#15803d]" /> : null}
                        <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
