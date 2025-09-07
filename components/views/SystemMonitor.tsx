import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Severity } from '../../types';
import SeveritySigil from '../SeveritySigil';
import { useSound } from '../../hooks/useSound';
import SeverityBarChart from '../SeverityBarChart';

// --- TYPES & MOCK DATA ---
type EventType = 'USB_INJECTION' | 'NET_SHIFT' | 'EXEC_CHAIN' | 'CPU_SPIKE' | 'CLIPBOARD_INJECTION';
const ALL_EVENT_TYPES: EventType[] = ['USB_INJECTION', 'NET_SHIFT', 'EXEC_CHAIN', 'CPU_SPIKE', 'CLIPBOARD_INJECTION'];

interface SystemEvent {
  id: number;
  timestamp: string;
  type: EventType | 'BENIGN';
  payload: string;
  severity: Severity;
}

type TrustScores = Record<EventType, number>;

const PROFILES = {
  Gaming: { trust_threshold: 0.35, color: 'text-fuchsia-400' },
  Development: { trust_threshold: 0.6, color: 'text-yellow-400' },
  Passive: { trust_threshold: 0.8, color: 'text-green-400' },
};
type ProfileName = keyof typeof PROFILES;

// --- GAUGE COMPONENT ---
interface GaugeProps {
  score: number;
  label: string;
  threshold: number;
}
const Gauge: React.FC<GaugeProps> = ({ score, label, threshold }) => {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - score * circumference;
  const thresholdAngle = threshold * 360;
  const color = score < threshold ? 'text-red-500' : 'text-indigo-400';
  const bgColor = score < threshold ? 'stroke-red-500/20' : 'stroke-indigo-500/20';
  const fgColor = score < threshold ? 'stroke-red-500' : 'stroke-indigo-400';

  return (
    <div className="flex flex-col items-center text-center p-4 bg-black/20 rounded-lg border border-indigo-500/10">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle cx="50" cy="50" r="40" strokeWidth="8" className={bgColor} fill="none" />
          {/* Foreground circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            strokeWidth="8"
            className={`${fgColor} transition-all duration-500`}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          {/* Threshold marker */}
          <line
            x1="50"
            y1="10"
            x2="50"
            y2="20"
            strokeWidth="3"
            className="stroke-white/50"
            transform={`rotate(${thresholdAngle} 50 50)`}
          />
        </svg>
        <div className={`absolute inset-0 flex items-center justify-center text-2xl font-bold ${color}`}>
          {Math.round(score * 100)}%
        </div>
      </div>
      <p className="mt-2 text-sm font-semibold tracking-wider text-gray-300">{label}</p>
    </div>
  );
};


// --- SYSTEM MONITOR VIEW ---
const SystemMonitor: React.FC = () => {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [trustScores, setTrustScores] = useState<TrustScores>({
    USB_INJECTION: 1.0,
    NET_SHIFT: 1.0,
    EXEC_CHAIN: 1.0,
    CPU_SPIKE: 1.0,
    CLIPBOARD_INJECTION: 1.0,
  });
  const [activeProfile, setActiveProfile] = useState<ProfileName>('Development');
  const [filterType, setFilterType] = useState<EventType | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<Severity | 'ALL'>('ALL');
  const [hoveredGauge, setHoveredGauge] = useState<EventType | null>(null);
  const { playClick, playHover } = useSound();
  const eventIntervalRef = useRef<number | null>(null);

  const generateEvent = () => {
      const random = Math.random();
      let type: EventType | 'BENIGN';
      let payload: string;
      let severity: Severity;

      if (random < 0.1) {
        type = 'USB_INJECTION';
        payload = 'Device Serial: AB-12345';
        severity = 'high';
      } else if (random < 0.2) {
        type = 'NET_SHIFT';
        payload = 'New Gateway: 192.168.1.254';
        severity = 'medium';
      } else if (random < 0.3) {
        type = 'EXEC_CHAIN';
        payload = 'powershell.exe -> curl.exe';
        severity = 'critical';
      } else if (random < 0.4) {
        type = 'CPU_SPIKE';
        payload = 'PID 12345 usage > 90%';
        severity = 'medium';
      } else if (random < 0.5) {
        type = 'CLIPBOARD_INJECTION';
        payload = 'Clipboard accessed while idle';
        severity = 'high';
      } else {
        type = 'BENIGN';
        payload = 'System heartbeat OK';
        severity = 'low';
      }

      const newEvent: Omit<SystemEvent, 'id' | 'timestamp'> = { type, payload, severity };

      setEvents(prev => [{ ...newEvent, id: Date.now(), timestamp: new Date().toLocaleTimeString() }, ...prev.slice(0, 100)]);

      // Update trust scores
      setTrustScores(prevScores => {
        const newScores = { ...prevScores };
        // Negative events lower score
        if (newEvent.type !== 'BENIGN') {
            const bad: EventType[] = ['USB_INJECTION', 'EXEC_CHAIN', 'CLIPBOARD_INJECTION'];
            const delta = bad.includes(newEvent.type) ? -0.15 : -0.05;
            newScores[newEvent.type] = Math.max(0, newScores[newEvent.type] + delta);
        }
        // All scores decay back towards 1.0 over time
        for (const key in newScores) {
            newScores[key as EventType] = Math.min(1.0, newScores[key as EventType] + 0.005);
        }
        return newScores;
      });
    };

  useEffect(() => {
    if (!isPaused) {
        eventIntervalRef.current = window.setInterval(generateEvent, 2500);
    } else {
        if (eventIntervalRef.current) {
            clearInterval(eventIntervalRef.current);
            eventIntervalRef.current = null;
        }
    }
    return () => {
        if (eventIntervalRef.current) clearInterval(eventIntervalRef.current);
    };
  }, [isPaused]);

  const summaryStats = useMemo(() => {
    const totalEvents = events.length;
    const threats = events.filter(e => e.severity !== 'low' && e.type !== 'BENIGN');
    const counts: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    events.forEach(e => {
        if (counts[e.severity] !== undefined) {
            counts[e.severity]++;
        }
    });
    return {
        totalEvents,
        threatsCount: threats.length,
        severityCounts: counts,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const typeMatch = filterType === 'ALL' || e.type === filterType;
      const severityMatch = filterSeverity === 'ALL' || e.severity === filterSeverity;
      return typeMatch && severityMatch;
    });
  }, [events, filterType, filterSeverity]);

  const eventIcons: Record<SystemEvent['type'], string> = {
    USB_INJECTION: '🔌',
    NET_SHIFT: '↔️',
    EXEC_CHAIN: '⛓️',
    CPU_SPIKE: '⚡️',
    CLIPBOARD_INJECTION: '📋',
    BENIGN: '✔️'
  };

  const severityPillClasses: Record<Severity, string> = {
      critical: "bg-red-600/30 text-red-300 border-red-500/50",
      high: "bg-fuchsia-600/30 text-fuchsia-300 border-fuchsia-500/50",
      medium: "bg-yellow-600/30 text-yellow-300 border-yellow-500/50",
      low: "bg-green-600/30 text-green-300 border-green-500/50",
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-400 drop-shadow-[0_2px_4px_rgba(99,102,241,0.3)]">System Monitor</h1>
        <div className="flex items-center space-x-2 bg-black/30 p-2 rounded-lg border border-indigo-500/20">
            <span className="text-sm font-semibold mr-2">Active Profile:</span>
            {Object.keys(PROFILES).map(p => (
                <button key={p} onClick={() => { playClick(); setActiveProfile(p as ProfileName); }} 
                onMouseEnter={playHover}
                className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${activeProfile === p ? `bg-indigo-600 shadow-lg shadow-indigo-500/30 text-white font-bold` : 'bg-transparent hover:bg-indigo-500/20'}`}>
                    {p}
                </button>
            ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Feed */}
        <div className="lg:col-span-2 p-4 bg-black/30 rounded-lg border border-indigo-500/20 h-[70vh] flex flex-col hx-glow-border" style={{'--glow-color': 'var(--indigo-500)'} as React.CSSProperties}>
            <div className="flex justify-between items-center mb-2 border-b border-indigo-500/20 pb-2">
                <h2 className="text-lg font-semibold text-indigo-300">Live Event Feed</h2>
                <button onClick={() => setIsPaused(!isPaused)} className="btn text-sm">
                    {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                </button>
            </div>
            <div className="flex gap-6 mb-4">
                 <div>
                    <label htmlFor="event-filter" className="text-sm font-semibold text-gray-400 mr-2">Filter by Type:</label>
                    <select
                        id="event-filter"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as EventType | 'ALL')}
                        className="bg-black/40 border border-indigo-500/30 rounded-md px-3 py-1.5 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 text-sm appearance-none pr-8"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23a5b4fc\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                    >
                        <option value="ALL">All Events</option>
                        {ALL_EVENT_TYPES.map(type => (
                            <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold text-gray-400">Severity:</span>
                     {(['ALL', 'low', 'medium', 'high', 'critical'] as const).map(sev => (
                        <button key={sev} onClick={() => { playClick(); setFilterSeverity(sev); }} onMouseEnter={playHover} className={`px-3 py-1 text-xs rounded-full capitalize transition-colors ${filterSeverity === sev ? 'bg-indigo-500/30 text-indigo-200' : 'bg-black/30 hover:bg-indigo-500/20'}`}>{sev}</button>
                     ))}
                </div>
            </div>
            <div className="overflow-y-auto pr-2 flex-grow">
                {filteredEvents.map(event => (
                    <div key={event.id} className={`grid grid-cols-[auto,1fr,2fr,auto] items-center gap-4 p-2 border-b border-white/5 animate-fade-in rounded-md transition-all duration-200 ${hoveredGauge ? (event.type === hoveredGauge ? 'bg-indigo-500/20 scale-[1.02]' : 'opacity-50 scale-[0.98]') : ''}`}>
                        <span className="text-lg">{eventIcons[event.type]}</span>
                        <div>
                            <p className={`font-bold text-sm ${event.type === 'BENIGN' ? 'text-gray-400' : 'text-indigo-300'}`}>{event.type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-gray-500">{event.timestamp}</p>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{event.payload}</p>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold rounded-full border ${severityPillClasses[event.severity]}`}>
                            <SeveritySigil severity={event.severity} className="w-3 h-3" />
                            <span className="capitalize">{event.severity}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Trust Gauges & Summary */}
        <div className="space-y-6">
            <div className="p-4 bg-black/30 rounded-lg border border-indigo-500/20 hx-glow-border" style={{'--glow-color': 'var(--indigo-500)'} as React.CSSProperties}>
                 <h2 className="text-lg font-semibold text-indigo-300 mb-2 border-b border-indigo-500/20 pb-2">Trust Scores</h2>
                 <p className="text-xs text-indigo-200/60 mb-4">Represents confidence in system integrity for each vector. Lower scores indicate anomalous activity.</p>
                 <div className="grid grid-cols-2 gap-4">
                    {ALL_EVENT_TYPES.map(eventType => (
                        <div 
                          key={eventType} 
                          onMouseEnter={() => { setHoveredGauge(eventType); playHover(); }} 
                          onMouseLeave={() => setHoveredGauge(null)} 
                          className="cursor-pointer transition-transform duration-200 hover:scale-105"
                        >
                            <Gauge 
                                score={trustScores[eventType]}
                                label={eventType.replace(/_/g, ' ')}
                                threshold={PROFILES[activeProfile].trust_threshold}
                            />
                        </div>
                    ))}
                 </div>
                 <div className="mt-4 text-center text-sm p-2 bg-black/20 rounded-md">
                    Threshold: <span className={`font-bold ${PROFILES[activeProfile].color}`}>{PROFILES[activeProfile].trust_threshold * 100}%</span>
                 </div>
            </div>
             <div className="p-4 bg-black/30 rounded-lg border border-indigo-500/20 hx-glow-border" style={{'--glow-color': 'var(--indigo-500)'} as React.CSSProperties}>
                <h2 className="text-lg font-semibold text-indigo-300 mb-2 text-center">Event Summary</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-indigo-300">Total Events</p>
                        <p className="text-4xl font-bold">{summaryStats.totalEvents}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-indigo-300">Threats Detected</p>
                        <p className="text-4xl font-bold text-amber">{summaryStats.threatsCount}</p>
                    </div>
                </div>
                 <div className="mt-4">
                    <h3 className="text-sm font-semibold text-indigo-300 mb-2 text-center">Severity Distribution</h3>
                    <SeverityBarChart counts={summaryStats.severityCounts} />
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;