import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { View } from '../types';
import SigilMark, { SigilName } from './SigilMark';
import { useSound } from '../hooks/useSound';

interface Props {
  activeView: View;
  onChangeView: (view: View) => void;
  onOpenSigilLibrary: () => void;
  activeSigilName: SigilName;
}

const Navigation: React.FC<Props> = ({ activeView, onChangeView, onOpenSigilLibrary, activeSigilName }) => {
  const { playClick, playHover } = useSound();

  const handleNavClick = (view: View) => {
    playClick();
    onChangeView(view);
  };

  const handleSigilClick = () => {
    playClick();
    onOpenSigilLibrary();
  };

  return (
  <aside className="sidebar w-64 bg-black/50 backdrop-blur-sm border-r border-cyan-500/10 flex flex-col">
    <div className="text-center py-4 mb-4 group">
      <div className="relative mb-4">
        <div>
          <SigilMark 
            name={activeSigilName} 
            className="w-24 h-24 mx-auto text-fuchsia-400 transition-all duration-500 group-hover:scale-130 filter group-hover:drop-shadow-[0_0_28px_rgba(255,59,242,1)] animate-sigil-glow-mag" 
          />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-cyan-400 tracking-widest drop-shadow-[0_1px_2px_rgba(0,255,255,0.4)]">
        SIGIL
      </h1>
      <p className="text-xs text-fuchsia-400 tracking-[0.2em]">SENTINEL</p>
    </div>
    <nav className="flex flex-col space-y-2 flex-grow">
      {NAVIGATION_ITEMS.map(item => (
        <button
          key={item.view}
          onClick={() => handleNavClick(item.view)}
          onMouseEnter={playHover}
          className={`nav-item flex items-center space-x-4 rounded-lg text-left group ${
            activeView === item.view 
              ? 'active text-cyan-300' 
              : `text-gray-400 ${item.theme.hover}`
          }`}
        >
          <span className={`nav-icon transition-colors duration-300 ${activeView === item.view ? 'text-cyan-400' : `text-gray-500 ${item.theme.hover}`}`}>
            {item.icon}
          </span>
          <span className="font-medium tracking-wider">{item.label}</span>
        </button>
      ))}
    </nav>
    <div className="mt-auto">
        <button
          onClick={handleSigilClick}
          onMouseEnter={playHover}
          className="nav-item flex items-center justify-center space-x-3 w-full rounded-lg text-left text-gray-400 hover:text-cyan-300 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
          <span className="font-medium tracking-wider">Change Sigil</span>
        </button>
    </div>
  </aside>
  );
};

export default Navigation;