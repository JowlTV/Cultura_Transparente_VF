export interface Emenda {
  id: string;
  ano: number;
  parlamentar: string;
  partido?: string;
  partido_sigla?: string;
  foto_parlamentar?: string;
  esfera: 'Federal (API CGU)' | 'Estadual (ALRS)';
  orgao: string;
  secretaria: string;
  projeto: string;
  subprojeto: string;
  valor: number; // valor alocado
  valor_gasto: number; // gasto realizado / liquidado
  status: 'Execução não iniciada' | 'Em Execução / Vigente' | 'Parceria' | 'Concluída';
  is_cultura: boolean;
  area_atuacao: string;
  tipo_projeto_cultural?: 'Hip-Hop & Cultura Urbana' | 'Patrimônio & Restauro' | 'Audiovisual & Cinema' | 'Tradição & Folclore' | 'Literatura & Leitura' | 'Música & Artes Cênicas' | 'Outras Áreas';
  justificativa: string;
  fonte: string;
  fontes_cruzadas: string[];
  numeroEmenda?: string;
  beneficiario?: string;
  empenho_numero?: string;
  processo_administrativo?: string;
}

export interface PnabRecord {
  id: string;
  rubrica: string;
  valor_exato: number;
  data_extrato: string;
  banco_custodia: string;
  conta_vinculada: string;
  cnpj_destinatario: string;
  origem_detalhada: string;
  contexto_legal: string;
  fonte_link: string;
  termo_numero: string;
  status_etapa: string;
  sincronizacao_pendente?: boolean;
  base_legal?: string;
  fonte_auditada?: string;
}

export interface LeiIncentivo {
  id: string;
  mecanismo: string;
  projeto_objeto: string;
  valor_aprovado: number;
  valor_captado?: number;
  origem_recurso: string;
  destino_recurso: string;
  orgao_liberador: string;
  responsavel_execucao: string;
  status_atual: string;
  como_sera_feito: string;
  fonte_oficial: string;
  pronac_numero?: string;
  periodo_execucao?: string;
  status?: string;
  detalhes?: string;
  proponente?: string;
  link_oficial?: string;
}

export interface CulturalLinkRef {
  titulo: string;
  url: string;
  tipo: 'instagram' | 'facebook' | 'youtube' | 'spotify' | 'whatsapp'  | 'noticia' | 'documento' | 'outro';
  descricao?: string;
}

export interface PontoCultural {
  id: string;
  nome: string;
  categoria:
    | 'Música & Hip-Hop'
    | 'Patrimônio Histórico'
    | 'Tradição & Folclore'
    | 'Centro Religioso/Espírita'
    | 'Literatura & Biblioteca'
    | 'Artes Cênicas & Audiovisual'
    | 'Matriz Afro-Brasileira & Memória'
    | 'Coletivo Comunitário';
  endereco?: string;
  bairro?: string; // Mantido apenas para compatibilidade opcional; não exibido na interface
  lat?: number;
  lon?: number;
  descricao: string;
  resumo_geral_cultura?: string;
  o_que_costumam_fazer?: string;
  link_foto?: string;
  fotos_galeria?: string[];
  contato?: string;
  cadastrado_por_cidadao?: boolean;
  data_cadastro?: string;
  destaque_comunitario?: boolean;
  apoios_comunitarios?: number;
  google_maps_presente?: boolean;
  google_maps_url?: string;
  google_nota?: number;
  google_avaliacoes_total?: number;
  nota_maps_explicacao?: string;
  redes?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
    whatsapp?: string;
    site?: string;
  };
  links_referencia?: CulturalLinkRef[];
  informacoes_detalhadas?: {
    atividades_principais?: string[];
    publico_alvo?: string;
    horario_funcionamento?: string;
    projetos_em_andamento?: string[];
    como_participar?: string;
    termo_mrosc?: string;
    emenda_vinculada?: string;
  };
}

export interface SharedCommunityLink {
  id: string;
  pontoId: string;
  pontoNome: string;
  titulo: string;
  url: string;
  tipo: 'instagram' | 'facebook' | 'youtube' | 'spotify' | 'whatsapp'  | 'noticia' | 'documento' | 'outro';
  enviadoPor: string;
  data: string;
  descricao?: string;
}

export interface NewsItem {
  id: string;
  data: string;
  origem: 'Federal (MinC)' | 'Municipal (Viamão)' | 'Estadual (SEDAC-RS)' | 'Controle Social' | 'Ministério Público';
  categoria_filtro: 'editais' | 'ministerio-publico' | 'governo-federal' | 'sedac-rs' | 'viamao';
  titulo: string;
  resumo: string;
  link: string;
  etiqueta: string;
  imagem?: string;
  jurisdicao?: 'Nacional (Brasil)' | 'Estadual (RS)' | 'Municipal (Viamão)' | 'Restrito Porto Alegre (Alerta)' | 'Regional (Metropolitana)';
  elegibilidade?: string;
  prazo?: string;
  plataforma?: string;
  requisitos_praticos?: string[];
  alerta_inabilitacao?: string;
}

export interface ApiEndpointDoc {
  id: string;
  nome: string;
  esfera: string;
  url: string;
  metodo: 'GET' | 'POST';
  descricao: string;
  parametros: { nome: string; tipo: string; descricao: string; exemplo: string }[];
  exemploResposta: string;
}

export interface FacEdital {
  id: string;
  numero_edital: string;
  nome: string;
  segmento: string;
  mecanismo: 'Fundo de Apoio à Cultura (FAC)' | 'Lei de Incentivo à Cultura (LIC)' | 'Pró-cultura RS (FAC / LIC)';
  valor_total_edital?: number;
  valor_maximo_projeto?: number;
  publico_alvo: string;
  exigencia_proponente: string;
  requisitos_principais: string[];
  status: 'Inscrições Abertas' | 'Em Avaliação' | 'Homologado / Execução' | 'Prestação de Contas' | 'Previsto / Calendário' | 'Sincronização pendente com o Pró-cultura RS';
  prazo_inscricao: string;
  link_oficial: string;
  plataforma: string;
  contrapartida_exigida: string;
  sincronizacao_pendente?: boolean;
  base_legal?: string;
}
