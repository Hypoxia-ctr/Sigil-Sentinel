import React from 'react';
import { AuditQueueItem } from '../../types';
import SeveritySigil from '../SeveritySigil';
import { useSound } from '../../hooks/useSound';

interface AuditQueueViewProps {
  items: AuditQueueItem[];
  onRemove: (timestamp: number) => void;
  onClear: () => void;
}

const AuditQueueView: React.FC<AuditQueueViewProps> = ({ items, onRemove, onClear }) => {
    const { playClick, playHover } = useSound();

    const handleClear = () => {
        if (window.confirm('Are you sure you want to clear the entire audit queue? This cannot be undone.')) {
            playClick();
            onClear();
        }
    };
    
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-amber-400 drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]">Audit Queue</h1>
        <button onClick={handleClear} onMouseEnter={playHover} className="btn ghost" disabled={items.length === 0}>
          Clear All
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-16">The audit queue is empty.</div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.timestamp} className="card-widget card-ornamented flex items-center justify-between p-3 animate-fade-in">
              <div className="flex items-center gap-4">
                <SeveritySigil severity={item.severity} />
                <div>
                  <p className="font-semibold text-gray-200">{item.title}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500">{new Date(item.timestamp).toLocaleString()}</span>
                <button onClick={() => onRemove(item.timestamp)} onMouseEnter={playHover} className="btn ghost text-xs text-red-400 hover:bg-red-500/10 hover:border-red-500/30">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditQueueView;
