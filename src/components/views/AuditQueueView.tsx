import React, { useState, useMemo } from 'react';
import { AuditQueueItem, Severity } from '../../types';
import SeveritySigil from '../common/SeveritySigil';
import { useSound } from '../../hooks/useSound';

interface AuditQueueViewProps {
  items: AuditQueueItem[];
  onRemove: (timestamp: number) => void;
  onClear: () => void;
  onUpdate: (timestamp: number, data: { title: string; severity: Severity }) => void;
}

type SortKey = 'timestamp' | 'severity';
type SortDirection = 'asc' | 'desc';

const SEVERITY_ORDER: Record<Severity, number> = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1,
};

const AuditQueueView: React.FC<AuditQueueViewProps> = ({ items, onRemove, onClear, onUpdate }) => {
    const { playClick, playHover, playConfirm } = useSound();

    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<{title: string, severity: Severity} | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'timestamp', direction: 'desc' });

    const sortedItems = useMemo(() => {
        const sortableItems = [...items];
        sortableItems.sort((a, b) => {
            if (sortConfig.key === 'severity') {
                const severityA = SEVERITY_ORDER[a.severity];
                const severityB = SEVERITY_ORDER[b.severity];
                if (severityA < severityB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (severityA > severityB) return sortConfig.direction === 'asc' ? 1 : -1;
            }
            // Default/fallback sort is by timestamp
            if (a.timestamp < b.timestamp) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a.timestamp > b.timestamp) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [items, sortConfig]);

    const handleSort = (key: SortKey) => {
        playClick();
        setSortConfig(prev => {
            if (prev.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'desc' }; // Default to descending for new sort key
        });
    };

    const handleEditClick = (item: AuditQueueItem) => {
        playClick();
        setEditingId(item.timestamp);
        setEditFormData({ title: item.title, severity: item.severity });
    };

    const handleCancelEdit = () => {
        playClick();
        setEditingId(null);
        setEditFormData(null);
    };

    const handleSaveEdit = () => {
        if (editingId && editFormData) {
            playConfirm();
            onUpdate(editingId, editFormData);
            setEditingId(null);
            setEditFormData(null);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => prev ? { ...prev, [name]: value } as {title: string, severity: Severity} : null);
    };

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
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Sort by:</span>
                <button onClick={() => handleSort('timestamp')} className={`pill text-xs ${sortConfig.key === 'timestamp' ? 'pill-active' : ''}`}>
                    Date {sortConfig.key === 'timestamp' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </button>
                <button onClick={() => handleSort('severity')} className={`pill text-xs ${sortConfig.key === 'severity' ? 'pill-active' : ''}`}>
                    Severity {sortConfig.key === 'severity' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                </button>
            </div>
            <button onClick={handleClear} onMouseEnter={playHover} className="btn ghost" disabled={items.length === 0}>
              Clear All
            </button>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-center text-gray-500 py-16">The audit queue is empty.</div>
      ) : (
        <div className="space-y-3">
          {sortedItems.map(item => (
            <div key={item.timestamp} className="card-widget card-ornamented flex items-center justify-between p-3 animate-fade-in">
                {editingId === item.timestamp && editFormData ? (
                    // EDITING VIEW
                    <div className="w-full flex items-center gap-4 animate-fade-in">
                        <SeveritySigil severity={editFormData.severity} />
                        <div className="flex-grow flex items-center gap-4">
                            <input
                                type="text"
                                name="title"
                                value={editFormData.title}
                                onChange={handleInputChange}
                                className="flex-grow bg-black/40 border border-amber-500/30 rounded-lg py-1 px-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                            <select
                                name="severity"
                                value={editFormData.severity}
                                onChange={handleInputChange}
                                className="bg-black/40 border border-amber-500/30 rounded-lg py-1 px-2 focus:ring-amber-500 focus:border-amber-500 appearance-none"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23fbbf24\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleSaveEdit} className="btn ghost text-xs text-green-400">Save</button>
                            <button onClick={handleCancelEdit} className="btn ghost text-xs text-gray-400">Cancel</button>
                        </div>
                    </div>
                ) : (
                    // DISPLAY VIEW
                    <>
                        <div className="flex items-center gap-4 flex-grow min-w-0">
                            <SeveritySigil severity={item.severity} />
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-gray-200 truncate">{item.title}</p>
                                <p className="text-xs text-gray-400 font-mono">{item.id}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                            <span className="text-sm text-gray-500 hidden md:inline">{new Date(item.timestamp).toLocaleString()}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEditClick(item)} onMouseEnter={playHover} className="btn ghost text-xs">Edit</button>
                                <button onClick={() => onRemove(item.timestamp)} onMouseEnter={playHover} className="btn ghost text-xs text-red-400 hover:bg-red-500/10 hover:border-red-500/30">
                                Remove
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditQueueView;