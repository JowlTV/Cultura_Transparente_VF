import React from 'react';
import { Landmark, ShieldCheck } from 'lucide-react';
import { CultCircuitoLogo } from './CultCircuitoLogo';

export const Footer: React.FC = () => {
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  return (
    <footer className="mt-12 bg-[#0c0517] text-slate-400 text-xs border-t border-purple-900/40">
      {/* Brand color ribbon at top of footer */}
      <div className="h-1.5 w-full flex">
        <div className="h-full w-1/4 bg-[#6A0DAD]"></div>
        <div className="h-full w-1/4 bg-[#FF4500]"></div>
        <div className="h-full w-1/4 bg-white/20"></div>
        <div className="h-full w-1/4 bg-[#6A0DAD]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-purple-900/30">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2 text-white font-bold text-sm font-['Outfit']">
              <span>Cultura Transparente • Viamão</span>
              <span className="text-xs text-purple-200 bg-[#6A0DAD]/30 px-2 py-0.5 rounded border border-[#6A0DAD]/50">
                Transparência e Controle Social
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Plataforma cívica e não-partidária de transparência orçamentária e acompanhamento contínuo de investimentos culturais no município de Viamão / RS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-[#150b24] p-3 rounded-xl border border-purple-900/40 space-y-1">
              <span className="text-purple-300 block text-[11px] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                CNPJ Validado da Prefeitura de Viamão:
              </span>
              <code className="text-emerald-300 font-mono font-bold text-xs block">88.000.914/0001-01</code>
            </div>

            <div className="bg-[#150b24] px-4 py-3 rounded-xl border border-purple-900/40 flex items-center justify-center">
              <CultCircuitoLogo size="md" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            Desenvolvido em conformidade estrita com a <strong>Lei de Acesso à Informação (Lei nº 12.527/2011)</strong> e a <strong>Lei da Transparência (LC nº 131/2009)</strong>.
          </div>
          <div>
            Base sincronizada com as APIs públicas do Portal da Transparência da CGU, Transferegov e ALRS em {dataHoje}.
          </div>
        </div>
      </div>
    </footer>
  );
};
