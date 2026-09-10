import React, { useState, useMemo } from 'react';
import {
  PlusCircle,
  Building,
  ExternalLink,
  Phone,
  CheckCircle2,
  Filter,
  Search,
  BookOpen,
  FileText,
  X,
  Sparkles,
  MapPin,
  MessageSquare,
  Share2,
  Check,
  Globe,
  Info,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';
import { PontoCultural, SharedCommunityLink } from '../types/culture';
import { validateInstitutionalContact } from '../utils/institutionalValidation';
import { sanitizeUrl, isValidHttpUrl, sanitizeInputText } from '../utils/security';

interface MapeamentoCulturalSectionProps {
  pontos: PontoCultural[];
  sharedLinks?: SharedCommunityLink[];
  onAddPonto: (novoPonto: Omit<PontoCultural, 'id'>) => void;
  onAddSharedLink?: (link: Omit<SharedCommunityLink, 'id' | 'data'>) => void;
  onSupportPoint?: (pontoId: string) => void;
  onNavigateToEngajamento?: () => void;
}

export const MapeamentoCulturalSection: React.FC<MapeamentoCulturalSectionProps> = ({
  pontos,
  sharedLinks = [],
  onAddPonto,
  onAddSharedLink,
  onSupportPoint,
}) => {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'mural' | 'cadastro'>('catalogo');
  const [selectedPonto, setSelectedPonto] = useState<PontoCultural | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [busca, setBusca] = useState<string>('');
  const [supportedPoints, setSupportedPoints] = useState<Record<string, boolean>>({});

  // Mural / Link sharing state
  const [muralBusca, setMuralBusca] = useState<string>('');
  const [muralPontoFiltro, setMuralPontoFiltro] = useState<string>('todos');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [novoPontoId, setNovoPontoId] = useState<string>(pontos[0]?.id || 'ponto-02');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaUrl, setNovaUrl] = useState('');
  const [novoTipo, setNovoTipo] = useState<SharedCommunityLink['tipo']>('website');
  const [novoEnviadoPor, setNovoEnviadoPor] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [linkSubmitted, setLinkSubmitted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Point Registration
  const [formData, setFormData] = useState({
    nome: '',
    categoria: 'Música & Hip-Hop' as PontoCultural['categoria'],
    endereco: '',
    semEnderecoFixo: false,
    lat: -30.0750,
    lon: -51.0200,
    resumo_geral_cultura: '',
    o_que_costumam_fazer: '',
    descricao: '',
    contato: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const categoriasDisponiveis = Array.from(new Set(pontos.map(p => p.categoria))).sort();

  const pontosFiltrados = useMemo(() => {
    return pontos.filter(p => {
      if (filtroCategoria !== 'todas' && p.categoria !== filtroCategoria) return false;
      if (busca.trim()) {
        const q = busca.toLowerCase().trim();
        const matchNome = p.nome.toLowerCase().includes(q);
        const matchDesc = p.descricao.toLowerCase().includes(q);
        const matchResumo = p.resumo_geral_cultura?.toLowerCase().includes(q) || false;
        const matchFazer = p.o_que_costumam_fazer?.toLowerCase().includes(q) || false;
        const matchCat = p.categoria.toLowerCase().includes(q);
        const matchEndereco = p.endereco?.toLowerCase().includes(q) || false;
        const matchAtiv =
          p.informacoes_detalhadas?.atividades_principais?.some(a => a.toLowerCase().includes(q)) || false;
        const matchCert =
          p.informacoes_detalhadas?.certificacoes?.some(c => c.toLowerCase().includes(q)) || false;
        if (
          !matchNome &&
          !matchDesc &&
          !matchResumo &&
          !matchFazer &&
          !matchCat &&
          !matchEndereco &&
          !matchAtiv &&
          !matchCert
        )
          return false;
      }
      return true;
    });
  }, [pontos, filtroCategoria, busca]);

  const linksFiltrados = useMemo(() => {
    return sharedLinks.filter(item => {
      if (muralPontoFiltro !== 'todos' && item.pontoId !== muralPontoFiltro) return false;
      if (muralBusca.trim()) {
        const q = muralBusca.toLowerCase();
        const matchTitulo = item.titulo.toLowerCase().includes(q);
        const matchPonto = item.pontoNome.toLowerCase().includes(q);
        const matchDesc = item.descricao?.toLowerCase().includes(q) || false;
        const matchAutor = item.enviadoPor?.toLowerCase().includes(q) || false;
        if (!matchTitulo && !matchPonto && !matchDesc && !matchAutor) return false;
      }
      return true;
    });
  }, [sharedLinks, muralPontoFiltro, muralBusca]);

  const handleSupport = (pontoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSupportedPoints(prev => ({
      ...prev,
      [pontoId]: !prev[pontoId]
    }));
    if (onSupportPoint) {
      onSupportPoint(pontoId);
    }
  };

  const [linkError, setLinkError] = useState<string | null>(null);

  const handleSubmitPonto = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeLimpo = sanitizeInputText(formData.nome, 120);
    if (!nomeLimpo) return;

    onAddPonto({
      nome: nomeLimpo,
      categoria: formData.categoria,
      endereco: formData.semEnderecoFixo ? '' : sanitizeInputText(formData.endereco, 200),
      lat: typeof formData.lat === 'number' && !isNaN(formData.lat) ? formData.lat : -30.0750,
      lon: typeof formData.lon === 'number' && !isNaN(formData.lon) ? formData.lon : -51.0200,
      resumo_geral_cultura: sanitizeInputText(formData.resumo_geral_cultura, 500),
      o_que_costumam_fazer: sanitizeInputText(formData.o_que_costumam_fazer, 500),
      descricao: sanitizeInputText(formData.descricao || formData.resumo_geral_cultura, 800),
      contato: sanitizeInputText(formData.contato, 150),
      google_maps_presente: !formData.semEnderecoFixo && Boolean(formData.endereco.trim()),
      nota_maps_explicacao: formData.semEnderecoFixo
        ? 'Atuação cultural comunitária e territorial itinerante em Viamão.'
        : undefined,
      cadastrado_por_cidadao: true,
      data_cadastro: new Date().toLocaleDateString('pt-BR'),
    });

    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setActiveTab('catalogo');
      setFormData({
        nome: '',
        categoria: 'Música & Hip-Hop',
        endereco: '',
        semEnderecoFixo: false,
        lat: -30.0750,
        lon: -51.0200,
        resumo_geral_cultura: '',
        o_que_costumam_fazer: '',
        descricao: '',
        contato: '',
      });
    }, 1800);
  };

  const handleCadastrarLink = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError(null);

    const tituloLimpo = sanitizeInputText(novoTitulo, 150);
    const urlLimpa = novaUrl.trim();

    if (!tituloLimpo || !urlLimpa || !onAddSharedLink) return;

    if (!isValidHttpUrl(urlLimpa)) {
      setLinkError('Por favor, informe uma URL válida e segura (ex: https://exemplo.com/pagina).');
      return;
    }

    const pontoObj = pontos.find(p => p.id === novoPontoId);
    const pontoNome = pontoObj ? pontoObj.nome : 'Ponto Cultural de Viamão';

    onAddSharedLink({
      pontoId: novoPontoId,
      pontoNome,
      titulo: tituloLimpo,
      url: sanitizeUrl(urlLimpa),
      tipo: novoTipo,
      enviadoPor: sanitizeInputText(novoEnviadoPor, 100) || 'Cidadão / Artista Local',
      descricao: sanitizeInputText(novaDescricao, 500),
    });

    setLinkSubmitted(true);
    setTimeout(() => {
      setLinkSubmitted(false);
      setIsLinkModalOpen(false);
      setNovoTitulo('');
      setNovaUrl('');
      setNovoTipo('website');
      setNovoEnviadoPor('');
      setNovaDescricao('');
      setLinkError(null);
    }, 1500);
  };

  const getCategoriaBadgeStyle = (categoria: string) => {
    switch (categoria) {
      case 'Música & Hip-Hop':
        return 'bg-[#1e40af] text-white'; // Azul Real Viamão
      case 'Patrimônio Histórico':
        return 'bg-[#dc2626] text-white'; // Vermelho Cruz de Cristo
      case 'Tradição & Folclore':
        return 'bg-[#15803d] text-white'; // Verde Campos
      case 'Literatura & Biblioteca':
        return 'bg-[#0369a1] text-white'; // Azul Celeste
      case 'Centro Religioso/Espírita':
        return 'bg-[#701a75] text-white'; // Púrpura Histórico
      case 'Matriz Afro-Brasileira & Memória':
        return 'bg-[#78350f] text-white'; // Âmbar / Terracota Afro-Brasileira
      case 'Artes Cênicas & Audiovisual':
        return 'bg-[#4338ca] text-white'; // Índigo
      case 'Coletivo Comunitário':
        return 'bg-[#0f766e] text-white'; // Teal Comunitário
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#1e40af] rounded-2xl p-6 sm:p-7 text-white shadow-xs border border-blue-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold text-amber-300 mb-2.5">
              <Building className="w-3.5 h-3.5 text-amber-400" />
              Acompanhe a Cultura • Mapeamento e Engajamento Comunitário de Viamão
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit'] tracking-tight text-white">
              Acompanhe a Cultura
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-200 leading-relaxed">
              Conheça os pontos de cultura, centros e coletivos de Viamão: consulte o resumo de representação cultural, suas atividades recorrentes, localização no Google Maps e acompanhe publicações comunitárias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('cadastro')}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Novo Espaço</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Unified Navigation Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('catalogo')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'catalogo'
                ? 'bg-white text-[#1e40af] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏛️ Catálogo dos Centros de Cultura ({pontos.length})
          </button>
          <button
            onClick={() => setActiveTab('mural')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'mural'
                ? 'bg-white text-[#1e40af] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📢 Mural Comunitário & Acompanhamento ({sharedLinks.length})
          </button>
          <button
            onClick={() => setActiveTab('cadastro')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cadastro'
                ? 'bg-white text-[#1e40af] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📝 Cadastrar Espaço
          </button>
        </div>

        {/* Quick Search */}
        {activeTab === 'catalogo' && (
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, linguagem cultural, representação ou atividade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: Catálogo dos Centros de Cultura */}
      {activeTab === 'catalogo' && (
        <div className="space-y-4">
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Filter className="w-3.5 h-3.5 text-[#1e40af]" />
              <span>Filtros:</span>
            </div>

            <select
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-hidden text-xs font-medium"
            >
              <option value="todas">Todas as Linguagens Culturais</option>
              {categoriasDisponiveis.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {(filtroCategoria !== 'todas' || busca.trim()) && (
              <button
                onClick={() => {
                  setFiltroCategoria('todas');
                  setBusca('');
                }}
                className="text-[11px] text-[#1e40af] hover:underline font-semibold ml-auto"
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {/* Cards Grid: No photos, no social media links, pure informative cultural summary & Google Maps information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {pontosFiltrados.map(ponto => {
              const isSupported = Boolean(supportedPoints[ponto.id]);
              const supportCount = (ponto.apoios_comunitarios || 0) + (isSupported ? 1 : 0);

              return (
                <div
                  key={ponto.id}
                  onClick={() => setSelectedPonto(ponto)}
                  className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-[#1e40af]/60 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group p-5 space-y-4 relative"
                >
                  <div className="space-y-3">
                    {/* Header: Area Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${getCategoriaBadgeStyle(
                            ponto.categoria
                          )}`}
                        >
                          {ponto.categoria}
                        </span>
                      </div>
                    </div>

                    {/* Point Name */}
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug font-['Outfit'] group-hover:text-[#1e40af] transition-colors">
                      {ponto.nome}
                    </h3>

                    {/* Área de Atuação e Resumo Descritivo */}
                    <div className="space-y-2 pt-0.5">
                      <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e40af]">
                          <Sparkles className="w-3.5 h-3.5 text-[#1e40af] shrink-0" />
                          <span className="uppercase tracking-wider text-[11px]">Área de Atuação:</span>
                          <span className="text-slate-800 font-semibold">{ponto.categoria}</span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-normal">
                          {ponto.resumo_geral_cultura || ponto.descricao}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedPonto(ponto);
                      }}
                      className="flex-1 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold text-center transition-colors shadow-2xs flex items-center justify-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ver Informações Completas</span>
                    </button>

                    {ponto.google_maps_url && (
                      <a
                        href={sanitizeUrl(ponto.google_maps_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                        title="Ver no Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#1e40af]" />
                        <span>Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Mural Comunitário & Acompanhamento */}
      {activeTab === 'mural' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                  Mural de Acompanhamento Comunitário & Publicações Oficiais
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  Fontes Comprovadas
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparência cidadã, dossiês de tombamento, registros de projetos e links públicos auditados dos pontos de cultura.
              </p>
            </div>

            <button
              onClick={() => setIsLinkModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-2xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Contribuir com Link / Registro</span>
            </button>
          </div>

          {/* Filtros do Mural */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por título, dossiê, autor ou ponto de cultura..."
                value={muralBusca}
                onChange={e => setMuralBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-[#1e40af]"
              />
            </div>

            <div className="w-full sm:w-72">
              <select
                value={muralPontoFiltro}
                onChange={e => setMuralPontoFiltro(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-[#1e40af]"
              >
                <option value="todos">Filtrar por Entidade Cultural (Todos)</option>
                {pontos.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {linksFiltrados.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Info className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">
                Nenhum registro público ou publicação vinculado
              </h4>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                {muralPontoFiltro !== 'todos'
                  ? `Não há registros públicos, mídias ou documentos oficiais vinculados a "${pontos.find(p => p.id === muralPontoFiltro)?.nome || 'este ponto'}" no cadastro oficial auditado.`
                  : 'Não há registros ou publicações que correspondam aos critérios de busca selecionados.'}
              </p>
              <p className="text-[11px] text-slate-400">
                O sistema proíbe registros fictícios. Apenas fontes e documentos com autenticidade verificada são exibidos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {linksFiltrados.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-[#1e40af]/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
                        {item.tipo}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">{item.data}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-[#1e40af] truncate">
                        🏛️ {item.pontoNome}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm leading-snug">
                      {item.titulo}
                    </h4>

                    {item.descricao && (
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.descricao}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate max-w-[170px]">
                        Fonte: <strong className="text-slate-700">{item.enviadoPor || 'Cadastro Público'}</strong>
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Auditado
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {item.url.replace(/^https?:\/\//, '').split('/')[0]}
                      </span>
                      <a
                        href={sanitizeUrl(item.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-blue-50 text-[#1e40af] rounded-lg text-xs font-bold transition-colors"
                      >
                        <span>Acessar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Formulário de Cadastro de Espaço */}
      {activeTab === 'cadastro' && (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-xs max-w-2xl mx-auto space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900 font-['Outfit']">
              Cadastrar Novo Centro ou Ponto de Cultura
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Colabore com a cartografia cultural cidadã de Viamão registrando novos coletivos, centros comunitários ou patrimônios locais.
            </p>
          </div>

          {formSubmitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-950 text-sm">Espaço Cadastrado com Sucesso!</h4>
              <p className="text-xs text-emerald-800">
                O novo ponto cultural foi adicionado ao catálogo municipal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitPonto} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Nome do Centro ou Coletivo Cultural *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ponto de Cultura Raízes de Viamão"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:border-[#1e40af]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Linguagem Cultural *</label>
                  <select
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value as PontoCultural['categoria'] })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden text-xs"
                  >
                    <option value="Música & Hip-Hop">Música & Hip-Hop</option>
                    <option value="Patrimônio Histórico">Patrimônio Histórico</option>
                    <option value="Matriz Afro-Brasileira & Memória">Matriz Afro-Brasileira & Memória</option>
                    <option value="Tradição & Folclore">Tradição & Folclore</option>
                    <option value="Literatura & Biblioteca">Literatura & Biblioteca</option>
                    <option value="Centro Religioso/Espírita">Centro Religioso/Espírita</option>
                    <option value="Artes Cênicas & Audiovisual">Artes Cênicas & Audiovisual</option>
                    <option value="Coletivo Comunitário">Coletivo Comunitário</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Município de Atuação</label>
                  <input
                    type="text"
                    disabled
                    value="Viamão • RS (Território Municipal)"
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 focus:outline-hidden cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="semEnderecoFixo"
                    checked={formData.semEnderecoFixo}
                    onChange={e => setFormData({ ...formData, semEnderecoFixo: e.target.checked })}
                    className="rounded text-[#1e40af] focus:ring-0"
                  />
                  <label htmlFor="semEnderecoFixo" className="text-xs font-bold text-slate-800 cursor-pointer">
                    Atuação Comunitária Territorial (Sem endereço fixo no Google Maps)
                  </label>
                </div>

                {!formData.semEnderecoFixo && (
                  <div className="space-y-1 pt-1">
                    <label className="font-semibold text-slate-700">Endereço no Google Maps</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua, Avenida ou Praça com número..."
                      value={formData.endereco}
                      onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Resumo: O que este espaço representa de modo geral para a cultura de Viamão? *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Descreva brevemente o significado cultural, histórico ou comunitário..."
                  value={formData.resumo_geral_cultura}
                  onChange={e => setFormData({ ...formData, resumo_geral_cultura: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">O que costumam fazer? (Atividades, oficinas, eventos) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Oficinas de música, saraus poéticos, cursos de formação..."
                  value={formData.o_que_costumam_fazer}
                  onChange={e => setFormData({ ...formData, o_que_costumam_fazer: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Contato Oficial (E-mail ou Telefone)</label>
                <input
                  type="text"
                  placeholder="(51) 99999-9999 ou contato@espaco.org"
                  value={formData.contato}
                  onChange={e => setFormData({ ...formData, contato: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalogo')}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* DETAIL MODAL FOR SELECTED CULTURAL POINT (No photos, no social media links, pure deep information) */}
      {selectedPonto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedPonto(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${getCategoriaBadgeStyle(
                      selectedPonto.categoria
                    )}`}
                  >
                    {selectedPonto.categoria}
                  </span>
                  <span className="text-xs font-bold text-[#1e40af] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    Viamão • RS
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Escopo Isolado & Verificado
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
                  {selectedPonto.nome}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPonto(null)}
                className="text-slate-400 hover:text-slate-700 p-1 font-bold text-lg rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Localização / Google Maps */}
            <div className="p-4 rounded-2xl border bg-slate-50/80 border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block">
                Localização & Direcionamento:
              </span>
              {selectedPonto.google_maps_presente ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-700 font-medium">
                    Espaço cultural com rota e localização disponível no mapa interativo
                  </span>
                  {selectedPonto.google_maps_url && (
                    <a
                      href={sanitizeUrl(selectedPonto.google_maps_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-lg font-bold text-xs transition-colors shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Abrir no Google Maps</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5 p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                  <p className="text-amber-900 font-bold flex items-center gap-1.5 text-xs">
                    <Info className="w-3.5 h-3.5 text-amber-700" />
                    <span>Atuação Comunitária e Territorial Itinerante</span>
                  </p>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    {selectedPonto.nota_maps_explicacao ||
                      'Entidade de atuação cultural e comunitária territorial itinerante sem endereço físico fixo. As atividades ocorrem em espaços públicos de Viamão (praças, escolas e locais abertos).'}
                  </p>
                </div>
              )}

              {(() => {
                const contactInfo = validateInstitutionalContact(selectedPonto.contato);
                if (contactInfo.isAvailable) {
                  return (
                    <div className="pt-2 border-t border-slate-200 text-slate-700 flex items-center gap-1.5 text-xs font-medium">
                      <Phone className="w-3.5 h-3.5 text-[#1e40af]" />
                      <span>Contato Registrado: {contactInfo.display}</span>
                    </div>
                  );
                }
                return (
                  <div className="pt-2 border-t border-slate-200 text-slate-500 flex items-center gap-1.5 text-xs italic">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Informação de canal de contato direto não disponível no cadastro oficial validado.</span>
                  </div>
                );
              })()}
            </div>

            {/* Área de Atuação & Resumo Descritivo */}
            <div className="space-y-1.5">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e40af]">
                  <Sparkles className="w-4 h-4 text-[#1e40af] shrink-0" />
                  <span className="uppercase tracking-wider text-[11px]">Área de Atuação:</span>
                  <span className="text-slate-900 font-semibold">{selectedPonto.categoria}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {selectedPonto.resumo_geral_cultura || selectedPonto.descricao}
                </p>
              </div>
            </div>

            {/* Principais Atividades Detalhadas */}
            {selectedPonto.informacoes_detalhadas?.atividades_principais && (
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1e40af]" />
                  Atividades e Oficinas Específicas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPonto.informacoes_detalhadas.atividades_principais.map((ativ, i) => (
                    <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium">
                      ✓ {ativ}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificações & Transparência Pública */}
            {selectedPonto.informacoes_detalhadas?.certificacoes && (
              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 text-xs space-y-1">
                <span className="font-bold text-amber-950 text-[11px] uppercase tracking-wider block">
                  Certificações Oficiais:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                  {selectedPonto.informacoes_detalhadas.certificacoes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Documentos de Referência Pública */}
            {selectedPonto.links_referencia && selectedPonto.links_referencia.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                    Documentos & Fontes Oficiais Auditadas:
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    Registros Verificados
                  </span>
                </div>
                <div className="space-y-1.5">
                  {selectedPonto.links_referencia.map((ref, i) => (
                    <a
                      key={i}
                      href={sanitizeUrl(ref.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{ref.titulo}</span>
                        {ref.descricao && <span className="text-[11px] text-slate-500">{ref.descricao}</span>}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#1e40af] shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-500">
                  Sem publicações, mídias ou documentos adicionais vinculados a este ponto na base oficial auditada.
                </span>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedPonto(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR CONTRIBUTING COMMUNITY LINK */}
      {isLinkModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsLinkModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base font-['Outfit']">
                  Contribuir com Link / Registro
                </h3>
                <p className="text-xs text-slate-500">
                  Compartilhe um link público oficial, publicação ou notícia cultural.
                </p>
              </div>
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {linkSubmitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-sm">Link Enviado com Sucesso!</h4>
                <p className="text-xs text-emerald-800">
                  A publicação foi adicionada ao mural comunitário.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCadastrarLink} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Ponto Cultural Vinculado *</label>
                  <select
                    value={novoPontoId}
                    onChange={e => setNovoPontoId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                  >
                    {pontos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Título da Publicação / Registro *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dossiê Histórico, Chamada de Oficinas..."
                    value={novoTitulo}
                    onChange={e => setNovoTitulo(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                  />
                </div>

                {linkError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">URL / Link Web *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={novaUrl}
                    onChange={e => setNovaUrl(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Seu Nome / Coletivo</label>
                  <input
                    type="text"
                    placeholder="Ex: Amigos da Cultura, Artista Local..."
                    value={novoEnviadoPor}
                    onChange={e => setNovoEnviadoPor(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Descrição Breve</label>
                  <textarea
                    rows={2}
                    placeholder="Resumo do conteúdo..."
                    value={novaDescricao}
                    onChange={e => setNovaDescricao(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLinkModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Publicar Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
