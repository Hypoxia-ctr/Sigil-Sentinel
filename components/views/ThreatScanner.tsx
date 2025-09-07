import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Threat, Severity } from "../../types";
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
  },
  {
    id: "T-2025-0003",
    title: "High entropy blob detected (packed file)",
    reason: "Entropy > 7.8",
    detectedAt: new Date().toISOString(),
    source: "File Analyzer",
    severity: "critical",
    details: "SHA256: abcdef...; size 2.7MB; suspicious extension: .bin",
  },
];

/** ----- Component ----- */
const ThreatScanner: React.FC<{ onChangeView: (view: View) => void }> = ({ onChangeView }) => {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [explainCache, setExplainCache] = useState<Record<string, { text: string; provenance?: string; model?: string; fetchedAt: string }>>({});
  const [fetching, setFetching] = useState<Record<string, boolean>>({});
  const [filterSeverity, setFilterSeverity] = useState<"all" | Severity | "unseen">("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const { playClick, playConfirm, playHover } = useSound();
  const { addToast } = useToast();

  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    setThreats(MOCK_THREATS);
    return () => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
    }
  }, []);

  const sources = useMemo(() => {
    const uniqueSources = new Set(threats.map(t => t.source).filter(Boolean));
    return ['all', ...Array.from(uniqueSources)] as string[];
  }, [threats]);

  const visible = useMemo(() => {
    return threats.filter(t => {
      const severityMatch = filterSeverity === "all" || (filterSeverity === "unseen" ? !explainCache[t.id] : t.severity === filterSeverity);
      const sourceMatch = filterSource === "all" || t.source === filterSource;
      return severityMatch && sourceMatch;
    });
  }, [threats, filterSeverity, filterSource, explainCache]);

  const handleExplain = async (threat: Threat) => {
    if (fetching[threat.id]) return;
    
    playConfirm();
    setFetching(f => ({ ...f, [threat.id]: true }));
    const context = {
        source: threat.source,
        severity: threat.severity,
        evidence: threat.evidence ?? {},
        details: threat.details ?? threat.reason ?? "",
    };
    
    const res = await explainWithGemini(threat.id, context);

    setExplainCache(prev => ({
        ...prev,
        [threat.id]: { ...res, fetchedAt: new Date().toISOString() },
    }));
    setExpanded(prev => ({ ...prev, [threat.id]: true }));
    setFetching(f => ({ ...f, [threat.id]: false }));
  };

  const handleExplainDebounced = (threat: Threat) => {
    if (explainCache[threat.id]) {
      setExpanded(prev => ({ ...prev, [threat.id]: true }));
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => handleExplain(threat), 350);
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
  
  const handleFilterClick = (filter: "all" | Severity | "unseen") => {
    playClick();
    setFilterSeverity(filter);
  }
  
  const handleSourceClick = (source: string) => {
    playClick();
    setFilterSource(source);
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
              <button className={`pill ${filterSeverity === "unseen" ? "pill-active" : ""}`} onMouseEnter={playHover} onClick={() => handleFilterClick("unseen")}>Unexplained</button>
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
                            explainCache={explainCache}
                            fetching={fetching}
                            onExplain={handleExplainDebounced}
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
    explainCache: Record<string, any>;
    fetching: Record<string, boolean>;
    onExplain: (t: Threat) => void;
    onQueueFix: (t: Threat) => void;
    onChangeView: (v: View) => void;
}> = ({ threat, explainCache, fetching, onExplain, onQueueFix, onChangeView }) => {
    const [activeTab, setActiveTab] = useState<DetailsTab>('details');
    const { playClick, playHover } = useSound();
    // FIX: `addToast` was not defined. It's now available via the useToast hook.
    const { addToast } = useToast();
    const cache = explainCache[threat.id];
    const isFetching = Boolean(fetching[threat.id]);

    useEffect(() => {
        if(cache) {
            setActiveTab('oracle');
        }
    }, [cache]);

    return (
        <div id={`details-${threat.id}`} role="region" aria-label={`${threat.title} details`} className="mt-3 border-t border-white/5 pt-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex border-b border-zinc-700">
                    {(['details', 'evidence', 'oracle'] as DetailsTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>{tab}</button>
                    ))}
                </div>
                 <div className="flex items-center gap-2">
                    <button className="btn" onMouseEnter={playHover} onClick={() => { playClick(); navigator.clipboard?.writeText(JSON.stringify(threat)); addToast({ title: 'Evidence Copied', message: 'Threat details copied to clipboard.', type: 'success' }); }}>
                        <ClipboardCopy className="h-4 w-4" /> Copy
                    </button>
                    <button className="btn primary" onMouseEnter={playHover} onClick={() => { playClick(); onQueueFix(threat); }}>Queue Fix</button>
                    <button className="btn ghost" onMouseEnter={playHover} onClick={() => { playClick(); onChangeView(View.SECURITY_ADVISOR); }}>Advisor</button>
                </div>
            </div>
            <div className="mt-3 p-3 bg-[#071019] rounded-lg min-h-[150px]">
                {activeTab === 'details' && (
                    <pre className="whitespace-pre-wrap text-cyan-100 font-mono text-xs">{threat.details ?? "No raw details available."}</pre>
                )}
                {activeTab === 'evidence' && (
                    <pre className="whitespace-pre-wrap text-cyan-100 font-mono text-xs">
                        {threat.evidence ? JSON.stringify(threat.evidence, null, 2) : "No structured evidence available."}
                    </pre>
                )}
                {activeTab === 'oracle' && (
                    <div>
                        {cache ? (
                            <div role="article" aria-live="polite" tabIndex={-1} className="whitespace-pre-wrap text-cyan-50">
                                <pre className="m-0 whitespace-pre-wrap font-mono text-sm">{cache.text}</pre>
                                <div className="mt-2 text-gray-400 text-xs">
                                    {cache.provenance && <span>Provenance: {cache.provenance} • </span>}
                                    {cache.model && <span>Model: {cache.model} • </span>}
                                    <span>Fetched: {new Date(cache.fetchedAt).toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <p className="mb-4 text-gray-400">Ask the Oracle for an explanation of impact and recommended actions.</p>
                                <button className="btn primary" onMouseEnter={playHover} onClick={() => { playClick(); onExplain(threat); }} disabled={isFetching}>
                                    {isFetching ? "Explaining…" : "Explain with Gemini"}
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