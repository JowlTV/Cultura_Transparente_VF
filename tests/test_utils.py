"""=============================================================================
TESTES UNITÁRIOS: UTILITÁRIOS, CACHE TTL E HTTP CLIENT
Módulo: tests/test_utils.py
=============================================================================
"""

import unittest
import time
from backend.utils import TTLCache, HttpClient, setup_logger


class TestUtils(unittest.TestCase):

    def test_ttl_cache_hit_and_miss(self):
        cache = TTLCache(default_ttl_seconds=2)
        cache.set("chave1", {"dado": 123})
        
        # Hit imediato
        val = cache.get("chave1")
        self.assertIsNotNone(val)
        self.assertEqual(val["dado"], 123)

        # Miss para chave inexistente
        self.assertIsNone(cache.get("inexistente"))

    def test_ttl_cache_expiration(self):
        cache = TTLCache(default_ttl_seconds=1)
        cache.set("temporario", "valor_teste", ttl_seconds=1)
        
        # Imediatamente presente
        self.assertEqual(cache.get("temporario"), "valor_teste")
        
        # Após expiração
        time.sleep(1.1)
        self.assertIsNone(cache.get("temporario"))

    def test_ttl_cache_invalidation(self):
        cache = TTLCache()
        cache.set("a", 1)
        self.assertTrue(cache.invalidate("a"))
        self.assertFalse(cache.invalidate("a"))
        self.assertIsNone(cache.get("a"))

    def test_http_client_initialization(self):
        client = HttpClient(max_retries=2, timeout=5.0)
        self.assertEqual(client.max_retries, 2)
        self.assertEqual(client.timeout, 5.0)
        self.assertIn("User-Agent", client.DEFAULT_HEADERS)

    def test_structured_logger(self):
        logger = setup_logger("TestLogger")
        self.assertEqual(logger.name, "TestLogger")


if __name__ == "__main__":
    unittest.main()
