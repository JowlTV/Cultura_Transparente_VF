"""=============================================================================
TESTES UNITÁRIOS: SCRAPER DE NOTÍCIAS E EDITAIS DE VIAMÃO / RS
Módulo: tests/test_news.py
=============================================================================
Valida a integridade do pipeline de notícias via RSS oficial, filtro temático,
ordenação por data, extração de imagens e tratamento de falhas sem requisições de rede.
=============================================================================
"""

import os
import unittest
from unittest.mock import patch, MagicMock

from backend.scrapers.viamao_scraper import (
    ViamaoCultureScraper,
    validar_conteudo_cultural,
    obter_imagem_referencia,
    formatar_data_iso_para_br,
    TERMOS_CULTURA
)


class TestViamaoNewsScraper(unittest.TestCase):

    def setUp(self):
        self.fixture_path = os.path.join(
            os.path.dirname(__file__), "fixtures", "viamao_rss.xml"
        )
        with open(self.fixture_path, "r", encoding="utf-8") as f:
            self.xml_sample = f.read()

    def test_validar_conteudo_cultural(self):
        """Verifica se o filtro aceita conteúdo estritamente cultural e rejeita ruído."""
        # Casos culturais válidos
        self.assertTrue(validar_conteudo_cultural("Prorrogação de edital da PNAB em Viamão"))
        self.assertTrue(validar_conteudo_cultural("Sarau de literatura e música no IFRS"))
        self.assertTrue(validar_conteudo_cultural("Oficina de Dança e Hip-Hop"))
        self.assertTrue(validar_conteudo_cultural("Preservação do patrimônio histórico"))
        self.assertTrue(validar_conteudo_cultural("Pró-Cultura RS abre inscrições para chamadas"))
        self.assertTrue(validar_conteudo_cultural("Secretaria Municipal da Cultura divulga resultados"))
        self.assertTrue(validar_conteudo_cultural("Instrutor de Capoeira e Fanfarras"))

        # Casos não culturais (devem ser rejeitados)
        self.assertFalse(validar_conteudo_cultural("Obras de asfalto e recapeamento na avenida central"))
        self.assertFalse(validar_conteudo_cultural("Vacinação contra gripe no posto de saúde"))
        self.assertFalse(validar_conteudo_cultural("Horário de coleta de lixo no feriado"))
        self.assertFalse(validar_conteudo_cultural("Lista de espera educação infantil"))
        self.assertFalse(validar_conteudo_cultural(""))

    def test_obter_imagem_referencia(self):
        """Verifica resolução de imagem: artigo > favicon institucional > None."""
        self.assertEqual(
            obter_imagem_referencia("https://www.viamao.rs.gov.br/noticia/1", "https://imagem.com/foto.jpg"),
            "https://imagem.com/foto.jpg"
        )
        self.assertEqual(
            obter_imagem_referencia("https://www.viamao.rs.gov.br/portal/noticias/0/3/9656/pnab"),
            "https://www.viamao.rs.gov.br/favicon.ico"
        )
        self.assertIn("favicon.ico", obter_imagem_referencia("https://ifrs.edu.br/viamao/"))
        self.assertEqual(
            obter_imagem_referencia("https://cultura.rs.gov.br/"),
            "https://cultura.rs.gov.br/favicon.ico"
        )
        self.assertIsNone(obter_imagem_referencia("https://portal-desconhecido.com/post"))

    def test_formatar_data_iso_para_br(self):
        """Verifica conversão de datas para o formato brasileiro sem alucinar horário."""
        self.assertEqual(formatar_data_iso_para_br("2026-08-28"), "28/08/2026")
        self.assertEqual(formatar_data_iso_para_br("2026-03-31"), "31/03/2026")
        self.assertEqual(formatar_data_iso_para_br("15/06/2026"), "15/06/2026")

    def test_parse_rss_item_cultura_aceito(self):
        """Verifica se itens com categoria CULTURA são aceitos diretamente."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.parse_rss_xml(self.xml_sample, apenas_cultura=True)

        titulos = [n["titulo"] for n in noticias]
        # Item 1: PNAB (CULTURA)
        self.assertIn("Prorrogados prazos de inscrição dos Editais PNAB 2026 - Literatura e Artesanato com nova redação", titulos)
        # Item 6: Festival de Dança (CULTURA)
        self.assertIn("Festival Municipal de Dança e Artes Cênicas de Viamão", titulos)

    def test_parse_rss_item_educacao_com_termo_cultural_aceito(self):
        """Verifica se item de EDUCAÇÃO com termos de capoeira/música é aceito pelo filtro temático."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.parse_rss_xml(self.xml_sample, apenas_cultura=True)

        titulos = [n["titulo"] for n in noticias]
        self.assertIn("Edital de Abertura Intrutor de Capoeira e Instrutor de Bandas e Fanfarras", titulos)

    def test_parse_rss_item_educacao_sem_termo_cultural_rejeitado(self):
        """Verifica se item de EDUCAÇÃO sem termos culturais (vagas de creche) é descartado."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.parse_rss_xml(self.xml_sample, apenas_cultura=True)

        titulos = [n["titulo"] for n in noticias]
        self.assertNotIn("LISTA DE ESPERA EDUCAÇÃO INFANTIL", titulos)

    def test_parse_rss_itens_gerais_sem_cultura_rejeitados(self):
        """Verifica se itens administrativos/econômicos sem relação cultural são rejeitados."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.parse_rss_xml(self.xml_sample, apenas_cultura=True)

        titulos = [n["titulo"] for n in noticias]
        self.assertNotIn("Viamão registra crescimento e amplia inserção internacional", titulos)
        self.assertNotIn("ATO DE DISPENSA ELETRÔNICA Nº 53/2026", titulos)

    def test_parse_rss_ordenacao_por_pubdate(self):
        """Verifica se as notícias são ordenadas decrescentemente pela data de publicação."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.parse_rss_xml(self.xml_sample, apenas_cultura=True)

        # 28/08/2026 deve vir antes de 15/08/2026 e 31/03/2026
        datas_iso = [n["pub_date_iso"] for n in noticias]
        self.assertEqual(datas_iso, sorted(datas_iso, reverse=True))

    def test_parse_rss_imagem_extraida(self):
        """Verifica se a URL da imagem de cada item é extraída corretamente do nó <image><url>."""
        scraper = ViamaoCultureScraper()
        noticias = scraper.parse_rss_xml(self.xml_sample, apenas_cultura=True)

        pnab_noticia = next(n for n in noticias if "PNAB" in n["titulo"])
        self.assertEqual(
            pnab_noticia["imagem"],
            "https://www.viamao.rs.gov.br/fotos/cc34e6a8eb6cbf1b106f93ec70fc206b.jpg"
        )

    @patch.object(ViamaoCultureScraper, "_fetch_url_text")
    def test_scraper_ao_vivo_com_sucesso(self, mock_fetch):
        """Verifica fluxo completo offline usando o fixture mockado."""
        mock_fetch.return_value = self.xml_sample
        scraper = ViamaoCultureScraper()

        noticias = scraper.extrair_noticias_editais_viamao(termo="cultura", apenas_cultura=True)
        self.assertTrue(len(noticias) >= 3)
        status = scraper.obter_status_fontes()
        self.assertTrue(status["prefeitura_viamao"]["sucesso"])
        self.assertEqual(status["prefeitura_viamao"]["ultima_publicacao"], "28/08/2026")

    @patch.object(ViamaoCultureScraper, "_fetch_url_text")
    def test_falha_de_rede_gera_aviso_transparente(self, mock_fetch):
        """Verifica que falha de rede gera aviso explícito de indisponibilidade e não lista fixa mascarada."""
        mock_fetch.return_value = None  # Simula timeout / queda de conexão
        scraper = ViamaoCultureScraper()

        noticias = scraper.extrair_noticias_editais_viamao(termo="cultura", apenas_cultura=True, include_reserva=False)
        self.assertEqual(len(noticias), 0)

        status = scraper.obter_status_fontes()
        self.assertFalse(status["prefeitura_viamao"]["sucesso"])
        self.assertEqual(status["prefeitura_viamao"]["mensagem"], "Não foi possível consultar a fonte agora")


if __name__ == "__main__":
    unittest.main()
