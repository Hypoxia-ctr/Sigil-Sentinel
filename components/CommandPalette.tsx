import React, { useState, useEffect, useMemo, useRef } from 'react';

// Define the structure for a command
export interface Command {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

// Icons for the search input and command items
const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const EnterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 10l-5 5 5 5"></path><path d="M20 4v7a4 4 0 0 1-4 4H4"></path></svg>
);


export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredCommands = useMemo(() => {
    if (!searchTerm) return commands;
    const lowerCaseSearch = searchTerm.toLowerCase();

    const getScore = (cmd: Command) => {
      const title = cmd.title.toLowerCase();
      const category = cmd.category.toLowerCase();
      const keywords = (cmd.keywords || []).join(' ').toLowerCase();
      let score = 0;

      // Prioritize exact matches
      if (title === lowerCaseSearch) return 100;

      // Prioritize matches at the start of the title
      if (title.startsWith(lowerCaseSearch)) {
        score += 50;
      } else if (title.includes(lowerCaseSearch)) {
        score += 20;
      }

      if (keywords.includes(lowerCaseSearch)) {
        score += 10;
      }
      
      if (category.toLowerCase().startsWith(lowerCaseSearch)) {
          score += 5;
      } else if (category.includes(lowerCaseSearch)) {
          score += 2;
      }

      return score;
    };
    
    return commands
      .map(cmd => ({ ...cmd, score: getScore(cmd) }))
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);
      
  }, [searchTerm, commands]);

  // Reset search and active index when palette is opened/closed
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setActiveIndex(0);
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      const commandsLength = filteredCommands.length;
      if (commandsLength === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % commandsLength);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + commandsLength) % commandsLength);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          executeCommand(filteredCommands[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onClose]);

  // Scroll active item into view
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({
        block: 'nearest',
    });
  }, [activeIndex]);

  const executeCommand = (command: Command) => {
    command.action();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="command-palette" onClick={e => e.stopPropagation()}>
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a command or search..."
            className="command-palette-input"
            aria-label="Search for commands"
          />
        </div>

        <ul ref={listRef} className="command-palette-list" role="listbox">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, index) => (
              <li key={cmd.id} role="option" aria-selected={index === activeIndex}>
                <button
                  className={`command-palette-item ${index === activeIndex ? 'active' : ''}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-cyan-400">{cmd.icon}</span>
                    <div className="flex flex-col text-left">
                      <span className="text-gray-200">{cmd.title}</span>
                      <span className="text-xs text-gray-500">{cmd.category}</span>
                    </div>
                  </div>
                  {index === activeIndex && <EnterIcon className="h-4 w-4 text-gray-500" />}
                </button>
              </li>
            ))
          ) : (
            <li className="p-4 text-center text-gray-500">No results found.</li>
          )}
        </ul>
      </div>
    </div>
  );
};