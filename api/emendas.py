"""
Serverless Function Vercel: /api/emendas
Retorna emendas parlamentares destinadas a Viamão/RS em ambas as esferas:
1. Federal: API Portal da Transparência do Governo Federal (CGU / MinC / OGU)
2. Estadual: Portal da Transparência RS (CAGE / SEFAZ-RS / ALRS)

Integração auditada com cache resiliente de 24 horas e classificação por segmento cultural.
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import sys
import os
from typing import List, Dict, Any, Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.apis import CguTransparenciaApi, PortalTransparenciaRsApi
from backend.utils import setup_logger, cache

logger = setup_logger("VercelApiEmendas")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            
            esfera = query_params.get("esfera", ["all"])[0].lower()
            municipio = query_params.get("municipio", ["Viamão"])[0]
            codigo_ibge = query_params.get("ibge", ["4323002"])[0]
            apenas_cultura = query_params.get("apenas_cultura", ["false"])[0].lower() in ("1", "true", "sim")
            
            # Anos fiscais solicitados (opcional, padrão: últimos 3 anos)
            raw_anos = query_params.get("anos", query_params.get("ano", [None]))[0]
            anos_list: Optional[List[int]] = None
            if raw_anos:
                try:
                    parsed = [int(a.strip()) for a in raw_anos.split(",") if a.strip().isdigit()]
                    if parsed:
                        anos_list = parsed
                except Exception:
                    anos_list = None

            anos_tag = ','.join(map(str, sorted(anos_list))) if anos_list else "default_3y"
            cache_key = f"api:emendas:{esfera}:{codigo_ibge}:{anos_tag}:{apenas_cultura}"
            was_cached = cache.has(cache_key)

            emendas_result: List[Dict[str, Any]] = []
            status_fontes: Dict[str, Any] = {}

            # 1. Coleta Federal (CGU)
            if esfera in ("all", "federal"):
                cgu_api = CguTransparenciaApi()
                has_key = bool(cgu_api.api_key)
                if not has_key:
                    status_fontes["federal_cgu"] = {
                        "status": "missing_api_key",
                        "mensagem": "Chave PORTAL_TRANSPARENCIA_API_KEY não configurada. Coleta federal em modo passivo.",
                        "total_capturado": 0
                    }
                else:
                    try:
                        emendas_fed = cgu_api.buscar_emendas(anos=anos_list, codigo_ibge=codigo_ibge)
                        status_fontes["federal_cgu"] = {
                            "status": "online",
                            "mensagem": "Consulta em tempo real à API da CGU realizada com sucesso.",
                            "total_capturado": len(emendas_fed)
                        }
                        for e in emendas_fed:
                            emendas_result.append(e.to_dict())
                    except Exception as e_cgu:
                        logger.warning(f"Erro ao consultar API CGU: {e_cgu}")
                        status_fontes["federal_cgu"] = {
                            "status": "error",
                            "mensagem": f"Falha temporária ao comunicar com a API da CGU: {e_cgu}",
                            "total_capturado": 0
                        }

            # 2. Coleta Estadual (Portal da Transparência RS / CAGE)
            if esfera in ("all", "estadual"):
                try:
                    rs_api = PortalTransparenciaRsApi()
                    emendas_est = rs_api.buscar_emendas_estaduais(municipio=municipio, anos=anos_list)
                    status_fontes["estadual_rs"] = {
                        "status": "online",
                        "mensagem": "Consulta a dados abertos do Portal da Transparência RS (CAGE) realizada com sucesso.",
                        "total_capturado": len(emendas_est)
                    }
                    for e in emendas_est:
                        emendas_result.append(e.to_dict())
                except Exception as e_rs:
                    logger.warning(f"Erro ao consultar Portal RS: {e_rs}")
                    status_fontes["estadual_rs"] = {
                        "status": "error",
                        "mensagem": f"Falha temporária ao comunicar com o Portal RS: {e_rs}",
                        "total_capturado": 0
                    }

            # Filtro opcional por cultura
            if apenas_cultura:
                emendas_result = [e for e in emendas_result if e.get("is_cultura")]

            # Estatísticas agregadas
            total_cultura = sum(1 for e in emendas_result if e.get("is_cultura"))
            valor_total = sum(float(e.get("valor") or 0.0) for e in emendas_result)
            valor_total_cultura = sum(float(e.get("valor") or 0.0) for e in emendas_result if e.get("is_cultura"))

            response_data = {
                "success": True,
                "municipio": municipio,
                "uf": "RS",
                "codigo_ibge": codigo_ibge,
                "esfera_solicitada": esfera,
                "anos_consultados": anos_list,
                "cached": was_cached,
                "total_emendas": len(emendas_result),
                "total_cultura": total_cultura,
                "valor_total": valor_total,
                "valor_total_cultura": valor_total_cultura,
                "emendas": emendas_result,
                "status_fontes": status_fontes,
                "politica_auditoria": "Dados oficiais agregados do Portal da Transparência CGU e Portal RS CAGE."
            }

            payload = json.dumps(response_data, ensure_ascii=False).encode("utf-8")

            # Armazena em cache TTL de 24 horas (86400 segundos)
            cache.set(cache_key, response_data, ttl_seconds=86400)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=86400")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        except Exception as e:
            logger.error(f"Erro no endpoint /api/emendas: {e}")
            err_data = json.dumps({
                "success": False,
                "error": str(e),
                "fonte": "CGU / Portal Transparência RS"
            }, ensure_ascii=False).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(err_data)))
            self.end_headers()
            self.wfile.write(err_data)
