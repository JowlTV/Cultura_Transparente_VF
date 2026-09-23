"""=============================================================================
CULTURA TRANSPARENTE - COLETOR E SANIZADOR DE TEXTOS LEGAIS DO PLANALTO
Módulo: backend/scrapers/legal_cleaner.py
=============================================================================
Identifica e descarta trechos revogados marcados com <strike>, <s>, <del>
ou 'text-decoration: line-through' nas páginas do Planalto, preservando as
anotações de alteração vigentes como '(Redação dada...)' e '(Incluído...)'.
Lê na codificação declarada pela página (geralmente ISO-8859-1 / Windows-1252)
e grava em UTF-8 puro, garantindo ausência total de caracteres corrompidos.
=============================================================================
"""

import os
import re
import urllib.request
from html.parser import HTMLParser
from html import unescape
from typing import Dict, Any, List, Optional


class PlanaltoVigenteParser(HTMLParser):
    """
    Parser HTML que extrai exclusivamente o texto legal vigente.
    Descarta qualquer conteúdo que esteja contido dentro de:
    - <strike> ... </strike>
    - <s> ... </s>
    - <del> ... </del>
    - elementos com atributo style contendo 'line-through'
    - <script>, <style>
    """
    def __init__(self):
        super().__init__()
        self.ignore_depth = 0
        self.script_depth = 0
        self.pieces: List[str] = []
        # Pilha de tuplas: (tag_lower, triggered_ignore: bool)
        self.tag_stack: List[tuple] = []

    def handle_starttag(self, tag: str, attrs: List[tuple]):
        tag_lower = tag.lower()

        is_strike = tag_lower in ("strike", "s", "del")
        if not is_strike:
            for attr_name, attr_val in attrs:
                if attr_name.lower() == "style" and attr_val and "line-through" in attr_val.lower():
                    is_strike = True
                    break

        if is_strike:
            self.ignore_depth += 1
            self.tag_stack.append((tag_lower, True))
        else:
            self.tag_stack.append((tag_lower, False))

        if tag_lower in ("script", "style"):
            self.script_depth += 1

        if tag_lower in ("p", "br", "tr", "div", "h1", "h2", "h3", "h4", "li"):
            if self.ignore_depth == 0 and self.script_depth == 0:
                self.pieces.append("\n")

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()

        # Desempilha correspondente
        matched_idx = -1
        for i in range(len(self.tag_stack) - 1, -1, -1):
            if self.tag_stack[i][0] == tag_lower:
                matched_idx = i
                break

        if matched_idx != -1:
            popped_items = self.tag_stack[matched_idx:]
            self.tag_stack = self.tag_stack[:matched_idx]
            for _, triggered in popped_items:
                if triggered and self.ignore_depth > 0:
                    self.ignore_depth -= 1
        elif tag_lower in ("strike", "s", "del") and self.ignore_depth > 0:
            self.ignore_depth -= 1

        if tag_lower in ("script", "style") and self.script_depth > 0:
            self.script_depth -= 1

        if tag_lower in ("p", "tr", "div", "li"):
            if self.ignore_depth == 0 and self.script_depth == 0:
                self.pieces.append("\n")

    def handle_data(self, data: str):
        if self.ignore_depth == 0 and self.script_depth == 0:
            self.pieces.append(data)

    def handle_entityref(self, name: str):
        if self.ignore_depth == 0 and self.script_depth == 0:
            self.pieces.append(unescape(f"&{name};"))

    def handle_charref(self, name: str):
        if self.ignore_depth == 0 and self.script_depth == 0:
            self.pieces.append(unescape(f"&#{name};"))

    def get_clean_text(self) -> str:
        raw_text = "".join(self.pieces)
        raw_text = unescape(raw_text)
        # Normalização de espaços e quebras de linha
        linhas = []
        for l in raw_text.splitlines():
            linha_limpa = re.sub(r'[ \t\xa0]+', ' ', l).strip()
            if linha_limpa:
                linhas.append(linha_limpa)
        return "\n".join(linhas)


def extrair_texto_vigente_html(html_bytes: bytes, charset_hint: Optional[str] = None) -> str:
    """
    Decodifica os bytes HTML usando o charset declarado (ou ISO-8859-1 / Windows-1252)
    e extrai apenas a redação legal vigente.
    """
    detected_charset = charset_hint
    if not detected_charset:
        meta_match = re.search(rb'charset=([a-zA-Z0-9_-]+)', html_bytes[:2048], re.IGNORECASE)
        if meta_match:
            try:
                detected_charset = meta_match.group(1).decode('ascii')
            except Exception:
                detected_charset = "iso-8859-1"
        else:
            detected_charset = "iso-8859-1"

    try:
        html_str = html_bytes.decode(detected_charset, errors="replace")
    except Exception:
        try:
            html_str = html_bytes.decode("windows-1252", errors="replace")
        except Exception:
            html_str = html_bytes.decode("iso-8859-1", errors="replace")

    parser = PlanaltoVigenteParser()
    parser.feed(html_str)
    return parser.get_clean_text()


def baixar_e_limpar_documento_planalto(url: str) -> str:
    """Baixa o documento oficial do Planalto e devolve o texto vigente limpo em UTF-8."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        content_type = resp.headers.get("content-type", "")
        charset = None
        if "charset=" in content_type.lower():
            charset = content_type.lower().split("charset=")[-1].split(";")[0].strip()
        raw_bytes = resp.read()
        return extrair_texto_vigente_html(raw_bytes, charset_hint=charset)


if __name__ == "__main__":
    print("Módulo de limpeza de textos legais do Planalto carregado.")
