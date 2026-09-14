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

export interface LpgMetaItem {
  id_meta_plano_acao?: number;
  numero_meta_plano_acao: string;
  nome_meta_plano_acao: string;
  descricao_meta_plano_acao: string;
  valor_meta_plano_acao: number;
  versao_meta_plano_acao?: number;
}

export interface LpgDadoBancario {
  id_plano_acao_dado_bancario?: number;
  id_agencia_conta?: string;
  nome_banco_plano_acao_dado_bancario: string;
  numero_agencia_plano_acao_dado_bancario: number | string;
  dv_agencia_plano_acao_dado_bancario?: string;
  numero_conta_plano_acao_dado_bancario: number | string;
  dv_conta_plano_acao_dado_bancario?: string;
  situacao_conta_plano_acao_dado_bancario?: string;
  nome_programa_agil_conta_plano_acao_dado_bancario?: string;
}

export interface LpgPlanoAcao {
  id_plano_acao?: number;
  codigo_plano_acao: string;
  situacao: string;
  valor_total_repasse: number;
  data_inicio_vigencia: string;
  data_fim_vigencia: string;
  diagnostico?: string;
  objetivos?: string;
  ente_recebedor: {
    cnpj: string;
    nome: string;
    uf: string;
    municipio: string;
    fundo_orgao: string;
  };
  orgao_repassador: {
    sigla: string;
    nome: string;
    fundo: string;
  };
  metas: LpgMetaItem[];
  dados_bancarios: LpgDadoBancario[];
  base_legal: string;
  fonte_oficial: string;
  fonte_dado?: 'api_real' | 'fallback_estatico';
}

export interface NewsItem {
  id: string;
  data: string;
  origem: 'Federal (MinC)' | 'Municipal (Viamão)' | 'Estadual (SEDAC-RS)' | 'Controle Social' | 'Ministério Público' | 'Imprensa Regional (RS)' | 'Instituto Federal (IFRS)' | string;
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
  veiculo_imprensa?: string;
  fonte_confiavel?: boolean;
  pesquisa_google?: boolean;
  url_pesquisa_google?: string;
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
