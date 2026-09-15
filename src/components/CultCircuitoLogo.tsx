import React from 'react';
import logoColorSrc from '../assets/cultcircuito-logo-color.png';

export interface CultCircuitoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'color' | 'white';
  showLockup?: boolean;
  lockupTheme?: 'dark' | 'light';
}

export const CultCircuitoLogo: React.FC<CultCircuitoLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'color',
  showLockup = false,
  lockupTheme = 'dark',
}) => {
  // Calibrated size classes to ensure width is NEVER below 120px for legibility of "Viamão"
  const sizeClasses = {
    sm: 'w-[120px] min-w-[120px]',
    md: 'w-[150px] min-w-[140px]',
    lg: 'w-[190px] min-w-[160px]',
    xl: 'w-[240px] min-w-[200px]',
  };

  const imageFilterStyle: React.CSSProperties =
    variant === 'white'
      ? { filter: 'brightness(0) invert(1)' }
      : {};

  return (
    <div
      className={`inline-flex items-center gap-3 select-none p-1.5 ${className}`}
      aria-label="Cult Circuito Viamão"
    >
      <div className={`${sizeClasses[size]} shrink-0 transition-transform duration-200`}>
        <img
          src={logoColorSrc}
          alt="Cult Circuito Viamão - Logomarca Oficial"
          style={imageFilterStyle}
          className="w-full h-auto object-contain block drop-shadow-2xs"
          referrerPolicy="no-referrer"
          loading="eager"
        />
      </div>

      {showLockup && (
        <div className="flex items-center gap-3 pl-1 shrink-0">
          {/* Vertical Divider Line */}
          <div
            className={`w-[1.5px] h-8 self-center rounded-full ${
              lockupTheme === 'dark' ? 'bg-purple-300/40' : 'bg-[#2D0652]/30'
            }`}
            aria-hidden="true"
          />

          {/* Signature Lockup Text: "Cultura" & "Transparente" */}
          <div className="flex flex-col leading-tight">
            <span
              className={`text-xs font-black tracking-wider uppercase ${
                lockupTheme === 'dark' ? 'text-white' : 'text-[#2D0652]'
              }`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Cultura
            </span>
            <span
              className={`text-[11px] font-extrabold tracking-wide uppercase ${
                lockupTheme === 'dark' ? 'text-[#FF4500]' : 'text-[#6A0DAD]'
              }`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Transparente
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
