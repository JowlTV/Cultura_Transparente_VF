"""=============================================================================
CULTURA TRANSPARENTE - UTILITÁRIOS, LOGGING, CACHE TTL E RETRY CLIENT
Módulo: backend/utils.py
=============================================================================
Fornece infraestrutura resiliente para consumo de dados públicos:
- Logging estruturado em formato JSON e legível
- Estratégia de Cache em memória e disco com TTL configurável
- Cliente HTTP com retry exponencial, timeouts estritos e respeito a rate limits
"""

import os
import sys
import json
import time
import logging
import threading
import tempfile
from typing import Any, Optional, Dict, Callable
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from urllib.parse import urlencode


# =============================================================================
# 1. LOGGING ESTRUTURADO
# =============================================================================

class JSONFormatter(logging.Formatter):
    """Formatador para saída de logs estruturada em JSON."""
    def format(self, record: logging.LogRecord) -> str:
        log_obj = {
            "timestamp": self.formatTime(record, "%Y-%m-%d %H:%M:%S"),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno
        }
        if hasattr(record, "extra_data"):
            log_obj["data"] = record.extra_data
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj, ensure_ascii=False)


def setup_logger(name: str = "CulturaTransparente", json_format: bool = False) -> logging.Logger:
    """Configura e retorna um logger estruturado."""
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    
    logger.setLevel(logging.INFO)
    handler = logging.StreamHandler(sys.stdout)
    
    if json_format or os.getenv("LOG_FORMAT", "").lower() == "json":
        handler.setFormatter(JSONFormatter())
    else:
        fmt = logging.Formatter("[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s", "%Y-%m-%d %H:%M:%S")
        handler.setFormatter(fmt)
        
    logger.addHandler(handler)
    return logger


logger = setup_logger("CoreUtils")


# =============================================================================
# 2. CACHE STRATEGY COM TTL (TIME-TO-LIVE)
# =============================================================================

class TTLCache:
    """
    Gerenciador de cache thread-safe em memória com expiração por TTL.
    Permite opcionalmente sincronizar o estado em arquivo JSON para persistência.

    NOTA ARQUITETURAL / LIMITAÇÕES EM AMBIENTES SERVERLESS (ex: Vercel / AWS Lambda):
    - Em ambientes serverless baseados em funções efêmeras, cada invocação pode ser executada
      em uma instância isolada. O cache em memória persiste somente durante warm starts
      da mesma instância de execução e não é compartilhado entre réplicas simultâneas distintas.
    - Para concorrência distribuída massiva (>1.000 req/s), a primeira linha de defesa
      é o Edge Cache HTTP (cabeçalho `Cache-Control: public, s-maxage=...`), que intercepta
      as requisições na CDN antes de invocar a função Python.
    - Para persistência de estado distribuído compartilhado entre workers, utilize Redis / Upstash KV.
    """
    def __init__(self, default_ttl_seconds: int = 3600, disk_file: Optional[str] = None):
        self._default_ttl = default_ttl_seconds
        self._disk_file = disk_file
        self._store: Dict[str, Dict[str, Any]] = {}
        self._lock = threading.RLock()
        self._stats = {"hits": 0, "misses": 0, "sets": 0, "evictions": 0}

        if self._disk_file and os.path.exists(self._disk_file):
            self._load_from_disk()

    def get(self, key: str) -> Optional[Any]:
        """Recupera um valor se existir e ainda for válido pelo TTL."""
        with self._lock:
            if key not in self._store:
                self._stats["misses"] += 1
                return None
            
            item = self._store[key]
            now = time.time()
            if now > item["expires_at"]:
                del self._store[key]
                self._stats["evictions"] += 1
                self._stats["misses"] += 1
                return None
            
            self._stats["hits"] += 1
            return item["value"]

    def has(self, key: str) -> bool:
        """Verifica se uma chave existe e ainda é válida pelo TTL sem incrementar stats de hit/miss."""
        with self._lock:
            if key not in self._store:
                return False
            if time.time() > self._store[key]["expires_at"]:
                return False
            return True

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Armazena um valor com TTL customizado ou padrão."""
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            self._store[key] = {
                "value": value,
                "expires_at": time.time() + ttl,
                "created_at": time.time()
            }
            self._stats["sets"] += 1
            if self._disk_file:
                self._save_to_disk()

    def invalidate(self, key: str) -> bool:
        """Invalida explicitamente uma chave."""
        with self._lock:
            if key in self._store:
                del self._store[key]
                return True
            return False

    def clear(self) -> None:
        """Limpa todo o cache."""
        with self._lock:
            self._store.clear()
            if self._disk_file and os.path.exists(self._disk_file):
                try:
                    os.remove(self._disk_file)
                except OSError:
                    pass

    def get_stats(self) -> Dict[str, Any]:
        with self._lock:
            return {
                **self._stats,
                "active_keys": len(self._store),
                "default_ttl_seconds": self._default_ttl
            }

    def _save_to_disk(self):
        try:
            with open(self._disk_file, "w", encoding="utf-8") as f:
                json.dump(self._store, f, ensure_ascii=False)
        except Exception as e:
            logger.warning(f"Falha ao persistir cache no disco: {e}")

    def _load_from_disk(self):
        try:
            with open(self._disk_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                now = time.time()
                # Carregar apenas itens não expirados
                self._store = {k: v for k, v in data.items() if v.get("expires_at", 0) > now}
        except Exception as e:
            logger.warning(f"Falha ao carregar cache do disco: {e}")


# Instância global compartilhada de cache resiliente (TTL padrão de 24 horas e persistência em disco)
_DEFAULT_DISK_CACHE = os.environ.get("CACHE_DISK_FILE") or os.path.join(tempfile.gettempdir(), "cultura_transparente_cache.json")
cache = TTLCache(default_ttl_seconds=86400, disk_file=_DEFAULT_DISK_CACHE)


# =============================================================================
# 3. SINGLE-FLIGHT / COALESCING DE REQUISIÇÕES CONCORRENTES
# =============================================================================

class SingleFlightCache:
    """
    Garante que, para uma mesma chave, apenas uma chamada de função
    'cara' (ex: requisição HTTP externa) seja executada por vez,
    mesmo sob concorrência. Requisições concorrentes para a mesma
    chave aguardam o resultado da chamada em andamento em vez de
    disparar chamadas duplicadas à fonte externa (coalescência / single-flight).

    NOTA ARQUITETURAL SOBRE AMBIENTE SERVERLESS (ex: Vercel / AWS Lambda):
    - Este mecanismo protege requisições concorrentes processadas dentro da mesma
      instância/processo da função serverless (durante warm start e execução multithread).
    - Ele não substitui o Edge Cache HTTP (cabeçalhos `Cache-Control: public, s-maxage=...`),
      que é a proteção primária e global contra chamadas repetidas entre réplicas e regiões distintas da CDN.
    - O objetivo deste mecanismo não é impor um limitador de taxa (rate limiter), mas sim garantir
      que múltiplos acessos simultâneos a um cache frio (cache-miss) disparem apenas uma única
      requisição externa real por chave.
    """
    def __init__(self, cache_instance: Optional[TTLCache] = None):
        self._cache = cache_instance if cache_instance is not None else cache
        self._locks: Dict[str, threading.Lock] = {}
        self._locks_guard = threading.Lock()

    def _get_lock(self, key: str) -> threading.Lock:
        with self._locks_guard:
            if key not in self._locks:
                self._locks[key] = threading.Lock()
            return self._locks[key]

    def get_or_fetch(self, key: str, fetch_fn: Callable[[], Any], ttl_seconds: Optional[int] = None) -> Any:
        """
        Executa a busca com coalescência:
        1. Fast path: Se a chave já estiver em cache, retorna imediatamente sem adquirir lock da chave.
        2. Slow path: Adquire lock por chave, re-checa o cache (coalescing) e executa fetch_fn apenas uma vez.
        """
        # Fast path: já está em cache válido
        cached = self._cache.get(key)
        if cached is not None:
            return cached

        # Slow path: adquire lock específico desta chave
        lock = self._get_lock(key)
        with lock:
            # Re-checa o cache: outra requisição concorrente pode ter preenchido
            # enquanto esperávamos o lock (coalescing de fato)
            cached = self._cache.get(key)
            if cached is not None:
                return cached

            # Só a primeira requisição a chegar aqui executa fetch_fn
            result = fetch_fn()
            if result is not None:
                self._cache.set(key, result, ttl_seconds)
            return result


# Instância global compartilhada de SingleFlightCache
single_flight = SingleFlightCache(cache_instance=cache)


# =============================================================================
# 4. CLIENTE HTTP RESILIENTE COM RETRY EXPONENCIAL
# =============================================================================

class HttpClient:
    """
    Cliente HTTP nativo com retry exponencial, tratamento de erros,
    validação de rate-limiting (status 429) e timeouts estritos para serverless (10s).
    """
    DEFAULT_HEADERS = {
        "User-Agent": "CulturaTransparenteViamao/2.5 (+https://viamao.cultura.org)",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8"
    }

    def __init__(self, max_retries: int = 2, backoff_factor: float = 0.4, timeout: float = 4.0):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout  # Adequado para limite estrito de 10s do Vercel Serverless (2 retries + timeout 4s)

    def fetch_json(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        cache_ttl: Optional[int] = None,
        cache_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executa requisição GET com cache opcional e retry exponencial.
        """
        if params:
            query_string = urlencode({k: v for k, v in params.items() if v is not None})
            delimiter = "&" if "?" in url else "?"
            full_url = f"{url}{delimiter}{query_string}"
        else:
            full_url = url

        # 1. Verifica Cache se habilitado
        actual_cache_key = cache_key or f"http:{full_url}"
        if cache_ttl is not None and cache_ttl > 0:
            cached_data = cache.get(actual_cache_key)
            if cached_data is not None:
                logger.debug(f"Cache HIT para: {full_url}")
                return cached_data

        # 2. Executa requisição com Retry
        merged_headers = {**self.DEFAULT_HEADERS, **(headers or {})}
        attempt = 0
        last_exception = None

        while attempt <= self.max_retries:
            attempt += 1
            start_time = time.time()
            try:
                req = Request(full_url, headers=merged_headers)
                with urlopen(req, timeout=self.timeout) as response:
                    status_code = response.getcode()
                    content_type = response.headers.get("Content-Type", "")
                    raw_bytes = response.read()
                    latency = time.time() - start_time

                    if "application/json" in content_type or raw_bytes.strip().startswith((b"{", b"[")):
                        parsed_json = json.loads(raw_bytes.decode("utf-8"))
                        logger.info(f"HTTP GET {status_code} ({latency:.2f}s): {full_url}")
                        
                        if cache_ttl is not None and cache_ttl > 0:
                            cache.set(actual_cache_key, parsed_json, ttl_seconds=cache_ttl)
                        
                        return parsed_json
                    else:
                        text = raw_bytes.decode("utf-8", errors="replace")
                        return {"raw_text": text, "status": status_code}

            except HTTPError as e:
                latency = time.time() - start_time
                last_exception = e
                # Status 429 (Rate Limit) ou 5xx (Erro transitório de servidor)
                if e.code in (429, 500, 502, 503, 504) and attempt <= self.max_retries:
                    sleep_time = self.backoff_factor * (2 ** (attempt - 1))
                    logger.warning(
                        f"HTTP {e.code} em {full_url}. Tentativa {attempt}/{self.max_retries}. "
                        f"Aguardando {sleep_time:.2f}s antes de reexecutar."
                    )
                    time.sleep(sleep_time)
                    continue
                else:
                    logger.error(f"HTTP Error {e.code} fatal em {full_url}: {e.reason}")
                    raise

            except (URLError, TimeoutError) as e:
                last_exception = e
                if attempt <= self.max_retries:
                    sleep_time = self.backoff_factor * (2 ** (attempt - 1))
                    logger.warning(
                        f"Falha de rede/timeout ({type(e).__name__}) em {full_url}. "
                        f"Tentativa {attempt}/{self.max_retries}. Aguardando {sleep_time:.2f}s."
                    )
                    time.sleep(sleep_time)
                    continue
                else:
                    logger.error(f"Timeout/Conexão esgotada em {full_url}: {e}")
                    raise

        raise last_exception or RuntimeError(f"Falha ao conectar em {full_url}")

    def fetch_text(
        self,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        cache_ttl: Optional[int] = None,
        cache_key: Optional[str] = None
    ) -> str:
        """
        Executa requisição GET retornando texto bruto (ex: CSV, XML, HTML) com cache opcional.
        """
        if params:
            query_string = urlencode({k: v for k, v in params.items() if v is not None})
            delimiter = "&" if "?" in url else "?"
            full_url = f"{url}{delimiter}{query_string}"
        else:
            full_url = url

        actual_cache_key = cache_key or f"http:text:{full_url}"
        if cache_ttl is not None and cache_ttl > 0:
            cached_data = cache.get(actual_cache_key)
            if cached_data is not None:
                return cached_data

        merged_headers = {**self.DEFAULT_HEADERS, **(headers or {})}
        attempt = 0
        last_exception = None

        while attempt <= self.max_retries:
            attempt += 1
            try:
                req = Request(full_url, headers=merged_headers)
                with urlopen(req, timeout=self.timeout) as response:
                    raw_bytes = response.read()
                    text = raw_bytes.decode("utf-8", errors="replace")
                    if cache_ttl is not None and cache_ttl > 0:
                        cache.set(actual_cache_key, text, ttl_seconds=cache_ttl)
                    return text
            except Exception as e:
                last_exception = e
                if attempt <= self.max_retries:
                    time.sleep(self.backoff_factor * attempt)
                    continue
                raise last_exception


http_client = HttpClient()
