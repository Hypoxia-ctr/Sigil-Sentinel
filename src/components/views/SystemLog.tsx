import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Types
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
  isNew?: boolean;
}

// Mock Data and Helpers
const sampleMessages: { level: LogLevel; message: string; details?: boolean }[] = [
  { level: 'INFO', message: 'User `admin` logged in from 192.168.1.100' },
  { level: 'INFO', message: 'System integrity check passed.' },
  { level: 'WARN', message: 'High CPU usage detected on process `sigil-worker-3`' },
  { level: 'INFO', message: 'Configuration `aegis/policy.yaml` reloaded.' },
  { level: 'ERROR', message: 'Failed to connect to audit endpoint: Connection refused.', details: true },
  { level: 'CRITICAL', message: 'Unsigned binary execution detected: `C:\\Temp\\evil.exe`', details: true },
  { level: 'INFO', message: 'New USB device detected: Kingston DataTraveler' },
  { level: 'WARN', message: 'SSH login attempt failed for user `root` from 10.0.5.23' },
];

const generateLog = (id: number): LogEntry => {
  const template = sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
  const isNew = template.level === 'CRITICAL' || template.level === 'ERROR';
  return {
    id,
    timestamp: new Date().toISOString(),
    level: template.level,
    message: template.message,
    details: template.details ? {
      pid: Math.floor(Math.random() * 50000) + 1000,
      user: 'system',
      path: template.message.match(/`([^`]+)`/)?.[1] || 'N/A',
      raw: `EVENT_ID=${id} SEVERITY=${template.level} TS=${Date.now()}`
    } : undefined,
    isNew,
  };
};


// Component: FormattedLogDetails
const FormattedLogDetails: React.FC<{ details: Record<string, any> }> = ({ details }) => {
    return (
        <div className="log-details-formatted animate-fade-in mx-4 my-2">
            {Object.entries(details).map(([key, value]) => (
                <div key={key} className="detail-item">
                    <span className="detail-key capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="detail-value">{String(value)}</span>
                </div>
            ))}
        </div>
    );
};


// Component: SystemLog
const SystemLog: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [filterLevels, setFilterLevels] = useState<Set<LogLevel>>(new Set());
    const logContainerRef = useRef<HTMLUListElement>(null);
    const logIdCounter = useRef(0);

    useEffect(() => {
        const initialLogs: LogEntry[] = [];
        for (let i = 0; i < 50; i++) {
            initialLogs.unshift(generateLog(logIdCounter.current++));
        }
        setLogs(initialLogs);
    }, []);

    useEffect(() => {
        if (isPaused) return;

        const interval = setInterval(() => {
            const newLog = generateLog(logIdCounter.current++);
            setLogs(prev => [newLog, ...prev.slice(0, 199)]);

            if (newLog.isNew) {
                setTimeout(() => {
                    setLogs(prev => prev.map(l => l.id === newLog.id ? { ...l, isNew: false } : l));
                }, 1200);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isPaused]);

    const handleToggleFilter = (level: LogLevel) => {
        setFilterLevels(prev => {
            const newSet = new Set(prev);
            if (newSet.has(level)) {
                newSet.delete(level);
            } else {
                newSet.add(level);
            }
            return newSet;
        });
    };

    const processedLogs = useMemo(() => {
        let filtered = [...logs];

        if (filterLevels.size > 0) {
            filtered = filtered.filter(log => filterLevels.has(log.level));
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });

        return filtered;
    }, [logs, filterLevels, sortOrder]);

    const handleToggleExpand = useCallback((id: number) => {
        setExpandedLogId(prevId => (prevId === id ? null : id));
    }, []);

    const getLevelClass = (level: LogLevel) => {
        switch (level) {
            case 'INFO': return 'log-info';
            case 'WARN': return 'log-warn';
            case 'ERROR': return 'log-error';
            case 'CRITICAL': return 'log-critical';
            default: return '';
        }
    };
    
    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-indigo-400 drop-shadow-[0_2px_4px_rgba(129,140,248,0.3)]">
                        System Log
                    </h1>
                    <button onClick={() => setIsPaused(!isPaused)} className="btn ghost">
                        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                    </button>
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">Filter:</span>
                        {(['CRITICAL', 'ERROR', 'WARN', 'INFO'] as LogLevel[]).map(level => (
                             <button key={level} onClick={() => handleToggleFilter(level)} className={`pill ${filterLevels.has(level) ? 'pill-active' : ''}`}>
                                {level}
                             </button>
                        ))}
                    </div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">Sort:</span>
                         <button onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')} className="pill">
                            {sortOrder === 'desc' ? 'Newest First ↓' : 'Oldest First ↑'}
                         </button>
                    </div>
                </div>
            </div>
            <div className="card flex-grow overflow-hidden p-0">
                <ul ref={logContainerRef} className="log-list h-full overflow-y-auto">
                    {processedLogs.map(log => (
                        <li key={log.id}>
                            <div
                                className={`log-item ${getLevelClass(log.level)} ${log.isNew && log.level === 'CRITICAL' ? 'is-new-critical' : ''} ${log.isNew && log.level === 'ERROR' ? 'is-new-error' : ''}`}
                                onClick={() => log.details && handleToggleExpand(log.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && log.details && handleToggleExpand(log.id)}
                            >
                                <span className="text-gray-500 mr-4">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                <span className="mr-4 font-semibold">[{log.level.padEnd(8, ' ')}]</span>
                                <span>{log.message}</span>
                            </div>
                            {expandedLogId === log.id && log.details && (
                                <FormattedLogDetails details={log.details} />
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SystemLog;
