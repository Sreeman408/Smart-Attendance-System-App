import React from 'react';

interface UniversityLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'color';
  showText?: boolean;
}

export const UniversityLogo: React.FC<UniversityLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'color',
  showText = false
}) => {
  const dimMap = {
    sm: { w: 32, h: 32, font: 'text-xs' },
    md: { w: 44, h: 44, font: 'text-sm' },
    lg: { w: 64, h: 64, font: 'text-lg' },
    xl: { w: 88, h: 88, font: 'text-2xl' }
  };

  const { w, h, font } = dimMap[size];

  // Primary Crimson: #800020, Accent Gold: #D4AF37
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105 filter drop-shadow-md"
      >
        {/* Outer Circular Shield Border */}
        <circle cx="50" cy="50" r="46" stroke="#D4AF37" strokeWidth="4" fill="#800020" />
        <circle cx="50" cy="50" r="41" stroke="#FEF08A" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.6" />
        
        {/* Inner Embellished University Temple Pillars / Crown Crest */}
        <path
          d="M 50 15 L 68 32 L 60 32 L 60 62 L 68 62 L 68 68 L 32 68 L 32 62 L 40 62 L 40 32 L 32 32 Z"
          fill="#D4AF37"
          stroke="#FFF"
          strokeWidth="1"
        />

        {/* Central Book of Wisdom Symbol */}
        <path
          d="M 35 50 Q 50 42 65 50 L 65 60 Q 50 52 35 60 Z"
          fill="#FFFFFF"
          stroke="#D4AF37"
          strokeWidth="1.5"
        />
        <line x1="50" y1="46" x2="50" y2="56" stroke="#800020" strokeWidth="1.5" />

        {/* Torch of Enlightenment Flame */}
        <path
          d="M 50 20 Q 54 27 50 33 Q 46 27 50 20 Z"
          fill="#F59E0B"
        />
        <path
          d="M 50 23 Q 52 27 50 30 Q 48 27 50 23 Z"
          fill="#FEF08A"
        />

        {/* Star Accents */}
        <polygon points="25,50 27,53 30,53 28,55 29,58 25,56 21,58 22,55 20,53 23,53" fill="#D4AF37" />
        <polygon points="75,50 77,53 80,53 78,55 79,58 75,56 71,58 72,55 70,53 73,53" fill="#D4AF37" />

        {/* Bottom Banner Scroll */}
        <path
          d="M 22 75 Q 50 84 78 75 L 75 83 Q 50 90 25 83 Z"
          fill="#D4AF37"
        />
        <text
          x="50"
          y="81"
          fontSize="6.5"
          fontWeight="bold"
          fill="#800020"
          textAnchor="middle"
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          SMART ATTENDANCE
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <span className={`font-bold tracking-tight text-slate-900 dark:text-white ${font}`}>
            Smart CMS Portal
          </span>
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
            College Attendance Gateway
          </span>
        </div>
      )}
    </div>
  );
};
