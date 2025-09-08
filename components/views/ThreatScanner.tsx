import React, { useEffect, useMemo, useState } from "react";
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

type DetailsTab = 'details' | 'evidence' | 'oracle';
const TAB_LABELS: Record<DetailsTab, string> = {
    details: 'Details',
    evidence: 'Evidence',
    oracle: 'Oracle Explanation'
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

/** ----- Example/mock data; replace with real data feed ----- */
const MOCK_THREATS: Threat[] = [
  {
    id: "T-2025-0001",
    title: "Unsigned binary executed: wrm.exe",
    reason: "Unsigned executable spawned from temp dir",
    detectedAt: new Date().toISOString(),
    source: "File Analyzer",
    severity: "high",
    details: "Parent: explorer.exe, Cmdline: C:\\Windows\\Temp\\wrm.exe --connect 192.168.1.2:443",
    evidence: {
      "process_id": "1234",
      "parent_process": "explorer.exe",
      "command_line": "C:\\Windows\\Temp\\wrm.exe --connect 192.168.1.2:443",
      "file_hash": "e4d909c290d0fb1ca068ffaddf22cbd0",
    },
  },
  {
    id: "T-2025-0002",
    title: "Gateway change detected",
    reason: "Default gateway shifted to suspicious host 192.168.1.254",
    detectedAt: new Date().toISOString(),
    source: "Network Monitor",
    severity: "medium",
    details: "Previous gateway 192.168.1.1 -> 192.168.1.254",
    evidence: {
      "interface": "eth0",
      "old_gateway": "192.168.1.1",
      "new_gateway": "192.168.1.254",
      "process": "dhclient"
    }
  },
  {
    id: "T-2025-0003",
    title: "High entropy blob detected (packed file)",
    reason: "Entropy > 7.8",
    detectedAt: new Date().toISOString(),
    source: "File Analyzer",
    severity: "critical",
    details: "SHA256: abcdef...; size 2.7MB; suspicious extension: .bin",
    evidence: {
        "file_path": "/tmp/installer.bin",
        "sha256": "abcdef1234567890",
        "size_bytes": 2700000,
        "entropy_score": 7.85
    }
  },
];

interface ThreatScannerProps {
  onChangeView: (view: View) => void;
  oracleCache: Record<string, AIInsightState>;
  setOracleCache: React.Dispatch<React.SetStateAction<Record<string, AIInsightState>>>;
}

const FILTERS_STORAGE_KEY = 'sigil:threatscanner:filters';

/** ----- Component ----- */
const ThreatScanner: React.FC<ThreatScannerProps> = ({ onChangeView, oracleCache, setOracleCache }) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState(() => {
    try {
        const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            return {
                severity: parsed.severity ?? 'all',
                source: parsed.source ?? 'all',
            };
        }
    } catch {}
    return { severity: 'all' as "all" | Severity | "unexplained", source: 'all' };
  });
  // FIX: Destructured the `filters` state object with aliasing.
  // The state object has `severity` and `source` keys, but the component uses
  // `filterSeverity` and `filterSource` variable names.
  const { severity: filterSeverity, source: filterSource } = filters;
  const { playClick, playConfirm, playHover } = useSound();
  const { addToast } = useToast();

  useEffect(() => {
    setThreats(MOCK_THREATS);
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {}
  }, [filters]);

  const sources = useMemo(() => {
    const uniqueSources = new Set(threats.map(t => t.source).filter(Boolean));
    return ['all', ...Array.from(uniqueSources)] as string[];
  }, [threats]);

  const visible = useMemo(() => {
    return threats.filter(t => {
      const severityMatch = filterSeverity === "all" || (filterSeverity === "unexplained" ? !oracleCache[t.id]?.text : t.severity === filterSeverity);
      const sourceMatch = filterSource === "all" || t.source === filterSource;
      return severityMatch && sourceMatch;
    });
  }, [threats, filterSeverity, filterSource, oracleCache]);

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

  function handleQueueFix(threat: Threat) {
    const row = { ts: new Date().toISOString(), id: threat.id, title: threat.title, severity: threat.severity };
    try {
      const existing = JSON.parse(localStorage.getItem("sigil-audit-queue") || "[]");
      existing.push(row);
      localStorage.setItem("sigil-audit-queue", JSON.stringify(existing));
      addToast({ title: 'Fix Queued', message: `Fix for "${threat.title}" was added to the audit queue.`, type: 'info' });
      playConfirm();
    } catch (e) {
      console.warn("Queue failed", e);
      addToast({ title: 'Queue Failed', message: 'Could not add fix to the audit queue.', type: 'error' });
    }
  }
  
  const handleFilterClick = (severity: "all" | Severity | "unexplained") => {
    playClick();
    setFilters(f => ({ ...f, severity }));
  }
  
  const handleSourceClick = (source: string) => {
    playClick();
    setFilters(f => ({ ...f, source }));
  }

  return (
    <main className="threat-scanner p-4">
      <header className="threat-header flex flex-col gap-4">
        <div className="flex justify-between items-center gap-3">
            <div>
                <h2 className="text-2xl font-bold m-0">Threat Scanner</h2>
                <p className="text-gray-400 m-0">Detected threats & detailed guidance</p>
            </div>
            <button className="btn ghost" onMouseEnter={playHover} onClick={() => { playClick(); setThreats(MOCK_THREATS.map(t => ({ ...t, detectedAt: new Date().toISOString() }))); }}>
                <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-400">Severity:</span>
              <button className={`pill ${filterSeverity === "all" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("all")}>All</button>
              <button className={`pill ${filterSeverity === "critical" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("critical")}>Critical</button>
              <button className={`pill ${filterSeverity === "high" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("high")}>High</button>
              <button className={`pill ${filterSeverity === "medium" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("medium")}>Medium</button>
              <button className={`pill ${filterSeverity === "low" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("low")}>Low</button>
              <button className={`pill ${filterSeverity === "unexplained" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("unexplained")}>Unexplained</button>
            </div>
             <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-gray-400">Source:</span>
              {sources.map(source => (
                <button key={source} className={`pill capitalize ${filterSource === source ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleSourceClick(source)}>{source}</button>
              ))}
            </div>
        </div>
      </header>

      <section aria-live="polite" aria-relevant="additions removals" className="mt-3">
        {visible.length === 0 ? (
          <div className="card empty p-4">No threats match the filter.</div>
        ) : (
          <ul className="list-none m-0 p-0 grid gap-3">
            {visible.map(threat => {
              const isExpanded = Boolean(expanded[threat.id]);
              return (
                <li key={threat.id} className="hx-glow-border threat-card p-3 grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2.5">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className={`severity-badge ${severityColorClass(threat.severity)}`} aria-hidden>
                        <SeveritySigil severity={threat.severity} />
                        <span className="ml-1.5 font-bold">{severityLabel(threat.severity)}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <strong className="text-base">{threat.title}</strong>
                          <span className="text-gray-400 text-xs">{threat.source}</span>
                          <small className="text-gray-400">• {new Date(threat.detectedAt ?? "").toLocaleString()}</small>
                        </div>
                        <div className="text-gray-300 mt-1.5 text-sm">{threat.reason}</div>
                      </div>
                    </div>

                    {isExpanded && (
                        <ExpandedThreatDetails
                            threat={threat}
                            oracleInsight={oracleCache[threat.id]}
                            onExplain={handleExplain}
                            onQueueFix={handleQueueFix}
                            onChangeView={onChangeView}
                        />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex flex-col gap-1.5">
                      <button
                        aria-expanded={isExpanded}
                        aria-controls={`details-${threat.id}`}
                        className="btn ghost"
                        onMouseEnter={playHover}
                        onClick={() => { playClick(); setExpanded(e => ({ ...e, [threat.id]: !isExpanded })); }}
                      >
                        {isExpanded ? "Collapse" : "Expand"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

const ExpandedThreatDetails: React.FC<{
    threat: Threat;
    oracleInsight: AIInsightState | undefined;
    onExplain: (t: Threat) => void;
    onQueueFix: (t: Threat) => void;
    onChangeView: (v: View) => void;
}> = ({ threat, oracleInsight, onExplain, onQueueFix, onChangeView }) => {
    const [activeTab, setActiveTab] = useState<DetailsTab>('details');
    const { playClick, playHover } = useSound();
    const { addToast } = useToast();
    const explanation = oracleInsight?.text;
    const isFetching = oracleInsight?.loading;
    const error = oracleInsight?.error;

    return (
        <div id={`details-${threat.id}`} role="region" aria-label={`${threat.title} details`} className="mt-3 border-t border-white/5 pt-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex border-b border-zinc-700" role="tablist" aria-label="Threat Details">
                    {(['details', 'evidence', 'oracle'] as DetailsTab[]).map(tab => (
                        <button key={tab} onMouseEnter={playHover} onClick={() => { playClick(); setActiveTab(tab); }} className={`px-4 py-2 text-sm capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white'}`} role="tab" aria-selected={activeTab === tab}>{TAB_LABELS[tab]}</button>
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    <button className="btn" onMouseEnter={playHover} onClick={() => { playClick(); navigator.clipboard?.writeText(JSON.stringify(threat, null, 2)); addToast({ title: 'Threat Data Copied', message: 'Threat details and evidence copied to clipboard.', type: 'success' }); }}>
                        <ClipboardCopy className="h-4 w-4" /> Copy JSON
                    </button>
                    <button className="btn primary" onMouseEnter={playHover} onClick={() => { onQueueFix(threat); }}>Queue Fix</button>
                    <button className="btn ghost" onMouseEnter={playHover} onClick={() => { playClick(); onChangeView(View.SECURITY_ADVISOR); }}>Advisor</button>
                </div>
            </div>
            <div className="mt-3 p-3 bg-[#071019] rounded-lg min-h-[150px]" role="tabpanel">
                {activeTab === 'details' && (
                    <dl className="text-cyan-100 font-mono text-xs space-y-2">
                        <div>
                            <dt className="text-gray-400 font-sans">Reason:</dt>
                            <dd className="pl-4">{threat.reason}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-400 font-sans">Source:</dt>
                            <dd className="pl-4">{threat.source}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-400 font-sans">Detected At:</dt>
                            <dd className="pl-4">{new Date(threat.detectedAt ?? '').toLocaleString()}</dd>
                        </div>
                        <div>
                            <dt className="text-gray-400 font-sans">Raw Details:</dt>
                            <dd className="pl-4 whitespace-pre-wrap">{threat.details ?? "No raw details provided."}</dd>
                        </div>
                    </dl>
                )}
                {activeTab === 'evidence' && (
                    <pre className="whitespace-pre-wrap text-cyan-100 font-mono text-xs">
                        {threat.evidence ? JSON.stringify(threat.evidence, null, 2) : "No structured evidence available."}
                    </pre>
                )}
                {activeTab === 'oracle' && (
                    <div>
                        {isFetching ? (
                            <div className="flex flex-col items-center justify-center h-[126px] text-center text-gray-400">
                                <svg className="animate-spin h-8 w-8 text-cyan-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>The Oracle is contemplating...</span>
                            </div>
                        ) : error ? (
                             <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                               <p className="font-semibold">Error:</p>
                               <p>{error}</p>
                            </div>
                        ) : explanation ? (
                            <div role="article" aria-live="polite" tabIndex={-1} className="whitespace-pre-wrap text-cyan-50">
                                <pre className="m-0 whitespace-pre-wrap font-mono text-sm">{explanation}</pre>
                                <div className="mt-2 text-gray-400 text-xs">
                                    <span>Fetched: {new Date(oracleInsight?.fetchedAt || Date.now()).toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                <p className="mb-4 text-gray-400">Ask the Oracle for an explanation of impact and recommended actions.</p>
                                <button className="btn primary" onMouseEnter={playHover} onClick={() => { onExplain(threat); }} disabled={!!isFetching}>
                                    Explain with Gemini
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ThreatScanner;