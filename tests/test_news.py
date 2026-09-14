"""=============================================================================
TESTES UNITÁRIOS: SCRAPER DE NOTÍCIAS E EDITAIS DE VIAMÃO / RS
Módulo: tests/test_news.py
=============================================================================
Valida a integridade do pipeline de notícias, filtro de palavras-chave culturais,
resolução de imagens de referência e proteção contra AttributeError.
"""

import unittest
from unittest.mock import MagicMock
from datetime import datetime

from backend.scrapers.viamao_scraper import (
    ViamaoCultureScraper,
    validar_conteudo_cultural,
    obter_imagem_referencia,
    TERMOS_CULTURA
)


class TestViamaoNewsScraper(unittest.TestCase):

    def test_validar_conteudo_cultural(self):
        """Verifica se o filtro aceita conteúdo estritamente cultural e rejeita ruído."""
        # Casos culturais válidos
        self.assertTrue(validar_conteudo_cultural("Prorrogação de edital da PNAB em Viamão"))
        self.assertTrue(validar_conteudo_cultural("Sarau de literatura e música no IFRS"))
        self.assertTrue(validar_conteudo_cultural("Oficina de Dança e Hip-Hop"))
        self.assertTrue(validar_conteudo_cultural("Preservação do patrimônio histórico"))
        self.assertTrue(validar_conteudo_cultural("Fundo de Apoio à Cultura (FAC) abre inscrições"))
        self.assertTrue(validar_conteudo_cultural("Secretaria Municipal da Cultura divulga resultados"))

        # Casos não culturais (devem ser rejeitados)
        self.assertFalse(validar_conteudo_cultural("Obras de asfalto e recapeamento na avenida central"))
        self.assertFalse(validar_conteudo_cultural("Vacinação contra gripe no posto de saúde"))
        self.assertFalse(validar_conteudo_cultural("Horário de coleta de lixo no feriado"))
        self.assertFalse(validar_conteudo_cultural(""))

    def test_obter_imagem_referencia(self):
        """Verifica resolução de imagem: artigo > favicon institucional > None."""
        # 1. Imagem específica do artigo
        self.assertEqual(
            obter_imagem_referencia("https://www.viamao.rs.gov.br/noticia/1", "https://imagem.com/foto.jpg"),
            "https://imagem.com/foto.jpg"
        )

        # 2. Favicon institucional da Prefeitura de Viamão
        self.assertEqual(
            obter_imagem_referencia("https://www.viamao.rs.gov.br/noticia/detalhe/80942"),
            "https://www.viamao.rs.gov.br/favicon.ico"
        )

        # 3. Favicon do IFRS
        self.assertIn("favicon.ico", obter_imagem_referencia("https://viamao.ifrs.edu.br/"))

        # 4. Favicon da SEDAC-RS / Pró-Cultura
        self.assertEqual(
            obter_imagem_referencia("https://www.procultura.rs.gov.br/"),
            "https://cultura.rs.gov.br/favicon.ico"
        )

        # 5. Domínio não mapeado
        self.assertIsNone(obter_imagem_referencia("https://blog-desconhecido.com/post"))

    def test_scraper_extrair_noticias_com_html_e_filtro(self):
        """Verifica parsing de HTML com filtro de integridade cultural ativo."""
        scraper = ViamaoCultureScraper()
        mock_client = MagicMock()
        
        html_sample = """
        <html>
            <body>
                <article class="noticia">
                    <h2><a href="/noticia/detalhe/101">Festival de Música e Artes de Viamão 2026</a></h2>
                    <p>Coletivos se reúnem para apresentar novos trabalhos culturais no centro histórico.</p>
                    <img src="/imagens/banner-festival.jpg" />
                    <span class="data">14/09/2026</span>
                </article>
                <article class="noticia">
                    <h2><a href="/noticia/detalhe/102">Manutenção e troca de lâmpadas na rodovia</a></h2>
                    <p>Equipes de trânsito realizam reparos na iluminação pública.</p>
                </article>
            </body>
        </html>
        """
        mock_client.fetch_json.return_value = {"raw_text": html_sample, "status": 200}
        scraper.http_client = mock_client

        noticias = scraper.extrair_noticias_editais_viamao(termo="cultura", apenas_cultura=True)

        # Deve conter a notícia cultural do HTML raspado
        titulos = [n["titulo"] for n in noticias]
        self.assertIn("Festival de Música e Artes de Viamão 2026", titulos)
        # Não deve conter a notícia não-cultural de lâmpadas
        self.assertNotIn("Manutenção e troca de lâmpadas na rodovia", titulos)

        # Deve conter também as notícias auditadas
        self.assertTrue(any("PNAB" in t for t in titulos))

    def test_compatibilidade_metodo_legado_sem_attribute_error(self):
        """Garante que pesquisar_google_noticias_viamao não gera AttributeError."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.pesquisar_google_noticias_viamao(termo="pnab")
        self.assertIsInstance(noticias, list)
        self.assertGreater(len(noticias), 0)
        self.assertTrue(all("titulo" in n and "link" in n for n in noticias))


if __name__ == "__main__":
    unittest.main()
