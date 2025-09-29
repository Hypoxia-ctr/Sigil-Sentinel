import React from 'react';
import SigilMark, { SigilName } from '../common/SigilMark';
import { useTheme, Theme } from '../ThemeProvider';

const CheckCircle: React.FC<{small?: boolean}> = ({small}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={small ? "16" : "24"} height={small ? "16" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_3px_currentColor]">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const SIGIL_DETAILS: { name: SigilName; title: string; description: string }[] = [
    { name: 'warding', title: 'Aegis of Warding', description: 'A protective sigil that reinforces defensive boundaries.' },
    { name: 'divination', title: 'Eye of Divination', description: 'An all-seeing sigil that enhances clarity and foresight.' },
    { name: 'channeling', title: 'Rune of Channeling', description: 'A sigil that focuses and amplifies arcane energies.' },
    { name: 'elderTech', title: 'Elder-Tech Grid', description: 'A complex sigil that maps and analyzes arcane data flows.'},
    { name: 'draconic', title: 'Draconic Storm', description: 'Channels raw chaotic energies, offering immense power and insight.' }
];

const THEMES: { name: Theme; title: string }[] = [
    { name: 'dark', title: 'Default Dark' },
    { name: 'light', title: 'Light Arcane' },
    { name: 'arcane', title: 'Arcane Night' }
];

interface SigilLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSigil: (name: SigilName) => void;
  currentSigil: SigilName;
}

const SigilLibrary: React.FC<SigilLibraryProps> = ({ isOpen, onClose, onSelectSigil, currentSigil }) => {
  const { theme, setTheme } = useTheme();
  if (!isOpen) return null;

  return (
    <div className="sigil-library-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sigil-library" onClick={e => e.stopPropagation()}>
        <div className="sigil-library__header">
          <h2 className="text-2xl font-bold text-cyan-400">Sigil Library</h2>
          <p className="text-sm text-gray-400">Choose your active sigil to personalize the interface.</p>
        </div>
        <div className="sigil-library__grid">
          {SIGIL_DETAILS.map(sigil => (
            <button
              key={sigil.name}
              className={`sigil-library__card relative ${currentSigil === sigil.name ? 'active' : ''}`}
              onClick={() => {
                onSelectSigil(sigil.name);
              }}
              aria-pressed={currentSigil === sigil.name}
              aria-label={`Select ${sigil.title}`}
            >
              {currentSigil === sigil.name && <div className="absolute top-2 right-2 text-cyan-400"><CheckCircle /></div>}
              <SigilMark name={sigil.name} aria-hidden="true" className="animate-sigil-glow" />
              <h4>{sigil.title}</h4>
              <p>{sigil.description}</p>
            </button>
          ))}
        </div>
        <div className="sigil-library__header mt-6 border-t border-cyan-500/10 pt-4">
            <h2 className="text-2xl font-bold text-cyan-400">Interface Theme</h2>
            <p className="text-sm text-gray-400">Select a color scheme for the dashboard.</p>
        </div>
        <div className="sigil-library__theme-selector">
            {THEMES.map(t => (
                <button 
                    key={t.name}
                    className={`theme-card relative ${theme === t.name ? 'active' : ''}`}
                    onClick={() => setTheme(t.name)}
                    aria-pressed={theme === t.name}
                >
                    {theme === t.name && <div className="absolute top-1 right-1 text-cyan-400"><CheckCircle small /></div>}
                    <div className={`theme-preview theme-preview--${t.name}`}>
                        <span className="c1"></span><span className="c2"></span><span className="c3"></span><span className="c4"></span>
                    </div>
                    {t.title}
                </button>
            ))}
        </div>
        <p className="text-xs text-center text-gray-500 mt-4">Your selection is saved automatically.</p>
      </div>
    </div>
  );
};

export default SigilLibrary;