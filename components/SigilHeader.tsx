import React from "react";

const SigilElderTechComponent: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" {...props}>
    <defs>
      <radialGradient id="g" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#44f1ff"/><stop offset="100%" stopColor="#7af9ff" stopOpacity=".2"/>
      </radialGradient>
    </defs>
    <circle cx="100" cy="100" r="82" fill="none" stroke="#44f1ff" strokeWidth="2" opacity=".55"/>
    <polygon points="100,28 164,100 100,172 36,100" fill="none" stroke="#ff3bf2" strokeWidth="2" opacity=".6"/>
    <circle cx="100" cy="100" r="6" fill="url(#g)">
      <animate attributeName="r" values="5;7;5" dur="3s" repeatCount="indefinite"/>
    </circle>
    <g opacity=".7" stroke="#44f1ff" strokeWidth="1">
      <path d="M100 18 v12 M100 170 v12 M18 100 h12 M170 100 h12"/>
    </g>
  </svg>
);


export default function SigilHeader(){
  return (
    // FIX: Casted style object to React.CSSProperties to allow for CSS custom properties.
    <div className="bg-grid group relative overflow-hidden p-6 md:p-10 hx-glow-border" style={{ '--glow-color': 'var(--mag)' } as React.CSSProperties}>
      <div className="absolute -top-12 -right-8 opacity-60 rotate-12 w-56 md:w-72 glow-mag animate-rotate-very-slow animate-sigil-glow-mag transition-transform duration-300 group-hover:scale-115">
        <SigilElderTechComponent/>
      </div>
      <h1 className="text-3xl md:text-5xl font-black tracking-widest uppercase">
        <span className="title-gradient">SIGIL</span> <span className="text-cyan-200">SENTINEL</span>
      </h1>
      <div className="mt-2 text-cyan-100/80">Core Interface ▸ Watchers • Oracles • Hardening</div>
      <div className="relative mt-6 h-1.5 rounded-full bg-cyan-200/10 overflow-hidden">
        <span className="absolute inset-y-0 left-0 w-1/3 bg-cyan-200/60 blur-sm animate-[glitch_3s_linear_infinite]"/>
      </div>
    </div>
  );
}