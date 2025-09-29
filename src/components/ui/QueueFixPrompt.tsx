import React, { useState } from 'react';
import { Threat, Severity, AuditQueueItem } from '../../types';

interface QueueFixPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onQueue: (item: { id: string; title: string; severity: Severity }) => void;
  threats: Threat[];
}

const QueueFixPrompt: React.FC<QueueFixPromptProps> = ({ isOpen, onClose, onQueue, threats }) => {
  const [selectedId, setSelectedId] = useState<string>(threats[0]?.id || '');
  const [manualId, setManualId] = useState('');
  const [isManual, setIsManual] = useState(false);

  if (!isOpen) return null;

  const handleQueue = () => {
    if (isManual) {
      if (manualId.trim()) {
        onQueue({
          id: manualId.trim(),
          title: `Manual Entry: ${manualId.trim()}`,
          severity: 'medium', // Default for manual entries
        });
      }
    } else {
      const threat = threats.find(t => t.id === selectedId);
      if (threat) {
        onQueue(threat);
      }
    }
  };

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div className="command-palette" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-cyan-500/20">
          <h3 className="text-lg font-bold text-cyan-300">Queue a Fix for Audit</h3>
          <p className="text-sm text-gray-400">Select a known threat or enter a manual ID.</p>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="flex items-center gap-2">
              <input type="radio" name="queue-type" checked={!isManual} onChange={() => setIsManual(false)} />
              Select Known Threat
            </label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              disabled={isManual}
              className="w-full mt-2 p-2 bg-black/40 border border-cyan-500/30 rounded-lg disabled:opacity-50"
            >
              {threats.map(t => (
                <option key={t.id} value={t.id}>
                  [{t.severity.toUpperCase()}] {t.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input type="radio" name="queue-type" checked={isManual} onChange={() => setIsManual(true)} />
              Enter Manual ID
            </label>
            <input
              type="text"
              placeholder="e.g., JIRA-1234, CVE-2024-XXXX"
              value={manualId}
              onChange={e => setManualId(e.target.value)}
              disabled={!isManual}
              className="w-full mt-2 p-2 bg-black/40 border border-cyan-500/30 rounded-lg disabled:opacity-50"
            />
          </div>
        </div>
        <div className="p-4 border-t border-cyan-500/20 flex justify-end gap-3">
          <button onClick={onClose} className="btn ghost">Cancel</button>
          <button onClick={handleQueue} className="btn primary">Queue Item</button>
        </div>
      </div>
    </div>
  );
};

export default QueueFixPrompt;