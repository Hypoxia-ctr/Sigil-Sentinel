import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Threat, Severity, AIInsightState } from "../../types";
import { explainWithGemini } from "../../lib/api";
import SeveritySigil from "../SeveritySigil";
import { useSound } from "../../hooks/useSound";
import { useToast } from "../../hooks/useToast";

const XCircle: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
);
const ClipboardCopy: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const RefreshCcw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
);

type DetailsTab = 'threat_details' | 'evidence' | 'oracle' | 'raw_details';
const TAB_LABELS: Record<DetailsTab, string> = {
    threat_details: 'Threat Details',
    evidence: 'Evidence',
    oracle: 'Oracle Explanation',
    raw_details: 'Raw Details'
};


/** ----- helper: severity -> visuals ----- */
function severityLabel(sev: Severity) {
  switch (sev) {
    case "critical": return "Critical";
    case "high": return "High";
    case "medium": return "Medium";
    case "low": return "Low";
  }
}
function severityColorClass(sev: Severity) {
  // These map to classes in index.html
  switch (sev) {
    case "critical": return "badge-critical";
    case "high": return "badge-high";
    case "medium": return "badge-medium";
    case "low": return "badge-low";
  }
}

interface ThreatScannerProps {
  threats: Threat[];
  onChangeView: (view: View) => void;
  oracleCache: Record<string, AIInsightState>;
  setOracleCache: React.Dispatch<React.SetStateAction<Record<string, AIInsightState>>>;
  onRequestFix: (threat: Threat) => void;
}

const FILTERS_STORAGE_KEY = 'ui:filters';

function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

/** ----- Component ----- */
const ThreatScanner: React.FC<ThreatScannerProps> = ({ threats: initialThreats, onChangeView, oracleCache, setOracleCache, onRequestFix }) => {
  const [threats, setThreats] = useState<Threat[]>(initialThreats);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState(() => {
    try {
        const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                severity: parsed.severity ?? 'all',
                unexplainedOnly: parsed.unexplainedOnly ?? false,
                query: parsed.query ?? '',
            };
        }
    } catch {}
    return { severity: 'all' as "all" | Severity, unexplainedOnly: false, query: '' };
  });
  
  const { severity: filterSeverity, unexplainedOnly, query } = filters;
  const debouncedQuery = useDebounced(query, 200);
  const { playClick, playConfirm, playHover } = useSound();

  useEffect(() => {
    try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {}
  }, [filters]);

  const visible = useMemo(() => {
    return threats.filter(t => {
      const severityMatch = filterSeverity === "all" || t.severity === filterSeverity;
      const unexplainedMatch = !unexplainedOnly || !(oracleCache[t.id]?.text || t.explained);
      const queryMatch = debouncedQuery.trim() === '' 
        ? true 
        : t.title.toLowerCase().includes(debouncedQuery.toLowerCase()) || 
          (t.reason || '').toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          t.id.toLowerCase().includes(debouncedQuery.toLowerCase());
          
      return severityMatch && unexplainedMatch && queryMatch;
    });
  }, [threats, filterSeverity, unexplainedOnly, oracleCache, debouncedQuery]);

  const handleExplain = async (threat: Threat) => {
    const insight = oracleCache[threat.id];
    if (insight?.loading) return;

    const TTL_MS = 24 * 60 * 60 * 1000;
    if (insight?.text && insight.fetchedAt && (Date.now() - insight.fetchedAt < TTL_MS)) {
        console.log(`[DevTest] cache hit: true`, {id: threat.id});
        setExpanded(e => ({ ...e, [threat.id]: true })); // Ensure it's visible if user clicks
        return;
    }
    console.log(`[DevTest] cache miss: true`, {id: threat.id});

    playConfirm();
    setOracleCache(prev => ({
        ...prev,
        [threat.id]: {
            ...(prev[threat.id] || { feedback: null }),
            loading: true,
            text: null,
            error: null,
        }
    }));
    
    const context = {
        source: threat.source,
        severity: threat.severity,
        evidence: threat.evidence ?? {},
        details: threat.details ?? threat.reason ?? "",
    };
    
    const res = await explainWithGemini(threat.id, context);

    if (res.text.startsWith('Explain failed:')) {
        setOracleCache(prev => ({ ...prev, [threat.id]: { ...prev[threat.id]!, loading: false, text: null, error: res.text, fetchedAt: Date.now() }}));
    } else {
        setOracleCache(prev => ({ ...prev, [threat.id]: { ...prev[threat.id]!, loading: false, text: res.text, error: null, fetchedAt: Date.now() }}));
        console.log(`[DevTest] cache write: true`, {id: threat.id});
    }
  };
  
  const handleFilterClick = (severity: "all" | Severity) => {
    playClick();
    setFilters(f => ({ ...f, severity }));
  }
  
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(f => ({ ...f, query: e.target.value }));
  }

  const handleUnexplainedToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    playClick();
    setFilters(f => ({ ...f, unexplainedOnly: e.target.checked }));
  }

  return (
    <main className="threat-scanner p-4">
      <header className="threat-header flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3">
            <div>
                <h2 className="text-2xl font-bold m-0">Threat Scanner</h2>
                <p className="text-gray-400 m-0">Detected threats & detailed guidance</p>
            </div>
            <button className="btn ghost" onMouseEnter={playHover} onClick={() => { playClick(); setThreats(initialThreats.map(t => ({ ...t, detectedAt: new Date().toISOString() }))); }}>
                <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-400">Severity:</span>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
                 <button key={sev} className={`pill capitalize ${filterSeverity === sev ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick(sev)}>{sev}</button>
              ))}
              <label className="flex items-center gap-2 pill cursor-pointer has-[:checked]:pill-active">
                 <input type="checkbox" className="w-4 h-4 rounded" checked={unexplainedOnly} onChange={handleUnexplainedToggle}/>
                 Unexplained
              </label>
            </div>
            <div className="flex-grow w-full sm:w-auto">
                <input type="search" placeholder="Filter by title, reason, or ID..." value={query} onChange={handleQueryChange} className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none" />
            </div>
        </div>
      </header>
      
      <p className="text-sm text-gray-500 mt-4">{visible.length} of {threats.length} threats shown.</p>
      
      <ul className="threat-list flex flex-col gap-3 mt-4">
        {visible.map(t => (
            <li key={t.id} className={`threat-card card-widget card-ornamented ${expanded[t.id] ? 'bg-zinc-800/50' : ''}`} role="listitem">
                <header className="flex w-full items-start justify-between gap-3 cursor-pointer" onClick={() => { playClick(); setExpanded(e => ({...e, [t.id]: !e[t.id]})); }}>
                    <div className="flex items-center gap-3">
                        <SeveritySigil severity={t.severity} />
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-gray-100 truncate">{t.title}</h3>
                            <p className="text-sm text-gray-400 truncate">{t.reason}</p>
                        </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-4 ml-auto pl-4">
                        <div className={`severity-badge ${severityColorClass(t.severity)}`}>
                            {severityLabel(t.severity)}
                        </div>
                        <span className="text-sm text-gray-500">{new Date(t.detectedAt || 0).toLocaleTimeString()}</span>
                    </div>
                </header>
                {expanded[t.id] && (
                    <div className="threat-details animate-fade-in pl-10" role="region">
                        <ThreatDetailsTabs threat={t} oracleInsight={oracleCache[t.id]} />
                        <div className="flex flex-wrap gap-2 mt-4">
                            <button className="btn ghost" onClick={() => handleExplain(t)} disabled={oracleCache[t.id]?.loading}>
                               <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${oracleCache[t.id]?.loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-5 3h4m-3 3h2M4 12a8 8 0 1116 0c0 4.418-3.582 8-8 8s-8-3.582-8-8zm8-10v2m0 16v2m-8-9H2m20 0h-2m-3.9-5.1L4.5 7.5M19.5 7.5l-3.6 3.6" /></svg>
                               {oracleCache[t.id]?.loading ? "Asking..." : oracleCache[t.id]?.text ? "Refresh Oracle" : "Ask the Oracle"}
                            </button>
                            <button className="btn" onClick={() => { playClick(); onChangeView(View.SECURITY_ADVISOR) }}>
                                Security Advisor
                            </button>
                            <button className="btn" onMouseEnter={playHover} onClick={() => onRequestFix(t)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Queue Fix
                            </button>
                        </div>
                    </div>
                )}
            </li>
        ))}
      </ul>
    </main>
  );
};

interface ThreatDetailsTabsProps {
  threat: Threat;
  oracleInsight?: AIInsightState;
}

const ThreatDetailsTabs: React.FC<ThreatDetailsTabsProps> = ({ threat, oracleInsight }) => {
  const [activeTab, setActiveTab] = useState<DetailsTab>('threat_details');
  const [copied, setCopied] = useState(false);
  const { playClick } = useSound();
  const { addToast } = useToast();

  const handleCopy = () => {
    playClick();
    const textToCopy = JSON.stringify(threat, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    addToast({ title: 'Copied to Clipboard', message: 'Raw threat data has been copied.', type: 'info' });
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mt-3">
        <div className="flex border-b border-zinc-700">
            {(Object.keys(TAB_LABELS) as DetailsTab[]).map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm transition-colors ${activeTab === tab ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>{TAB_LABELS[tab]}</button>
            ))}
        </div>
        <div className="p-4 bg-black/20 rounded-b-lg">
            {activeTab === 'threat_details' && (
                <p className="text-gray-300">{threat.details}</p>
            )}
            {activeTab === 'evidence' && threat.evidence && (
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{JSON.stringify(threat.evidence, null, 2)}</pre>
            )}
            {activeTab === 'oracle' && (
                <div>
                    {oracleInsight?.loading && <p className="text-cyan-300">The Oracle is contemplating...</p>}
                    {oracleInsight?.error && <p className="text-red-400">Error: {oracleInsight.error}</p>}
                    {oracleInsight?.text && <pre className="text-gray-300 whitespace-pre-wrap font-serif text-sm">{oracleInsight.text}</pre>}
                    {!oracleInsight && <p className="text-gray-500">Click "Ask the Oracle" to get an explanation.</p>}
                </div>
            )}
            {activeTab === 'raw_details' && (
                <div className="relative">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-zinc-900 p-2 rounded max-h-48 overflow-auto">
                       {JSON.stringify(threat, null, 2)}
                    </pre>
                    <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300">
                      {copied ? <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> : <ClipboardCopy className="h-4 w-4" />}
                    </button>
                </div>
            )}
        </div>
    </div>
  );
}

export default ThreatScanner;