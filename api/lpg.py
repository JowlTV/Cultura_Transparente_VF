"""
Serverless Function Vercel: /api/lpg
Retorna dados oficiais do Plano de Ação e Metas da Lei Paulo Gustavo (LC nº 195/2022)
em Viamão/RS via API pública Transferegov Fundo a Fundo (MinC).
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.apis import TransferegovApi
from backend.utils import setup_logger, cache

logger = setup_logger("VercelApiLPG")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            cnpj = query_params.get("cnpj", ["88000914000101"])[0]

            cache_key = f"transferegov_lpg:{cnpj}"
            was_cached = cache.has(cache_key)

            api = TransferegovApi()
            lpg_data = api.buscar_plano_acao_lpg(cnpj=cnpj)

            response_data = {
                "success": True,
                "fonte": "API Pública Transferegov Fundo a Fundo (MinC)",
                "base_legal": "Lei Complementar nº 195/2022 (Lei Paulo Gustavo)",
                "municipio": "Viamão",
                "uf": "RS",
                "cached": was_cached,
                "plano_acao": lpg_data
            }

            payload = json.dumps(response_data, ensure_ascii=False).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, s-maxage=7200, stale-while-revalidate=86400")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        except Exception as e:
            logger.error(f"Erro no endpoint /api/lpg: {e}")
            err_data = json.dumps({
                "success": False,
                "error": str(e),
                "fonte": "Transferegov Fundo a Fundo (MinC)"
            }).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_data)
