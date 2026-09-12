"""
Serverless Function Vercel: /api (Health Check e Índice de Rotas)
"""
from http.server import BaseHTTPRequestHandler
import json
from datetime import datetime


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        endpoints = {
            "status": "online",
            "servico": "Cultura Transparente Viamão - Serverless API",
            "versao": "2.5.0",
            "timestamp": datetime.now().isoformat(),
            "rotas_disponiveis": {
                "/api/pnab": "Auditoria de repasses federais da PNAB (MinC / Transferegov)",
                "/api/news": "Pesquisa de notícias e editais de Viamão via Google News com filtro anti-fake-news"
            },
            "politica_cache": "Vercel Edge Caching (s-maxage=3600 até 14400s)",
            "timeout_garantido": "Sub-10s (Hobby Free Tier Vercel)"
        }
        
        payload = json.dumps(endpoints, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "public, s-maxage=300")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)
