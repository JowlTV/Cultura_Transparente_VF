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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Dado inconsistente ou pendente de retificação</span>
          </div>

          <span className="text-xs font-mono text-slate-500 line-through">
            {result.raw || 'Dado não informado'}
          </span>

          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            {result.displayValue}
          </span>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-amber-800 hover:text-amber-950 underline font-medium flex items-center gap-0.5"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar auditoria' : 'Ver alerta de inconsistência'}
          </button>
        </div>

        {expanded && (
          <div className="p-3.5 bg-amber-50/90 border-l-4 border-l-amber-600 border border-amber-200 rounded-xl text-xs text-amber-950 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Aviso Crítico de Auditoria Cadastral (Receita Federal)
                </p>
                <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                  {result.inconsistencyReason || 'Identificador matematicamente incorreto perante o algoritmo de dígitos verificadores (Módulo 11).'}{' '}
                  O sistema tem a proibição estrita de veicular dados divergentes ou inconsistentes de fontes públicas como se fossem verídicos.
                </p>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] text-slate-500 block font-medium">
                  CNPJ Oficial e Homologado do {enteNome}:
                </span>
                <span className="font-mono font-bold text-slate-900 text-xs">
                  {OFFICIAL_VIAMAO_CNPJ}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(OFFICIAL_VIAMAO_CNPJ)}
                className="flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[11px] transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
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
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold shadow-2xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="font-mono">{result.formatted}</span>
      </div>

      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200">
        ✓ Validado na Receita Federal
      </span>

      <button
        type="button"
        onClick={() => handleCopy(result.formatted)}
        className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-medium transition-colors"
        title="Copiar CNPJ"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
        <span>{copied ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
};
