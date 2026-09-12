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


# Instância global compartilhada de cache (TTL padrão de 1 hora)
cache = TTLCache(default_ttl_seconds=3600)


# =============================================================================
# 3. CLIENTE HTTP RESILIENTE COM RETRY EXPONENCIAL
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

    def __init__(self, max_retries: int = 3, backoff_factor: float = 0.5, timeout: float = 8.0):
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.timeout = timeout  # Adequado para limite serverless de 10s

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


http_client = HttpClient()
