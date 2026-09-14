"""
Serverless Function Vercel: /api/news
Retorna notícias e editais de cultura de Viamão/RS via portais municipais, imprensa regional e órgãos oficiais,
com estrito filtro anti-alucinação e validação temática cultural.
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.scrapers.viamao_scraper import ViamaoCultureScraper
from backend.utils import setup_logger, cache

logger = setup_logger("VercelApiNews")


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed_url = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_url.query)
            raw_termo = query_params.get("q", ["cultura"])[0]
            # Sanitização estrita do termo de busca (limite de 60 caracteres, apenas texto seguro)
            termo = "".join(c for c in raw_termo if c.isalnum() or c in " -_").strip()[:60] or "cultura"

            cache_key = f"scraper_news_viamao:{termo}"
            was_cached = cache.has(cache_key)
            scraper = ViamaoCultureScraper()
            noticias = scraper.extrair_noticias_editais_viamao(termo=termo, apenas_cultura=True)

            response_data = {
                "success": True,
                "termo_pesquisado": termo,
                "total": len(noticias),
                "noticias": noticias,
                "cached": was_cached,
                "politica_integridade": "Zero fake news. Fontes estritamente limitadas a órgãos oficiais de Viamão, IFRS, SEDAC-RS e imprensa regional verificada.",
                "data_consulta": datetime.now().strftime("%d/%m/%Y")
            }

            payload = json.dumps(response_data, ensure_ascii=False).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("X-Content-Type-Options", "nosniff")
            self.send_header("X-Frame-Options", "SAMEORIGIN")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        except Exception as e:
            logger.error(f"Erro no endpoint /api/news: {e}")
            err_data = json.dumps({
                "success": False,
                "error": str(e),
                "data_consulta": datetime.now().strftime("%d/%m/%Y")
            }, ensure_ascii=False).encode("utf-8")
            self.send_response(500)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(err_data)))
            self.end_headers()
            self.wfile.write(err_data)
