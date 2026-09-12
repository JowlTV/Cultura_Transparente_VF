"""
Serverless Function Vercel: /api/pnab
Retorna auditoria da PNAB (MinC / Transferegov) para Viamão/RS.
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Adiciona o diretório raiz ao path para importar backend
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.apis import TransferegovApi
from backend.utils import setup_logger

logger = setup_logger("VercelApiPNAB")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            api = TransferegovApi()
            pnab_record = api.buscar_termo_adesao_pnab("88000914000101")
            
            response_data = {
                "success": True,
                "data": pnab_record.to_dict() if pnab_record else None,
                "cached": True,
                "rate_limit_info": "60 req/min (Transferegov Oficial)"
            }
            
            payload = json.dumps(response_data, ensure_ascii=False).encode("utf-8")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            # Cache Vercel Edge: 1 hora de cache, 24 horas de stale-while-revalidate
            self.send_header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        except Exception as e:
            logger.error(f"Erro no endpoint /api/pnab: {e}")
            err_data = json.dumps({"success": False, "error": str(e)}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_data)
