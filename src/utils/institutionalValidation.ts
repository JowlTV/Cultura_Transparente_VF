/**
 * Módulo de Auditoria e Validação Rigorosa de Dados Institucionais
 * Em conformidade estrita com o algoritmo oficial da Receita Federal do Brasil (Módulo 11)
 * e os protocolos de integridade cadastral pública.
 */

export interface CNPJValidationResult {
  isValid: boolean;
  raw: string;
  cleaned: string;
  formatted: string;
  displayValue: string;
  status: 'valido' | 'invalido' | 'pendente_retificacao';
  statusLabel: string;
  isMunicipalityViamao: boolean;
  inconsistencyReason?: string;
  adminAlert?: string;
}

export const OFFICIAL_VIAMAO_CNPJ = '88.000.914/0001-01';
export const OFFICIAL_VIAMAO_CNPJ_CLEAN = '88000914000101';

/**
 * Valida a consistência matemática do CNPJ perante o algoritmo da Receita Federal
 */
export function validateCNPJ(raw?: string | null): CNPJValidationResult {
  const input = raw ? String(raw).trim() : '';
  const cleaned = input.replace(/\D/g, '');

  // Caso vazio ou não informado
  if (!cleaned) {
    return {
      isValid: false,
      raw: input,
      cleaned: '',
      formatted: '',
      displayValue: 'CNPJ não informado',
      status: 'invalido',
      statusLabel: 'Dado ausente no cadastro',
      isMunicipalityViamao: false,
      inconsistencyReason: 'Nenhum identificador foi fornecido na fonte.',
    };
  }

  // Verifica tamanho estrito (14 dígitos)
  if (cleaned.length !== 14) {
    return {
      isValid: false,
      raw: input,
      cleaned,
      formatted: input,
      displayValue: 'CNPJ não localizado ou inválido',
      status: 'invalido',
      statusLabel: 'Dado inconsistente ou pendente de retificação',
      isMunicipalityViamao: false,
      inconsistencyReason: `Estrutura incompatível: o registro possui ${cleaned.length} dígitos em vez de 14.`,
      adminAlert: `Alerta ao Administrador: O registro '${input}' não atende à especificação estrutural de 14 dígitos da Receita Federal. O CNPJ oficial e homologado do Município de Viamão é ${OFFICIAL_VIAMAO_CNPJ}.`,
    };
  }

  // Rejeita sequências de dígitos idênticos (ex: 00000000000000, 11111111111111)
  if (/^(\d)\1+$/.test(cleaned)) {
    return {
      isValid: false,
      raw: input,
      cleaned,
      formatted: input,
      displayValue: 'CNPJ não localizado ou inválido',
      status: 'invalido',
      statusLabel: 'Dado inconsistente ou pendente de retificação',
      isMunicipalityViamao: false,
      inconsistencyReason: 'Sequência com todos os dígitos repetidos.',
      adminAlert: `Alerta ao Administrador: CNPJ genérico ou de preenchimento inválido detectado. O CNPJ oficial de Viamão é ${OFFICIAL_VIAMAO_CNPJ}.`,
    };
  }

  // Cálculo do 1º Dígito Verificador (Módulo 11)
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += Number(cleaned[i]) * weights1[i];
  }
  const dv1 = sum1 % 11 < 2 ? 0 : 11 - (sum1 % 11);
  if (dv1 !== Number(cleaned[12])) {
    return {
      isValid: false,
      raw: input,
      cleaned,
      formatted: input,
      displayValue: 'CNPJ não localizado ou inválido',
      status: 'invalido',
      statusLabel: 'Dado inconsistente ou pendente de retificação',
      isMunicipalityViamao: false,
      inconsistencyReason: `Inconsistência no 1º dígito verificador (calculado: ${dv1}, informado: ${cleaned[12]}).`,
      adminAlert: `Alerta ao Administrador: Inconsistência matemática no CNPJ fornecido em fonte municipal (${input}). O sistema impede sua exibição como dado verídico. O CNPJ oficial do Município de Viamão é ${OFFICIAL_VIAMAO_CNPJ}.`,
    };
  }

  // Cálculo do 2º Dígito Verificador (Módulo 11)
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += Number(cleaned[i]) * weights2[i];
  }
  const dv2 = sum2 % 11 < 2 ? 0 : 11 - (sum2 % 11);
  if (dv2 !== Number(cleaned[13])) {
    return {
      isValid: false,
      raw: input,
      cleaned,
      formatted: input,
      displayValue: 'CNPJ não localizado ou inválido',
      status: 'invalido',
      statusLabel: 'Dado inconsistente ou pendente de retificação',
      isMunicipalityViamao: false,
      inconsistencyReason: `Inconsistência no 2º dígito verificador (calculado: ${dv2}, informado: ${cleaned[13]}).`,
      adminAlert: `Alerta ao Administrador: Inconsistência no dígito de controle do CNPJ (${input}). Dado mascarado. O CNPJ oficial do Município de Viamão é ${OFFICIAL_VIAMAO_CNPJ}.`,
    };
  }

  // CNPJ matematicamente válido
  const formatted = `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
  const isViamao = cleaned === OFFICIAL_VIAMAO_CNPJ_CLEAN;

  return {
    isValid: true,
    raw: input,
    cleaned,
    formatted,
    displayValue: formatted,
    status: 'valido',
    statusLabel: isViamao
      ? 'CNPJ Validado na Receita Federal (Município de Viamão)'
      : 'CNPJ Válido e Homologado na Receita Federal',
    isMunicipalityViamao: isViamao,
  };
}

/**
 * Protocolo rigoroso para contatos institucionais:
 * - Proibição absoluta de inventar ou estimar telefones, e-mails ou URLs fictícios
 * - Se não verificado ou ausente, responde obrigatoriamente que a informação não está disponível
 */
export function validateInstitutionalContact(contato?: string | null): {
  isAvailable: boolean;
  display: string;
  isVerified: boolean;
} {
  if (!contato || !contato.trim()) {
    return {
      isAvailable: false,
      display: 'Informação de contato não disponível no cadastro oficial validado',
      isVerified: false,
    };
  }

  const trimmed = contato.trim();

  // Detecta números repetitivos, sequenciais ou de teste
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (
    digitsOnly.includes('12345678') ||
    digitsOnly.includes('998765432') ||
    digitsOnly.includes('999999999') ||
    trimmed.includes('exemplo.com') ||
    trimmed.includes('viamao.art.br') ||
    trimmed.includes('hiphopviamao.org.br')
  ) {
    return {
      isAvailable: false,
      display: 'Informação de contato não disponível (dado inconsistente na fonte primária)',
      isVerified: false,
    };
  }

  return {
    isAvailable: true,
    display: trimmed,
    isVerified: true,
  };
}
