import React from 'react';

interface CultCircuitoLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact';
}

export const CultCircuitoLogo: React.FC<CultCircuitoLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
}) => {
  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* SVG Vector Logo with Exact Styling matching CultCircuito Viamão */}
      <svg
        viewBox="0 0 420 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heightClasses[size]} w-auto max-w-full drop-shadow-sm`}
        aria-label="Cult Circuito Viamão"
      >
        {/* "cult" in stylized expressive script */}
        <g fill="#FFFFFF">
          {/* Stylized 'cult' script lettering */}
          <path
            d="M52 38 C42 38 32 46 28 58 C24 70 28 84 38 88 C46 91 55 86 60 78 C62 75 58 72 55 75 C50 82 43 85 37 82 C30 79 27 67 31 56 C34 46 42 42 50 42 C56 42 62 46 65 51 C67 54 71 52 70 48 C66 42 59 38 52 38 Z"
          />
          <path
            d="M78 48 C76 56 75 66 75 75 C75 82 78 87 84 87 C91 87 96 80 98 72 C100 64 102 55 104 47 C105 44 101 43 100 46 C98 54 96 64 94 72 C93 78 89 82 85 82 C81 82 79 78 79 72 C80 64 81 55 83 47 C84 44 80 43 78 48 Z"
          />
          <path
            d="M112 18 C110 24 107 40 104 56 C101 72 98 83 99 87 C100 90 103 91 107 88 C110 86 109 81 106 83 C104 84 103 83 104 80 C105 76 108 64 111 48 C113 36 116 23 118 17 C119 14 114 13 112 18 Z"
          />
          <path
            d="M118 45 L138 43 C141 43 141 39 138 39 L120 41 C122 33 124 25 125 21 C126 18 122 17 120 20 C118 26 116 35 114 42 L108 43 C105 43 105 47 108 47 L113 46 C109 62 106 76 107 82 C108 88 114 89 119 86 C122 84 120 80 117 82 C114 84 112 83 111 79 C110 74 114 60 117 46 L134 44 C137 44 137 40 134 40 L118 41 Z"
          />
        </g>

        {/* "circuito" in bold geometric typography */}
        <g fill="#FFFFFF">
          <text
            x="148"
            y="82"
            fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif"
            fontSize="64"
            fontWeight="900"
            letterSpacing="-2px"
          >
            circuito
          </text>
        </g>

        {/* Radiant Multi-point Starburst (Sparkle) at the top-right of 'circuito' */}
        <g transform="translate(365, 34)">
          {/* Center core */}
          <circle cx="0" cy="0" r="3.5" fill="#FFFFFF" />
          
          {/* Main Long Rays */}
          <line x1="0" y1="-26" x2="0" y2="26" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
          <line x1="-26" y1="0" x2="26" y2="0" stroke="#FFFFFF" strokeWidth="2.8" strokeLinecap="round" />
          
          {/* Diagonal Long Rays */}
          <line x1="-18" y1="-18" x2="18" y2="18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="18" y1="-18" x2="-18" y2="18" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          
          {/* Intermediate Accent Rays */}
          <line x1="-9" y1="-22" x2="9" y2="22" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          <line x1="9" y1="-22" x2="-9" y2="22" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          <line x1="-22" y1="-9" x2="22" y2="9" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          <line x1="22" y1="-9" x2="-22" y2="9" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" />
          
          {/* Sparkle flare glow */}
          <polygon
            points="0,-16 3,-3 16,0 3,3 0,16 -3,3 -16,0 -3,-3"
            fill="#FFFFFF"
          />
        </g>

        {/* Subtitle "VIAMÃO" with wide tracking */}
        <text
          x="285"
          y="112"
          fontFamily="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif"
          fontSize="24"
          fontWeight="800"
          letterSpacing="12px"
          fill="#FFFFFF"
          textAnchor="middle"
        >
          VIAMÃO
        </text>
      </svg>
    </div>
  );
};
