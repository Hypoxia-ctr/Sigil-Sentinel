import React from 'react';

interface TopbarProps {
  title: string;
  onOpenCommandPalette: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ title, onOpenCommandPalette }) => {
  return (
    <header className="flex-shrink-0 h-[65px] px-6 flex items-center justify-between border-b border-cyan-500/10 bg-black/10 backdrop-blur-sm">
      <h2 className="text-xl font-bold text-gray-200 tracking-wider">{title}</h2>
      <button 
        onClick={onOpenCommandPalette} 
        className="btn ghost text-sm text-gray-400 hover:text-cyan-300"
        aria-label="Open command palette"
      >
        <span>Command Palette</span>
        <kbd className="ml-2 text-xs border border-gray-600 rounded-md px-1.5 py-0.5">⌘K</kbd>
      </button>
    </header>
  );
};

export default Topbar;
