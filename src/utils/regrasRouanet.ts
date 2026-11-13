/**
 * Regras verificáveis da Lei Rouanet para uso no frontend (exportações .docx / Google Drive).
 *
 * Fonte única: backend/conhecimento/regras_rouanet.json — o mesmo catálogo usado pelo
 * motor de regras do backend, cujas citações literais são conferidas contra o texto da
 * IN MinC nº 29/2026 (backend/regras_rouanet.py::verificar_integridade_citacoes_literais).
 * Não escreva artigos ou citações à mão aqui: altere o JSON.
 */
import regras from '../../backend/conhecimento/regras_rouanet.json';

export interface RegraRouanet {
  identificador: string;
  descricao: string;
  referencia: string;
  citacao_literal: string;
}

const CATALOGO = regras as RegraRouanet[];

export function obterRegraRouanet(identificador: string): RegraRouanet | undefined {
  return CATALOGO.find(r => r.identificador === identificador);
}

/** Regras gerais listadas no documento quando não há conferência orçamentária calculada. */
const IDS_REGRAS_GERAIS: Array<{ id: string; rotulo: string }> = [
  { id: 'limite_custos_administracao', rotulo: 'Custos de administração' },
  { id: 'limite_remuneracao_captacao_recursos', rotulo: 'Remuneração para captação de recursos' },
  { id: 'limite_cache_artista_individual', rotulo: 'Cachê de artista individual' },
  { id: 'limite_cache_grupo_coletivo', rotulo: 'Cachê de grupo ou coletivo' },
  { id: 'distribuicao_gratuita_carater_social_educativo', rotulo: 'Distribuição gratuita social ou educativa' },
  { id: 'comercializacao_ingressos_populares', rotulo: 'Ingressos a preços populares' },
];

export const REGRAS_GERAIS_ROUANET = IDS_REGRAS_GERAIS.flatMap(({ id, rotulo }) => {
  const regra = obterRegraRouanet(id);
  return regra
    ? [{ desc: rotulo, ref: `${regra.referencia} da IN MinC nº 29/2026`, cit: regra.citacao_literal }]
    : [];
});
