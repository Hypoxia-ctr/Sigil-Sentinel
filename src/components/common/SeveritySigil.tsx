import React from 'react';
import { Severity } from '../../types';

interface SeveritySigilProps extends React.SVGProps<SVGSVGElement> {
    severity: Severity;
}

const SeveritySigil: React.FC<SeveritySigilProps> = ({ severity, className, ...props }) => {
    const baseClasses = "w-4 h-4 severity-sigil";

    const sigilMap: Record<Severity, React.ReactNode> = {
        low: (
            <svg viewBox="0 0 16 16" className={`${baseClasses} text-lime severity-sigil-low ${className || ''}`} {...props}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
        ),
        medium: (
            <svg viewBox="0 0 16 16" className={`${baseClasses} text-amber severity-sigil-medium ${className || ''}`} {...props}>
                <path d="M8 2 L14 14 L2 14 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
        ),
        high: (
            <svg viewBox="0 0 16 16" className={`${baseClasses} text-mag severity-sigil-high ${className || ''}`} {...props}>
                 <path d="M8 1 L15 8 L8 15 L1 8 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
        ),
        critical: (
            <svg viewBox="0 0 16 16" className={`${baseClasses} text-red severity-sigil-critical animate-pulse ${className || ''}`} {...props}>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.3" />
            </svg>
        ),
    };

    return sigilMap[severity] || null;
};

export default SeveritySigil;