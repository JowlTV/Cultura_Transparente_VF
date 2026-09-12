/**
 * Módulo de Segurança, Sanitização e Prevenção de Vulnerabilidades (XSS, Open Redirect, Prototype Pollution e Tabnabbing)
 * Em conformidade com as diretrizes OWASP Top 10 e CWE-79 / CWE-601.
 */

// Esquemas explicitamente perigosos
const DANGEROUS_SCHEMES = [
  'javascript:',
  'vbscript:',
  'data:',
  'file:',
  'blob:',
  'about:',
  'chrome:',
  'ms-appx:',
];

/**
 * Remove qualquer caractere de controle, espaços em branco ocultos e decodifica sequências comuns de bypass.
 */
function normalizeForSecurityCheck(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F-\x9F\u200B-\u200D\uFEFF]/g, '') // Caracteres nulos e de controle
    .replace(/\s+/g, '') // Espaços inseridos para quebrar palavras-chave
    .toLowerCase();
}

/**
 * Sanitiza URLs externas garantindo que apenas protocolos seguros (HTTP/HTTPS/mailto/tel) sejam permitidos.
 * Previne XSS baseado em esquemas perigosos (javascript:, data:, blob:) e esquivas com entidades codificadas.
 */
export function sanitizeUrl(url?: string | null, fallback: string = '#'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Normaliza e verifica esquemas proibidos
  const normalized = normalizeForSecurityCheck(trimmed);
  for (const scheme of DANGEROUS_SCHEMES) {
    if (normalized.startsWith(scheme)) {
      return fallback;
    }
  }

  // Bloqueia tentativas com codificação de entidade HTML (ex: &#x6a;avascript, &colon;)
  if (/&#[xX]?[0-9a-fA-F]+;|(&[a-zA-Z]+;)/.test(trimmed)) {
    try {
      const decoded = decodeURIComponent(trimmed.replace(/&colon;/gi, ':'));
      const normalizedDecoded = normalizeForSecurityCheck(decoded);
      for (const scheme of DANGEROUS_SCHEMES) {
        if (normalizedDecoded.startsWith(scheme)) {
          return fallback;
        }
      }
    } catch {
      // Se não for possível decodificar seguramente, continua
    }
  }

  // Previne URLs com protocolo relativo não tratado (ex: //malicious.com)
  if (trimmed.startsWith('//')) {
    return fallback;
  }

  // Se já possui protocolo válido HTTP ou HTTPS
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        // Assegura que o host possui um domínio válido
        if (parsed.hostname && (parsed.hostname === 'localhost' || parsed.hostname.includes('.'))) {
          return parsed.href;
        }
      }
    } catch {
      return fallback;
    }
  }

  // Se for um link de e-mail legítimo
  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(trimmed)) {
    return trimmed;
  }

  // Se for um link de telefone legítimo
  if (/^tel:\+?[0-9()\s-]{6,20}$/i.test(trimmed)) {
    return trimmed;
  }

  // Se for um domínio sem protocolo (ex: www.viamao.rs.gov.br ou instagram.com/...)
  if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return fallback;
}

/**
 * Validador estrito para formulários de cadastro de URLs externas.
 */
export function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  const trimmed = stringUrl.trim();
  if (trimmed.length < 4 || trimmed.length > 2000) return false;

  // Rejeita esquemas maliciosos
  const normalized = normalizeForSecurityCheck(trimmed);
  for (const scheme of DANGEROUS_SCHEMES) {
    if (normalized.startsWith(scheme)) return false;
  }

  // Rejeita protocolo relativo
  if (trimmed.startsWith('//')) return false;

  try {
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(formatted);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname) &&
      (parsed.hostname === 'localhost' || parsed.hostname.includes('.'))
    );
  } catch {
    return false;
  }
}

/**
 * Remove tags HTML e scripts de entradas de texto de usuários para evitar injeções de conteúdo
 */
export function stripHtmlTags(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove blocos <script>
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove blocos <style>
    .replace(/<[^>]+>/g, '') // Remove qualquer tag HTML remanescente
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers como onload=, onerror=
}

/**
 * Sanitiza textos de entrada de usuário para prevenir abusos de tamanho, caracteres de controle e tags maliciosas.
 */
export function sanitizeInputText(input?: string | null, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  const noTags = stripHtmlTags(input);
  return noTags
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle ASCII
    .slice(0, maxLength);
}

/**
 * Prevenção de poluição de protótipo (__proto__, constructor, prototype)
 */
export function isSafeKey(key: string): boolean {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
}
