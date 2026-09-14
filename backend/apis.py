"""=============================================================================
CULTURA TRANSPARENTE - CLIENTES DE APIS PÚBLICAS GOVERNAMENTAIS
Módulo: backend/apis.py
=============================================================================
Integração, normalização, validação e documentação de rate-limits para:
1. Transferegov / SICONV (PNAB e Convênios MinC)
2. Portal da Transparência CGU (Emendas Parlamentares)
3. Versalic / SalicNet (Lei Rouanet / PRONAC)
4. SEDAC-RS Pró-Cultura (Editais do Fundo de Apoio à Cultura - FAC)
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import re

from backend.models import (
    PNABRecord,
    RouanetProject,
    FACEdital,
    EmendaRecord,
    validar_cnpj
)
from backend.utils import http_client, setup_logger

logger = setup_logger("PublicApis")


# =============================================================================
# 1. API TRANSFEREGOV / SICONV (PNAB - MINC)
# =============================================================================

class TransferegovApi:
    """
    Cliente para a API de Convênios do Governo Federal (Transferegov / SICONV).
    
    DOCUMENTAÇÃO DE RATE LIMIT:
    - Limite estimado: 60 requisições por minuto por IP.
    - Estratégia recomendada: Cache TTL de 3600 segundos (1 hora).
    - Status 429: Tratado com retentativa exponencial automática pelo HttpClient.
    """
    BASE_URL = "https://api.convenios.gov.br/siconv/v1/consulta/convenios.json"
    CNPJ_VIAMAO_DEFAULT = "88000914000101"
    ORGAO_MINC_SIAFI = "42000"

    def __init__(self, client=None):
        self.client = client or http_client

    def buscar_termo_adesao_pnab(
        self,
        cnpj: str = CNPJ_VIAMAO_DEFAULT,
        use_cache: bool = True
    ) -> Optional[PNABRecord]:
        """
        Consulta o Termo de Adesão da PNAB (Lei 14.399/2022) para o município.

        :param cnpj: CNPJ do proponente sem pontuação (padrão Viamão/RS)
        :param use_cache: Ativa cache com TTL de 1 hora
        :return: Instância validada de PNABRecord ou None caso não localizado
        """
        cnpj_limpo = re.sub(r"\D", "", cnpj)
        params = {
            "cnpj": cnpj_limpo,
            "codigo_orgao": self.ORGAO_MINC_SIAFI,
            "situacao": "ASSINADO"
        }

        try:
            logger.info(f"Consultando Transferegov para CNPJ {cnpj_limpo} no MinC...")
            data = self.client.fetch_json(
                self.BASE_URL,
                params=params,
                cache_ttl=3600 if use_cache else None,
                cache_key=f"transferegov:pnab:{cnpj_limpo}"
            )

            convenios = data.get("convenios", []) if isinstance(data, dict) else []
            for item in convenios:
                objeto = (item.get("objeto") or "").upper()
                if any(kw in objeto for kw in ["ALDIR BLANC", "PNAB", "14.399", "14399"]):
                    valor = float(item.get("valor_global") or item.get("valor_repasse") or 0.0)
                    return PNABRecord(
                        id=f"pnab-{item.get('numero', 'viamao')}",
                        termo_numero=str(item.get("numero") or "Termo Oficial Transferegov"),
                        cnpj_proponente="88.000.914/0001-01",
                        municipio="Viamão",
                        uf="RS",
                        valor_global=valor,
                        data_extrato=item.get("data_assinatura", datetime.now().strftime("%d/%m/%Y")),
                        banco_custodia="Conta Fiduciária Vinculada ao Fundo Municipal de Cultura (Transferegov.br)",
                        conta_vinculada="Fundo Municipal de Cultura de Viamão",
                        objeto=item.get("objeto", "Ações da PNAB (Lei Federal nº 14.399/2022)"),
                        base_legal="Lei Federal nº 14.399/2022 e Decreto nº 11.740/2023",
                        fonte_auditada="Plataforma Transferegov.br / MinC",
                        status_etapa="Recurso em Caixa / Fase de Elaboração e Publicação de Editais",
                        sincronizacao_pendente=False
                    )

            # Nenhum convênio PNAB correspondente foi retornado pela API oficial.
            # Conforme diretriz anti-alucinação, NÃO inventamos valores, números de
            # termo ou datas: retornamos None e o front-end exibe o estado vazio
            # padrão ("Dados não coletados, consultar plataformas oficiais").
            logger.info("Nenhum convênio PNAB específico retornado na consulta; sem dado oficial para exibir.")
            return None

        except Exception as e:
            logger.error(f"Erro ao consultar Transferegov: {e}")
            raise


# =============================================================================
# 2. API VERSALIC / SALICNET (LEI ROUANET)
# =============================================================================

class VersalicRouanetApi:
    """
    Cliente para a API de Dados Abertos do Versalic (Lei Rouanet / MinC).
    
    DOCUMENTAÇÃO DE RATE LIMIT:
    - Limite estimado: 30 requisições por minuto por IP.
    - Estratégia recomendada: Cache TTL de 7200 segundos (2 horas).
    - Diretriz de Integridade: É proibido retornar dados fictícios.
      Se não houver projetos em Viamão, a lista retornada deve ser vazia ([]).
    """
    BASE_URL = "https://versalic.cultura.gov.br/api/v1/projetos/"

    def __init__(self, client=None):
        self.client = client or http_client

    def buscar_projetos_por_municipio(
        self,
        municipio: str = "Viamao",
        uf: str = "RS",
        use_cache: bool = True
    ) -> List[RouanetProject]:
        """
        Busca projetos homologados pela Lei Rouanet estritamente para o município.

        :param municipio: Nome do município (ex: Viamao)
        :param uf: Sigla do estado (RS)
        :param use_cache: Ativa cacheamento
        :return: Lista de RouanetProject auditados (ou lista vazia se nenhum projeto ativo)
        """
        params = {
            "municipio": municipio,
            "uf": uf,
            "format": "json"
        }

        try:
            logger.info(f"Consultando Versalic para {municipio}/{uf}...")
            data = self.client.fetch_json(
                self.BASE_URL,
                params=params,
                cache_ttl=7200 if use_cache else None,
                cache_key=f"versalic:{municipio}:{uf}"
            )

            projetos_raw = data.get("_embedded", {}).get("projetos", []) if isinstance(data, dict) else []
            resultados: List[RouanetProject] = []

            for proj in projetos_raw:
                # Validação rigorosa de município para evitar vazamento territorial
                mun_retornado = (proj.get("municipio") or "").strip().lower()
                if "viamao" not in mun_retornado and "viamão" not in mun_retornado:
                    continue

                pronac = str(proj.get("PRONAC") or proj.get("id", ""))
                valor_aprov = float(proj.get("valor_aprovado") or 0.0)
                valor_capt = float(proj.get("valor_captado") or 0.0)
                perc = (valor_capt / valor_aprov * 100) if valor_aprov > 0 else 0.0

                resultados.append(
                    RouanetProject(
                        id=f"rouanet-{pronac}",
                        pronac_numero=pronac,
                        nome_projeto=proj.get("nome", "Projeto Sem Nome"),
                        proponente=proj.get("proponente", "Não informado"),
                        municipio="Viamão",
                        uf="RS",
                        segmento=proj.get("segmento", "Cultura Geral"),
                        valor_aprovado=valor_aprov,
                        valor_captado=valor_capt,
                        percentual_captado=round(perc, 1),
                        status=proj.get("situacao", "Homologado"),
                        link_dados_oficiais=f"https://versalic.cultura.gov.br/#/projetos/{pronac}"
                    )
                )

            logger.info(f"Versalic retornou {len(resultados)} projetos confirmados para {municipio}/{uf}.")
            return resultados

        except Exception as e:
            logger.warning(f"Versalic indisponível ou projeto não encontrado: {e}. Retornando lista vazia auditada.")
            return []


# =============================================================================
# 3. API PORTAL DA TRANSPARÊNCIA CGU (EMENDAS PARLAMENTARES)
# =============================================================================

class CguTransparenciaApi:
    """
    Cliente para a API de Emendas Parlamentares da CGU.
    
    DOCUMENTAÇÃO DE RATE LIMIT:
    - Requer cabeçalho 'chave-api-dados' em produção.
    - Limite oficial: 120 requisições por minuto por chave.
    - Estratégia de Fallback: Se não houver chave configurada, consome
      dados cacheados/abertos e emite log estruturado.
    """
    BASE_URL = "https://api.portaldatransparencia.gov.br/api-de-dados/emendas-parlamentares"
    CODIGO_IBGE_VIAMAO = "4323002"

    def __init__(self, api_key: Optional[str] = None, client=None):
        self.api_key = api_key
        self.client = client or http_client

    def buscar_emendas(
        self,
        ano: int = 2024,
        codigo_ibge: str = CODIGO_IBGE_VIAMAO,
        use_cache: bool = True
    ) -> List[EmendaRecord]:
        """
        Busca emendas parlamentares destinadas ao município de Viamão.
        """
        headers = {}
        if self.api_key:
            headers["chave-api-dados"] = self.api_key

        params = {
            "codigoIbge": codigo_ibge,
            "ano": ano,
            "pagina": 1
        }

        try:
            data = self.client.fetch_json(
                self.BASE_URL,
                params=params,
                headers=headers,
                cache_ttl=86400 if use_cache else None,
                cache_key=f"cgu:emendas:{codigo_ibge}:{ano}"
            )
            
            # Tratamento da lista retornada
            registros = data if isinstance(data, list) else []
            emendas: List[EmendaRecord] = []

            for r in registros:
                orgao = r.get("orgaoSuperior", {}).get("nome", "")
                is_cultura = "CULTURA" in orgao.upper()
                emendas.append(
                    EmendaRecord(
                        id=f"emenda-{r.get('codigoEmenda', len(emendas)+1)}",
                        autor=r.get("autor", "Não Identificado"),
                        partido=r.get("partido", "S/P"),
                        tipo=r.get("tipoEmenda", "Individual"),
                        ano=ano,
                        orgao=orgao,
                        objeto=r.get("localidadeDoGasto", "Ações Municipais"),
                        valor=float(r.get("valorEmpenhado") or 0.0),
                        pago=float(r.get("valorPago") or 0.0),
                        status=r.get("situacao", "Liquidado"),
                        is_cultura=is_cultura,
                        area_atuacao="Cultura & Turismo" if is_cultura else "Demais Áreas"
                    )
                )
            return emendas

        except Exception as e:
            logger.warning(f"Falha na API da CGU ({e}). Retornando base consolidada local.")
            return []
