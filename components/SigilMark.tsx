import React from 'react';

export type SigilName = 'warding' | 'divination' | 'channeling' | 'elderTech' | 'draconic';

const SigilWarding: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={`animate-rotate-very-slow transition-all duration-300 ${className || ''}`} {...props}>
    <g className="ring-outer">
      <path d="M50 2 L98 50 L50 98 L2 50 Z" strokeWidth="1" opacity="0.4" />
      <path d="M50 10 L90 50 L50 90 L10 50 Z" strokeWidth="2" />
    </g>
    <g className="ring-core">
      <circle cx="50" cy="50" r="32" strokeWidth="1" />
      <path d="M50 25 L75 50 L50 75 L25 50 Z" strokeWidth="1.5" />
    </g>
    <path d="M50 18 V 82 M 18 50 H 82" strokeWidth="1" strokeDasharray="4 4" className="ringpath" />
    <g className="glyph">
      <circle cx="50" cy="50" r="5" strokeWidth="2" fill="currentColor" className="core-dot"/>
    </g>
  </svg>
);

const SigilDivination: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={`animate-rotate-very-slow transition-all duration-300 ${className || ''}`} {...props}>
    <circle cx="50" cy="50" r="48" strokeWidth="1" opacity="0.4" className="ring-outer" />
    <circle cx="50" cy="50" r="40" strokeWidth="1.5" className="ring-mid" />
    <path d="M50 10 a 40 40 0 0 1 0 80" strokeWidth="2" />
    <path d="M50 10 a 40 40 0 0 0 0 80" strokeWidth="0.5" strokeDasharray="5 5" className="ringpath" />
    <circle cx="50" cy="50" r="18" strokeWidth="1" className="ring-core" />
    <circle cx="50" cy="50" r="12" strokeWidth="1.5" />
    <g className="glyph">
      <circle cx="50" cy="50" r="3" fill="currentColor" className="core-dot" />
    </g>
  </svg>
);

const SigilChanneling: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={`animate-rotate-very-slow transition-all duration-300 ${className || ''}`} {...props}>
    <g className="ring-outer">
      <path d="M50 2 L85.3 25 V 75 L50 98 L14.7 75 V 25 Z" strokeWidth="1" opacity="0.4" />
    </g>
    <g className="ring-mid">
       <path d="M50 10 L78.3 29 V 71 L50 90 L21.7 71 V 29 Z" strokeWidth="2" />
    </g>
    <path d="M50 2 L 50 18 M 50 98 V 82" strokeWidth="1.5" />
    <path d="M14.7 25 L 26.7 32 M 85.3 25 L 73.3 32" strokeWidth="1.5" />
    <path d="M14.7 75 L 26.7 68 M 85.3 75 L 73.3 68" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="15" strokeWidth="1.5" strokeDasharray="6 3" className="ring-core ringpath" />
    <g className="glyph">
      <path d="M50 35 L 63 43 L 56.5 57.5 H 43.5 L 37 43 Z" strokeWidth="1.5" className="core-dot" />
    </g>
  </svg>
);

const SigilElderTech: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
  <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={`animate-rotate-very-slow transition-all duration-300 ${className || ''}`} {...props}>
    <g className="ring-outer">
      <circle cx="50" cy="50" r="41" strokeWidth="2" opacity=".55"/>
      <polygon points="50,14 83,50 50,86 17,50" strokeWidth="2" opacity=".6" stroke="var(--mag)"/>
    </g>
    <g className="glyph">
       <circle cx="50" cy="50" r="3" className="core-dot"/>
    </g>
    <g opacity=".7" strokeWidth="1">
      <path d="M50 9 V 21 M50 91 V 79 M9 50 H 21 M91 50 H 79"/>
    </g>
  </svg>
);

const SigilDraconic: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className={`animate-rotate-very-slow transition-all duration-300 ${className || ''}`} {...props}>
        {/* Outer rotating elements - sharp, draconic */}
        <g className="ring-outer">
            <path d="M 50,6 L 65,22 L 94,30 L 78,50 L 94,70 L 65,78 L 50,94 L 35,78 L 6,70 L 22,50 L 6,30 L 35,22 Z" strokeWidth="1" opacity="0.5" />
        </g>
        
        {/* Inner counter-rotating chaos */}
        <g className="ring-mid">
            <path d="M 50,18 L 72,35 L 65,65 L 35,65 L 28,35 Z" strokeWidth="1.5" opacity="0.8" />
        </g>
        
        {/* Static relative to parent rotation, with pulsing lightning */}
        <g className="glyph">
            <g className="animate-storm-flash">
                <path d="M 50,30 L 42,50 L 50,52 L 48,70" />
                <path d="M 50,30 L 58,50 L 50,52 L 52,70" />
                <path d="M 35,38 L 50,50 L 30,60" />
                <path d="M 65,38 L 50,50 L 70,60" />
            </g>
            {/* Dragon's Eye */}
            <path d="M 40,50 C 42,45 58,45 60,50 C 58,55 42,55 40,50 Z" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="1.5" fill="currentColor" className="core-dot"/>
        </g>
    </svg>
);


const SIGILS: Record<SigilName, React.FC<React.SVGProps<SVGSVGElement>>> = {
    warding: SigilWarding,
    divination: SigilDivination,
    channeling: SigilChanneling,
    elderTech: SigilElderTech,
    draconic: SigilDraconic,
};

interface SigilMarkProps extends React.SVGProps<SVGSVGElement> {
    name: SigilName;
    className?: string;
}

const SigilMark: React.FC<SigilMarkProps> = ({ name, className, ...rest }) => {
    const SigilComponent = SIGILS[name] || SigilWarding;
    return <SigilComponent className={`sigil-mark ${className || ''}`} {...rest} />;
};

export default SigilMark;