import React, { useState, useEffect } from 'react';

const NetworkMap: React.FC = () => {
    const [threatNode, setThreatNode] = useState<number | null>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            // Randomly select a node to be a threat, or clear the threat
            const newThreat = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : null;
            setThreatNode(newThreat);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const center = { x: 100, y: 55 };
    const radius = 40;
    const nodes = Array.from({ length: 5 }).map((_, i) => {
        const angle = (i / 5) * 2 * Math.PI;
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        };
    });

    return (
        <div className="netmap" role="img" aria-label="Network map visualization">
            <svg viewBox="0 0 200 110" className="w-full h-full">
                <defs>
                    <radialGradient id="center-glow">
                        <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="node-glow">
                        <stop offset="0%" stopColor="var(--lime)" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="var(--lime)" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="threat-glow-grad">
                        <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.7" />
                        <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
                    </radialGradient>
                </defs>

                {/* Connections */}
                {nodes.map((node, i) => (
                    <g key={`conn-${i}`}>
                        <line x1={center.x} y1={center.y} x2={node.x} y2={node.y} stroke="rgba(0, 255, 249, 0.1)" strokeWidth="1" />
                        <line className="network-beam" x1={center.x} y1={center.y} x2={node.x} y2={node.y} stroke={threatNode === i ? "var(--danger)" : "var(--cyan)"} strokeWidth="1.5" />
                    </g>
                ))}

                {/* Central Node */}
                <g className="network-node">
                    <circle cx={center.x} cy={center.y} r="12" fill="url(#center-glow)" />
                    <circle cx={center.x} cy={center.y} r="6" fill="var(--cyan)" stroke="black" strokeWidth="1" />
                </g>

                {/* Satellite Nodes */}
                {nodes.map((node, i) => (
                    <g key={`node-${i}`} className={threatNode === i ? 'network-threat' : 'network-node'}>
                        <circle cx={node.x} cy={node.y} r="8" fill={threatNode === i ? "url(#threat-glow-grad)" : "url(#node-glow)"} />
                        <circle cx={node.x} cy={node.y} r="3" fill={threatNode === i ? "var(--danger)" : "var(--lime)"} />
                    </g>
                ))}
            </svg>
        </div>
    );
};

export default NetworkMap;