/**
 * Módulo de Segurança, Sanitização e Prevenção de Vulnerabilidades (XSS, Open Redirect e Tabnabbing)
 * Padrão sênior para integridade de dados e proteção do usuário.
 */

/**
 * Sanitiza URLs externas garantindo que apenas protocolos seguros (HTTP/HTTPS) sejam permitidos.
 * Previne XSS baseado em esquemas perigosos como javascript:, data:, vbscript: e caracteres de controle.
 */
export function sanitizeUrl(url?: string | null, fallback: string = '#'): string {
  if (!url || typeof url !== 'string') return fallback;

  const trimmed = url.trim();
  if (!trimmed) return fallback;

  // Remove caracteres de controle e nulos
  const cleaned = trimmed.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Bloqueia expressamente esquemas perigosos
  if (/^(javascript|vbscript|data|file):/i.test(cleaned)) {
    return fallback;
  }

  // Se já possui protocolo válido HTTP ou HTTPS
  if (/^https?:\/\//i.test(cleaned)) {
    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.href;
      }
    } catch {
      return fallback;
    }
  }

  // Se for um link de e-mail ou telefone legítimo
  if (/^mailto:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(cleaned)) {
    return cleaned;
  }
  if (/^tel:\+?[0-9()\s-]{6,}$/i.test(cleaned)) {
    return cleaned;
  }

  // Se for um domínio sem protocolo (ex: www.viamao.rs.gov.br ou instagram.com/...)
  if (/^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$/i.test(cleaned)) {
    return `https://${cleaned}`;
  }

  return fallback;
}

/**
 * Validador estrito para formulários de cadastro de URLs
 */
export function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  const trimmed = stringUrl.trim();
  if (trimmed.length < 4 || trimmed.length > 2000) return false;

  // Rejeita esquemas maliciosos
  if (/^(javascript|vbscript|data|file):/i.test(trimmed)) return false;

  try {
    const formatted = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(formatted);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.includes('.');
  } catch {
    return false;
  }
}

/**
 * Sanitiza textos de entrada de usuário para prevenir abusos de tamanho ou caracteres invisíveis
 */
export function sanitizeInputText(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle ASCII
    .slice(0, maxLength);
}
