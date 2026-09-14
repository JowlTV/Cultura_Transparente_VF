"""
Serverless Function Vercel: /api/rouanet
Retorna projetos confirmados da Lei Rouanet em Viamão/RS via Versalic / SalicNet.
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.apis import VersalicRouanetApi
from backend.utils import setup_logger, cache

logger = setup_logger("VercelApiRouanet")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            cache_key = "versalic:projetos:Viamao:RS"
            was_cached = cache.has(cache_key)
            api = VersalicRouanetApi()
            projetos = api.buscar_projetos_por_municipio("Viamao", "RS")
            
            response_data = {
                "success": True,
                "total": len(projetos),
                "projetos": [p.to_dict() for p in projetos],
                "cached": was_cached,
                "aviso": "Conforme protocolo anti-alucinação, registros vazios representam ausência de captação ativa homologada no município.",
                "fonte_oficial": "https://versalic.cultura.gov.br/"
            }
            
            payload = json.dumps(response_data, ensure_ascii=False).encode("utf-8")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, s-maxage=7200, stale-while-revalidate=86400")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        except Exception as e:
            logger.error(f"Erro no endpoint /api/rouanet: {e}")
            err_data = json.dumps({"success": False, "error": str(e)}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_data)
