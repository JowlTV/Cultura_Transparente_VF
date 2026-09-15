import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { CultCircuitoLogo } from './CultCircuitoLogo';

export const Footer: React.FC = () => {
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  return (
    <footer className="mt-12 bg-[#2D0652] text-purple-200 text-xs border-t border-[#3D0B6D]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#3D0B6D]">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2 text-white font-bold text-base" style={{ fontFamily: 'var(--font-display)' }}>
              <span>Cult Circuito Viamão</span>
              <span className="text-[11px] text-white bg-[#6A0DAD] px-2.5 py-0.5 rounded-full border border-purple-400/30">
                Cultura Transparente
              </span>
            </div>
            <p className="text-purple-200/80 text-xs leading-relaxed">
              Plataforma cívica e independente de transparência orçamentária, editais e acompanhamento contínuo de investimentos culturais no município de Viamão / RS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="bg-[#21043D] p-3.5 rounded-2xl border border-[#3D0B6D] space-y-1">
              <span className="text-purple-300 block text-[11px] flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                CNPJ da Prefeitura Municipal de Viamão:
              </span>
              <code className="text-emerald-300 font-mono font-bold text-xs block">88.000.914/0001-01</code>
            </div>

            <div className="p-1">
              <CultCircuitoLogo size="lg" variant="white" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-300/70 text-[11px]">
          <div>
            Desenvolvido em conformidade com a <strong>Lei de Acesso à Informação (Lei nº 12.527/2011)</strong> e a <strong>Lei da Transparência (LC nº 131/2009)</strong>.
          </div>
          <div>
            Dados auditados e sincronizados com CGU, Transferegov, ALRS e fontes municipais em {dataHoje}.
          </div>
        </div>
      </div>
    </footer>
  );
};
