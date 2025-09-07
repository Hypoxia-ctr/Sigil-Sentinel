import React from 'react';
import SigilMark, { SigilName } from './SigilMark';

const SIGIL_DETAILS: { name: SigilName; title: string; description: string }[] = [
    { name: 'warding', title: 'Aegis of Warding', description: 'A protective sigil that reinforces defensive boundaries.' },
    { name: 'divination', title: 'Eye of Divination', description: 'An all-seeing sigil that enhances clarity and foresight.' },
    { name: 'channeling', title: 'Rune of Channeling', description: 'A sigil that focuses and amplifies arcane energies.' },
    { name: 'elderTech', title: 'Elder-Tech Grid', description: 'A complex sigil that maps and analyzes arcane data flows.'},
    { name: 'draconic', title: 'Draconic Storm', description: 'Channels raw chaotic energies, offering immense power and insight.' }
];

interface SigilLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSigil: (name: SigilName) => void;
  currentSigil: SigilName;
}

const SigilLibrary: React.FC<SigilLibraryProps> = ({ isOpen, onClose, onSelectSigil, currentSigil }) => {
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
              className={`sigil-library__card ${currentSigil === sigil.name ? 'active' : ''}`}
              onClick={() => {
                onSelectSigil(sigil.name);
                onClose();
              }}
              aria-pressed={currentSigil === sigil.name}
              aria-label={`Select ${sigil.title}`}
            >
              <SigilMark name={sigil.name} aria-hidden="true" className="animate-sigil-glow" />
              <h4>{sigil.title}</h4>
              <p>{sigil.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SigilLibrary;