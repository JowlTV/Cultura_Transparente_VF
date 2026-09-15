import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { validateCNPJ, OFFICIAL_VIAMAO_CNPJ } from '../utils/institutionalValidation';

interface InstitutionalValidationBadgeProps {
  cnpj?: string | null;
  enteNome?: string;
  showDetails?: boolean;
}

export const InstitutionalValidationBadge: React.FC<InstitutionalValidationBadgeProps> = ({
  cnpj,
  enteNome = 'Município de Viamão',
  showDetails = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(showDetails);
  const result = validateCNPJ(cnpj);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!result.isValid) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFE8E0] border border-[#FFC2B2] text-[#FF4500] rounded-full text-xs font-bold shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FF4500] shrink-0" />
            <span>Dado inconsistente ou pendente de retificação</span>
          </div>

          <span className="text-xs font-mono text-[#2D0652]/50 line-through">
            {result.raw || 'Dado não informado'}
          </span>

          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            {result.displayValue}
          </span>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-[#FF4500] hover:text-[#E03D00] underline font-bold flex items-center gap-0.5 cursor-pointer"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar auditoria' : 'Ver alerta de inconsistência'}
          </button>
        </div>

        {expanded && (
          <div className="p-4 bg-white border border-[#FFC2B2] rounded-2xl text-xs text-[#2D0652] space-y-2 shadow-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#FF4500] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#FF4500]">
                  Aviso Crítico de Auditoria Cadastral (Receita Federal)
                </p>
                <p className="text-[#2D0652]/80 text-xs mt-0.5 leading-relaxed font-medium">
                  {result.inconsistencyReason || 'Identificador matematicamente incorreto perante o algoritmo de dígitos verificadores (Módulo 11).'}{' '}
                  O sistema tem a proibição estrita de veicular dados divergentes ou inconsistentes de fontes públicas como se fossem verídicos.
                </p>
              </div>
            </div>

            <div className="bg-[#FAF4EB] p-3 rounded-xl border border-[#E2D2BC] flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs text-[#2D0652]/70 block font-medium">
                  CNPJ Oficial e Homologado do {enteNome}:
                </span>
                <span className="font-mono font-bold text-[#2D0652] text-xs">
                  {OFFICIAL_VIAMAO_CNPJ}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(OFFICIAL_VIAMAO_CNPJ)}
                className="flex items-center gap-1 px-3 py-1 bg-[#FF4500] hover:bg-[#E03D00] text-white rounded-full font-bold text-xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copiado!' : 'Copiar CNPJ Oficial'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E3F7E8] border border-[#B7ECC3] text-[#166534] rounded-full text-xs font-bold shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-[#166534] shrink-0" />
        <span className="font-mono">{result.formatted}</span>
      </div>

      <span className="text-xs font-bold text-[#166534] bg-[#E3F7E8] px-2.5 py-0.5 rounded-full border border-[#B7ECC3]">
        ✓ Validado na Receita Federal
      </span>

      <button
        type="button"
        onClick={() => handleCopy(result.formatted)}
        className="flex items-center gap-1 px-2.5 py-0.5 bg-white hover:bg-[#FAF4EB] text-[#2D0652] rounded-full text-xs font-bold border border-[#E2D2BC] transition-colors cursor-pointer"
        title="Copiar CNPJ"
      >
        {copied ? <Check className="w-3 h-3 text-[#166534]" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
};
