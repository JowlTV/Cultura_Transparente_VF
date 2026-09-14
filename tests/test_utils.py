"""=============================================================================
TESTES UNITÁRIOS: UTILITÁRIOS, CACHE TTL E HTTP CLIENT
Módulo: tests/test_utils.py
=============================================================================
"""

import unittest
import time
import threading
from backend.utils import TTLCache, SingleFlightCache, HttpClient, setup_logger


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

    def test_single_flight_fast_path(self):
        """Verifica que quando o cache já está quente, fetch_fn nunca é invocada."""
        cache = TTLCache(default_ttl_seconds=60)
        cache.set("chave_quente", {"status": "ok"})
        sf = SingleFlightCache(cache_instance=cache)
        
        chamadas = 0
        def fake_fetch():
            nonlocal chamadas
            chamadas += 1
            return {"status": "novo"}

        res = sf.get_or_fetch("chave_quente", fake_fetch)
        self.assertEqual(res, {"status": "ok"})
        self.assertEqual(chamadas, 0, "Fetch function não deve ser chamada quando a chave já está em cache")

    def test_single_flight_concurrency_coalescing(self):
        """
        Simula concorrência real com múltiplas threads disparando requisições
        simultâneas para a mesma chave com cache frio.
        Verifica se fetch_fn é executada exatamente 1 vez.
        """
        cache = TTLCache(default_ttl_seconds=60)
        sf = SingleFlightCache(cache_instance=cache)
        
        call_count = 0
        counter_lock = threading.Lock()
        results = []
        threads = []
        num_threads = 10

        def slow_fetch():
            nonlocal call_count
            with counter_lock:
                call_count += 1
            # Simula latência de rede externa para forçar sobreposição das threads
            time.sleep(0.08)
            return {"payload": "dados_federais_cgu", "timestamp": time.time()}

        def worker():
            res = sf.get_or_fetch("cgu:emendas:4323002:2024", slow_fetch, ttl_seconds=60)
            results.append(res)

        for _ in range(num_threads):
            t = threading.Thread(target=worker)
            threads.append(t)

        # Inicia todas as threads simultaneamente
        for t in threads:
            t.start()

        for t in threads:
            t.join()

        # Validações
        self.assertEqual(len(results), num_threads, "Todas as threads devem receber resposta")
        self.assertEqual(call_count, 1, f"fetch_fn deve ser chamada exatamente 1 vez, mas foi chamada {call_count} vezes")
        
        # Confirma que todas as threads receberam exatamente o mesmo payload
        primeiro_payload = results[0]["payload"]
        for r in results:
            self.assertEqual(r["payload"], primeiro_payload)

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
