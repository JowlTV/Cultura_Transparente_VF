"""
Executor local dos handlers serverless (api/*.py) para o `npm run dev`.

Recebe pela entrada padrão um JSON {"method", "path", "body", "headers"} e escreve na
saída padrão um JSON {"status", "headers", "body"} com a resposta do handler real.
Assim o ambiente de desenvolvimento usa exatamente o mesmo código da produção (Vercel),
sem respostas simuladas.
"""
import importlib
import json
import os
import sys
from io import BytesIO

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

ROTAS = {"/api": "index", "/api/lpg": "lpg", "/api/news": "news", "/api/emendas": "emendas", "/api/chat": "chat"}


def main() -> None:
    req = json.loads(sys.stdin.read() or "{}")
    method = (req.get("method") or "GET").upper()
    path = req.get("path") or "/api"
    rota = path.split("?", 1)[0].rstrip("/") or "/api"
    modulo = ROTAS.get(rota)

    real_stdout = sys.stdout
    sys.stdout = sys.stderr  # logs dos handlers não podem poluir a resposta

    if modulo is None:
        resposta = {"status": 404, "headers": {}, "body": json.dumps({"success": False, "error": "Rota inexistente"})}
    else:
        handler_cls = importlib.import_module(f"api.{modulo}").handler
        body = (req.get("body") or "").encode("utf-8")
        h = handler_cls.__new__(handler_cls)
        h.command = method
        h.path = path
        h.request_version = "HTTP/1.1"
        h.requestline = f"{method} {path} HTTP/1.1"
        h.client_address = ("127.0.0.1", 0)
        h.rfile = BytesIO(body)
        h.wfile = BytesIO()
        h.headers = {"Content-Length": str(len(body)), "Content-Type": "application/json", **(req.get("headers") or {})}
        h._headers_buffer = []

        acao = getattr(h, f"do_{method}", None)
        if acao is None:
            resposta = {"status": 405, "headers": {}, "body": json.dumps({"success": False, "error": "Método não suportado"})}
        else:
            acao()
            raw = h.wfile.getvalue()
            cabecalho, _, corpo = raw.partition(b"\r\n\r\n")
            linhas = cabecalho.decode("latin-1").split("\r\n")
            try:
                status = int(linhas[0].split(" ")[1])
            except (IndexError, ValueError):
                status = 500
            headers = {}
            for linha in linhas[1:]:
                if ":" in linha:
                    k, v = linha.split(":", 1)
                    headers[k.strip()] = v.strip()
            resposta = {"status": status, "headers": headers, "body": corpo.decode("utf-8", errors="replace")}

    real_stdout.write(json.dumps(resposta, ensure_ascii=False))
    real_stdout.flush()


if __name__ == "__main__":
    main()
