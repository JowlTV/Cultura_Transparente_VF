"""
Serverless Function Vercel: /api/fac
Retorna editais do Fundo de Apoio à Cultura (SEDAC-RS / Pró-Cultura).
"""
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.scrapers.fac_scraper import FacScraper
from backend.utils import setup_logger

logger = setup_logger("VercelApiFAC")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            scraper = FacScraper()
            editais = scraper.extrair_editais_fac()
            
            response_data = {
                "success": True,
                "total": len(editais),
                "editais": [e.to_dict() for e in editais],
                "fonte_oficial": "https://www.procultura.rs.gov.br/"
            }
            
            payload = json.dumps(response_data, ensure_ascii=False).encode("utf-8")
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, s-maxage=14400, stale-while-revalidate=86400")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        except Exception as e:
            logger.error(f"Erro no endpoint /api/fac: {e}")
            err_data = json.dumps({"success": False, "error": str(e)}).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_data)
