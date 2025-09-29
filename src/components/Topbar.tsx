import React from 'react';
import { View } from '../types';
import { useSound } from '../hooks/useSound';

interface TopbarProps {
  title: string;
  onOpenCommandPalette: () => void;
  onChangeView: (view: View) => void;
  setView: (view: View) => void;
}

const Topbar: React.FC<TopbarProps> = ({ title, onOpenCommandPalette, onChangeView, setView }) => {
  const { playClick, playHover } = useSound();

  const handleQuickScan = () => {
    playClick();
    setView(View.THREAT_SCANNER);
  };
  
  return (
    <header className="flex-shrink-0 h-[65px] px-6 flex items-center justify-between border-b border-cyan-500/10 bg-black/10 backdrop-blur-sm">
      <h2 className="text-xl font-bold text-gray-200 tracking-wider">{title}</h2>
      <div className="flex items-center gap-2">
         <button 
            onClick={handleQuickScan} 
            onMouseEnter={playHover}
            className="btn ghost text-sm text-gray-400 hover:text-red-400"
            aria-label="Run a quick threat scan"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            <span>Quick Scan</span>
        </button>
        <button 
          onClick={onOpenCommandPalette} 
          className="btn ghost text-sm text-gray-400 hover:text-cyan-300"
          aria-label="Open command palette"
        >
          <span>Command Palette</span>
          <kbd className="ml-2 text-xs border border-gray-600 rounded-md px-1.5 py-0.5">⌘K</kbd>
        </button>
      </div>
    </header>
  );
};

export default Topbar;