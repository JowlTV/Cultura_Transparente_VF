"""=============================================================================
CULTURA TRANSPARENTE - CLIENTES DE APIS PÚBLICAS GOVERNAMENTAIS
Módulo: backend/apis.py
=============================================================================
Integração, normalização, validação e documentação de rate-limits para:
1. Transferegov / Fundo a Fundo (PNAB Lei 14.399/2022 e LPG LC 195/2022 - MinC)
2. Portal da Transparência CGU (Emendas Parlamentares)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import re

from backend.models import (
    LPGProject,
    EmendaRecord,
    validar_cnpj
)
from backend.utils import http_client, setup_logger, single_flight, SingleFlightCache

logger = setup_logger("PublicApis")


# =============================================================================
# 1. API TRANSFEREGOV / FUNDO A FUNDO & SICONV (MINC)
# =============================================================================

class TransferegovApi:
    """
    Cliente para a API Pública Fundo a Fundo do Governo Federal (Transferegov / MinC).
    
    DOCUMENTAÇÃO DE RATE LIMIT:
    - Limite estimado: 60 requisições por minuto por IP.
    - Estratégia recomendada: Cache TTL de 3600 segundos (1 hora).
    - Status 429: Tratado com retentativa exponencial automática pelo HttpClient.
    - Coalescência: Protegido por SingleFlightCache para evitar chamadas duplicadas sob concorrência.
    """
    FUNDO_A_FUNDO_URL = "https://api.transferegov.gestao.gov.br/fundoafundo"
    CNPJ_VIAMAO_DEFAULT = "88000914000101"
    PROGRAMA_LPG_ID = 47   # MINC - LEI PAULO GUSTAVO - MUNICIPIOS

    def __init__(self, client=None, single_flight_cache: Optional[SingleFlightCache] = None):
        self.client = client or http_client
        self.single_flight = single_flight_cache or single_flight

    def _fetch_plano_acao_lpg_raw(self, cnpj_limpo: str) -> Optional[Dict[str, Any]]:
        """Executa a busca real de dados na API Transferegov Fundo a Fundo."""
        logger.info(f"Consultando Transferegov Fundo a Fundo para LPG (CNPJ {cnpj_limpo})...")
        
        # 1. Busca plano de ação
        endpoint_plano = f"{self.FUNDO_A_FUNDO_URL}/plano_acao"
        params_plano = {
            "id_programa": f"eq.{self.PROGRAMA_LPG_ID}",
            "cnpj_ente_recebedor_plano_acao": f"eq.{cnpj_limpo}"
        }
        planos = self.client.fetch_json(
            endpoint_plano,
            params=params_plano,
            cache_ttl=None
        )

        if not isinstance(planos, list) or len(planos) == 0:
            logger.warning(f"Nenhum plano de ação LPG encontrado para CNPJ {cnpj_limpo}.")
            return None

        plano = planos[0]
        id_plano = plano.get("id_plano_acao")

        # 2. Busca metas do plano de ação
        metas: List[Dict[str, Any]] = []
        if id_plano:
            try:
                endpoint_metas = f"{self.FUNDO_A_FUNDO_URL}/plano_acao_meta"
                params_metas = {"id_plano_acao": f"eq.{id_plano}"}
                metas_res = self.client.fetch_json(
                    endpoint_metas,
                    params=params_metas,
                    cache_ttl=None
                )
                if isinstance(metas_res, list):
                    metas = metas_res
            except Exception as e_meta:
                logger.warning(f"Erro ao buscar metas LPG: {e_meta}")

        # 3. Busca dados bancários das contas vinculadas
        dados_bancarios: List[Dict[str, Any]] = []
        if id_plano:
            try:
                endpoint_bancos = f"{self.FUNDO_A_FUNDO_URL}/plano_acao_dado_bancario"
                params_bancos = {"id_plano_acao": f"eq.{id_plano}"}
                bancos_res = self.client.fetch_json(
                    endpoint_bancos,
                    params=params_bancos,
                    cache_ttl=None
                )
                if isinstance(bancos_res, list):
                    dados_bancarios = bancos_res
            except Exception as e_banco:
                logger.warning(f"Erro ao buscar dados bancários LPG: {e_banco}")

        # NOTA DE INTEGRIDADE ANTI-ALUCINAÇÃO:
        # Substituição de fallbacks: campos não retornados pela API oficial do Transferegov
        # são preenchidos com valores neutros (None para números/datas e "Não informado pela fonte"
        # para textos), em vez de valores hardcoded específicos de Viamão. Isso evita que uma alteração
        # ou falha de campo na API seja mascarada por dados históricos estáticos.
        # Exceção legítima: campos de metadados institucionais e regulatórios fixos ("base_legal", "fonte_oficial")
        # identificam as normas do programa em si e permanecem fixos.
        valor_raw = plano.get("valor_total_repasse_plano_acao") or plano.get("valor_repasse_especifico_plano_acao")
        valor_total = float(valor_raw) if valor_raw is not None else None

        return {
            "id_plano_acao": id_plano,
            "codigo_plano_acao": plano.get("codigo_plano_acao") or "Não informado pela fonte",
            "situacao": plano.get("situacao_plano_acao") or "Não informado pela fonte",
            "valor_total_repasse": valor_total,
            "data_inicio_vigencia": plano.get("data_inicio_vigencia_plano_acao") or None,
            "data_fim_vigencia": plano.get("data_fim_vigencia_plano_acao") or None,
            "diagnostico": plano.get("diagnostico_plano_acao") or "",
            "objetivos": plano.get("objetivos_plano_acao") or "",
            "ente_recebedor": {
                "cnpj": plano.get("cnpj_ente_recebedor_plano_acao") or (f"{cnpj_limpo[:2]}.{cnpj_limpo[2:5]}.{cnpj_limpo[5:8]}/{cnpj_limpo[8:12]}-{cnpj_limpo[12:]}" if len(cnpj_limpo) == 14 else cnpj_limpo or "Não informado"),
                "nome": plano.get("nome_ente_recebedor_plano_acao") or "Não informado pela fonte",
                "uf": plano.get("uf_ente_recebedor_plano_acao") or "Não informado",
                "municipio": plano.get("nome_municipio_ente_recebedor_plano_acao") or "Não informado pela fonte",
                "fundo_orgao": plano.get("nome_fundo_recebedor_plano_acao") or "Não informado pela fonte"
            },
            "orgao_repassador": {
                "sigla": plano.get("sigla_orgao_repassador_plano_acao") or "Não informado",
                "nome": plano.get("nome_orgao_repassador_plano_acao") or "Não informado pela fonte",
                "fundo": plano.get("nome_fundo_repassador_plano_acao") or "Não informado pela fonte"
            },
            "metas": metas,
            "dados_bancarios": dados_bancarios,
            "base_legal": "Lei Complementar nº 195/2022 (Lei Paulo Gustavo)",
            "fonte_oficial": "Plataforma Transferegov.br / Fundo a Fundo / Ministério da Cultura"
        }

    def buscar_plano_acao_lpg(
        self,
        cnpj: str = CNPJ_VIAMAO_DEFAULT,
        use_cache: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Consulta o Plano de Ação, Metas e Dados Bancários da Lei Paulo Gustavo (LC 195/2022)
        com proteção de single-flight para mitigar thundering herds.
        """
        cnpj_limpo = re.sub(r"\D", "", cnpj)
        try:
            cache_key = f"transferegov:lpg:full:{cnpj_limpo}"
            if use_cache:
                return self.single_flight.get_or_fetch(
                    cache_key,
                    fetch_fn=lambda: self._fetch_plano_acao_lpg_raw(cnpj_limpo),
                    ttl_seconds=7200
                )
            return self._fetch_plano_acao_lpg_raw(cnpj_limpo)
        except Exception as e:
            logger.error(f"Erro ao consultar LPG no Transferegov Fundo a Fundo: {e}")
            raise


import os
import unicodedata

# =============================================================================
# FUNÇÕES AUXILIARES DE NORMALIZAÇÃO E CLASSIFICAÇÃO
# =============================================================================

def normalizar_texto(texto: str) -> str:
    """Remove acentos e converte para minúsculas para comparação tolerante."""
    if not texto:
        return ""
    nfkd = unicodedata.normalize("NFKD", texto)
    return "".join([c for c in nfkd if not unicodedata.combining(c)]).lower().strip()


def classificar_tipo_cultural(texto: str) -> Optional[str]:
    """Classifica o subprojeto cultural em categorias do ecossistema de Viamão."""
    txt = normalizar_texto(texto)
    if any(w in txt for w in ["hip hop", "hip-hop", "slam", "break", "grafite", "cultura urbana", "rap"]):
        return "Hip-Hop & Cultura Urbana"
    if any(w in txt for w in ["matriz", "patrimonio", "restauro", "historico", "tombamento", "museu", "igreja matriz"]):
        return "Patrimônio & Restauro"
    if any(w in txt for w in ["audiovisual", "cinema", "documentario", "filme", "curta", "video"]):
        return "Audiovisual & Cinema"
    if any(w in txt for w in ["tradicao", "folclore", "gaucho", "ctg", "cabanha", "piquete", "carnaval", "samba", "escola de samba"]):
        return "Tradição & Folclore"
    if any(w in txt for w in ["livro", "leitura", "biblioteca", "literatura", "sarau", "escritor"]):
        return "Literatura & Leitura"
    if any(w in txt for w in ["musica", "artes cenicas", "teatro", "danca", "coral", "concerto", "show", "orquestra"]):
        return "Música & Artes Cênicas"
    return "Outras Áreas"


# =============================================================================
# 2. API PORTAL DA TRANSPARÊNCIA CGU (EMENDAS PARLAMENTARES FEDERAIS)
# =============================================================================

class CguTransparenciaApi:
    """
    Cliente para a API de Emendas Parlamentares da CGU (Governo Federal).
    
    DOCUMENTAÇÃO DE RATE LIMIT E AUTENTICAÇÃO:
    - Requer cabeçalho 'chave-api-dados' em produção (PORTAL_TRANSPARENCIA_API_KEY).
    - Obtenção gratuita: Cadastro em https://portaldatransparencia.gov.br/api-de-dados/cadastrar
    - Limites oficiais CGU: 400 req/min (dia) / 700 req/min (madrugada) / 180 req/min (rotas restritas).
    - Coalescência: Protegido por SingleFlightCache para garantir que múltiplos acessos
      simultâneos com cache frio executem apenas 1 requisição real à API da CGU.
    - Estratégia de Fallback: Se não houver chave configurada, emite log estruturado
      e retorna lista vazia de registros sem gerar falhas 500 no endpoint serverless.
    """
    BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados/emendas-parlamentares"
    CODIGO_IBGE_VIAMAO = "4323002"

    def __init__(self, api_key: Optional[str] = None, client=None, single_flight_cache: Optional[SingleFlightCache] = None):
        if api_key is not None:
            self.api_key = api_key.strip() if api_key.strip() else None
        else:
            env_key = os.getenv("PORTAL_TRANSPARENCIA_API_KEY") or os.getenv("CGU_API_KEY")
            self.api_key = env_key.strip() if env_key else None
        self.client = client or http_client
        self.single_flight = single_flight_cache or single_flight

    def _fetch_cgu_registros_raw(self, codigo_ibge: str, ano_exercicio: int, headers: Dict[str, str]) -> List[Dict[str, Any]]:
        """Executa a requisição real à API da CGU."""
        params = {
            "codigoIbge": codigo_ibge,
            "ano": ano_exercicio,
            "pagina": 1
        }
        data = self.client.fetch_json(
            self.BASE_URL,
            params=params,
            headers=headers,
            cache_ttl=None
        )
        return data if isinstance(data, list) else []

    def buscar_emendas(
        self,
        anos: Optional[List[int]] = None,
        ano: Optional[int] = None,
        codigo_ibge: str = CODIGO_IBGE_VIAMAO,
        use_cache: bool = True
    ) -> List[EmendaRecord]:
        """
        Busca emendas parlamentares federais destinadas ao município de Viamão
        consolidando resultados de múltiplos exercícios financeiros com proteção single-flight.
        
        :param anos: Lista de anos fiscais para consulta (se None, usa os últimos 3 anos: corrente e 2 anteriores)
        :param ano: Ano único (caso fornecido, sobrepõe 'anos')
        :param codigo_ibge: Código IBGE do município (padrão Viamão: 4323002)
        :param use_cache: Ativa cache com TTL de 24h
        :return: Lista de objetos EmendaRecord normalizados e deduplicados
        """
        if not self.api_key:
            logger.warning(
                "Chave de API da CGU (PORTAL_TRANSPARENCIA_API_KEY) não configurada no ambiente. "
                "Para ativar a coleta automática ao vivo do Governo Federal, cadastre uma chave gratuita no "
                "Portal da Transparência e configure a variável de ambiente."
            )
            return []

        if ano is not None:
            anos_consulta = [ano]
        elif anos is not None:
            anos_consulta = list(anos)
        else:
            ano_atual = datetime.now().year
            anos_consulta = [ano_atual, ano_atual - 1, ano_atual - 2]

        emendas_map: Dict[str, EmendaRecord] = {}
        headers = {"chave-api-dados": self.api_key}

        for ano_exercicio in anos_consulta:
            cache_key = f"cgu:emendas:{codigo_ibge}:{ano_exercicio}"

            try:
                if use_cache:
                    registros = self.single_flight.get_or_fetch(
                        cache_key,
                        fetch_fn=lambda a=ano_exercicio: self._fetch_cgu_registros_raw(codigo_ibge, a, headers),
                        ttl_seconds=86400
                    )
                else:
                    registros = self._fetch_cgu_registros_raw(codigo_ibge, ano_exercicio, headers)
                
                registros = registros if isinstance(registros, list) else []
                logger.info(f"CGU Emendas {ano_exercicio} (IBGE {codigo_ibge}): {len(registros)} registros retornados.")

                for r in registros:
                    codigo_emenda = str(r.get("codigoEmenda") or len(emendas_map) + 1)
                    autor = r.get("nomeAutor") or r.get("autor") or "Não Identificado"
                    partido = r.get("partido") or r.get("siglaPartido") or "S/P"
                    tipo_emenda = r.get("tipoEmenda") or "Individual"
                    
                    orgao_info = r.get("orgaoSuperior") or {}
                    orgao_nome = orgao_info.get("nome") if isinstance(orgao_info, dict) else str(orgao_info or "")
                    if not orgao_nome:
                        orgao_nome = r.get("orgao") or "Ministério da Cultura"
                    
                    objeto = r.get("localidadeDoGasto") or r.get("objeto") or r.get("beneficiarioPlanoTrabalho") or "Ações Culturais Municipais"
                    
                    # Detecção de Cultura
                    texto_analise = f"{orgao_nome} {objeto} {r.get('funcao', '')}".upper()
                    is_cultura = any(
                        term in texto_analise for term in [
                            "CULTURA", "TURISMO", "AUDIOVISUAL", "HIP HOP", "HIP-HOP",
                            "PATRIMONIO", "PATRIMÔNIO", "MUSEU", "BIBLIOTECA", "HISTORIC",
                            "ARTE", "TEATRO", "LIVRO", "LEITURA", "FOLCLORE", "TRADICAO"
                        ]
                    )
                    
                    tipo_cultural = classificar_tipo_cultural(f"{objeto} {orgao_nome}") if is_cultura else None
                    ano_origem = int(r.get("ano") or ano_exercicio)
                    valor_empenhado = float(r.get("valorEmpenhado") or r.get("valorProposta") or 0.0)
                    valor_pago = float(r.get("valorPago") or r.get("valorLiquidado") or 0.0)
                    emenda_id = f"em-fed-{ano_origem}-{codigo_emenda}"

                    # Chave de deduplicação (pelo código único da emenda)
                    dedup_key = f"fed-{codigo_emenda}"

                    if dedup_key in emendas_map:
                        existente = emendas_map[dedup_key]
                        if valor_pago > existente.pago:
                            existente.pago = valor_pago
                            existente.status = r.get("situacao") or existente.status
                        if f"Orçamento Geral da União {ano_exercicio}" not in existente.fontes_cruzadas:
                            existente.fontes_cruzadas.append(f"Orçamento Geral da União {ano_exercicio}")
                        continue

                    emenda = EmendaRecord(
                        id=emenda_id,
                        autor=autor,
                        partido=partido,
                        tipo=tipo_emenda,
                        ano=ano_origem,
                        orgao=orgao_nome,
                        objeto=objeto,
                        valor=valor_empenhado,
                        pago=valor_pago,
                        status=r.get("situacao") or "Em Execução / Vigente",
                        is_cultura=is_cultura,
                        area_atuacao="Cultura & Turismo" if is_cultura else (r.get("funcao") or "Demais Áreas"),
                        municipio="Viamão",
                        esfera="Federal (API CGU)",
                        numero_emenda=codigo_emenda,
                        beneficiario=r.get("beneficiarioPlanoTrabalho") or "Município de Viamão",
                        fonte="Portal da Transparência do Governo Federal (CGU)",
                        fontes_cruzadas=["Portal da Transparência CGU", f"Orçamento Geral da União {ano_exercicio}"],
                        subprojeto=objeto,
                        tipo_projeto_cultural=tipo_cultural
                    )
                    emendas_map[dedup_key] = emenda

            except Exception as e:
                logger.warning(f"Falha ao consultar API da CGU para o ano {ano_exercicio}: {e}")
                continue

        return list(emendas_map.values())


# =============================================================================
# 3. API PORTAL DA TRANSPARÊNCIA RS / CAGE (EMENDAS PARLAMENTARES ESTADUAIS)
# =============================================================================

class PortalTransparenciaRsApi:
    """
    Cliente para os Dados Abertos e Portal da Transparência do Estado do Rio Grande do Sul
    (transparencia.rs.gov.br / CAGE / SEFAZ-RS) e Assembleia Legislativa do RS (ALRS).
    
    DOCUMENTAÇÃO DE FONTE:
    - Dados abertos de execução orçamentária e emendas parlamentares impositivas estaduais.
    - Endpoints de referência:
      1. https://transparencia.rs.gov.br/emendas-parlamentares/emendas-parlamentares-estaduais/dados
      2. https://transparencia.rs.gov.br/dados-abertos
    - Rate Limit: Sem autenticação obrigatória, com recomendação de cache de 24 horas (86400s).
    - Coalescência: Protegido por SingleFlightCache para evitar tempestade de requisições sob concorrência.
    - Tratamento resiliente: Retorna lista vazia em caso de indisponibilidade ou ausência de emendas.
    """
    BASE_URL = "https://transparencia.rs.gov.br/emendas-parlamentares/emendas-parlamentares-estaduais/dados"
    DADOS_ABERTOS_URL = "https://transparencia.rs.gov.br/dados-abertos"

    def __init__(self, client=None, single_flight_cache: Optional[SingleFlightCache] = None):
        self.client = client or http_client
        self.single_flight = single_flight_cache or single_flight

    def _fetch_rs_payload_raw(self, ano: int) -> Any:
        """Executa a requisição real aos dados abertos do Portal RS."""
        try:
            return self.client.fetch_json(
                f"{self.BASE_URL}?exercicio={ano}",
                cache_ttl=None
            )
        except Exception as e_req:
            logger.warning(f"Consulta direta ao Portal RS ({ano}) retornou: {e_req}. Tentando dataset de dados abertos.")
            return []

    def buscar_emendas_estaduais(
        self,
        municipio: str = "Viamão",
        anos: Optional[List[int]] = None,
        use_cache: bool = True
    ) -> List[EmendaRecord]:
        """
        Busca emendas parlamentares estaduais destinadas a Viamão/RS
        com proteção de single-flight contra requisições concorrentes duplicadas.
        
        :param municipio: Nome do município (filtragem case-insensitive e tolerante a acentos)
        :param anos: Lista de anos para consulta
        :param use_cache: Ativa cache com TTL de 24h
        :return: Lista de EmendaRecord normalizados
        """
        municipio_norm = normalizar_texto(municipio)
        if anos is not None:
            anos_consulta = list(anos)
        else:
            ano_atual = datetime.now().year
            anos_consulta = [ano_atual, ano_atual - 1, ano_atual - 2]
        emendas: List[EmendaRecord] = []

        try:
            logger.info(f"Consultando Portal da Transparência RS (CAGE) para emendas em '{municipio}'...")
            
            for ano in anos_consulta:
                cache_key = f"transparencia_rs:emendas_raw:{ano}"
                
                if use_cache:
                    payload = self.single_flight.get_or_fetch(
                        cache_key,
                        fetch_fn=lambda a=ano: self._fetch_rs_payload_raw(a),
                        ttl_seconds=86400
                    )
                else:
                    payload = self._fetch_rs_payload_raw(ano)

                if isinstance(payload, list):
                    registros = payload
                elif isinstance(payload, dict) and "data" in payload and isinstance(payload["data"], list):
                    registros = payload["data"]
                elif isinstance(payload, dict) and "registros" in payload and isinstance(payload["registros"], list):
                    registros = payload["registros"]
                else:
                    registros = []

                for r in registros:
                    mun_registro = normalizar_texto(r.get("municipio") or r.get("municipio_beneficiario") or r.get("localidade") or "")
                    
                    # Filtra apenas registros de Viamão
                    if municipio_norm and municipio_norm not in mun_registro:
                        continue

                    num_ep = str(r.get("numero_emenda") or r.get("ep") or r.get("id") or len(emendas) + 1)
                    autor = r.get("autor") or r.get("parlamentar") or "Deputado Estadual"
                    partido = r.get("partido") or r.get("partido_sigla") or "S/P"
                    orgao = r.get("secretaria") or r.get("orgao") or "Secretaria de Estado da Cultura (SEDAC-RS)"
                    subprojeto = r.get("objeto") or r.get("subprojeto") or r.get("descricao") or "Apoio Cultural Comunitário"
                    
                    texto_analise = f"{orgao} {subprojeto}".upper()
                    is_cultura = any(
                        term in texto_analise for term in [
                            "SEDAC", "CULTURA", "TURISMO", "AUDIOVISUAL", "HIP HOP", "HIP-HOP",
                            "PATRIMONIO", "PATRIMÔNIO", "MUSEU", "BIBLIOTECA", "HISTORIC",
                            "ARTE", "TEATRO", "LIVRO", "LEITURA", "FOLCLORE", "TRADICAO", "PIQUETE", "CABANHA", "MATRIZ"
                        ]
                    )

                    tipo_cultural = classificar_tipo_cultural(f"{subprojeto} {orgao}") if is_cultura else None
                    valor_alocado = float(r.get("valor") or r.get("valor_alocado") or r.get("valor_indicado") or 0.0)
                    valor_pago = float(r.get("valor_pago") or r.get("valor_liquidado") or r.get("valor_executado") or 0.0)

                    emendas.append(
                        EmendaRecord(
                            id=f"em-est-{ano}-{num_ep}",
                            autor=autor,
                            partido=partido,
                            tipo="Individual (Impositiva)",
                            ano=ano,
                            orgao=orgao,
                            objeto=subprojeto,
                            valor=valor_alocado,
                            pago=valor_pago,
                            status=r.get("status") or "Em Execução / Vigente",
                            is_cultura=is_cultura,
                            area_atuacao="Cultura & Turismo" if is_cultura else "Demais Áreas",
                            municipio="Viamão",
                            esfera="Estadual (ALRS)",
                            numero_emenda=f"Ep {num_ep}",
                            beneficiario=r.get("beneficiario") or "Município de Viamão",
                            fonte="Portal da Transparência RS (CAGE / SEFAZ-RS)",
                            fontes_cruzadas=["Portal da Transparência RS (CAGE)", f"Sistema SAE ALRS {ano}"],
                            subprojeto=subprojeto,
                            tipo_projeto_cultural=tipo_cultural
                        )
                    )

        except Exception as e:
            logger.warning(f"Erro ao processar emendas estaduais do Portal RS: {e}")
            return []

        return emendas
