import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { explainWithGemini } from "../../lib/api";
import { defaultAdvicePack } from "../../lib/rules";
import { Signal, FixAction, AdvicePack, Severity, Category, AIInsightState } from "../../types";
import { useSound } from "../../hooks/useSound";
import SeveritySigil from "../common/SeveritySigil";
import { useToast } from "../../hooks/useToast";

/* ------------------------------------------------------------------
 *  Icons - Inlined SVGs to avoid external dependencies
 * ------------------------------------------------------------------*/
const IconWrapper: React.FC<React.SVGProps<SVGSVGElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>{children}</svg>
);
const CheckCircle2: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></IconWrapper>;
const Info: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></IconWrapper>;
const ShieldCheck: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></IconWrapper>;
const ShieldHalf: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M12 22V2"></path></IconWrapper>;
const Terminal: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></IconWrapper>;
const Wrench: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></IconWrapper>;
const GeminiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 3L8 7v10l4 4 4-4V7l-4-4z"></path>
        <path d="M8 7l4 4 4-4"></path>
        <path d="M12 21V11"></path>
    </svg>
);
const ThumbsUp: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M7 10v12" /><path d="M18 10h-5.5L11 4.5a2.5 2.5 0 0 0-5 0V10" /><path d="M18 10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.5" /></IconWrapper>;
const ThumbsDown: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M17 14V2" /><path d="M6 14H.5L3 19.5a2.5 2.5 0 0 0 5 0V14" /><path d="M6 14a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h2.5" /></IconWrapper>;
const RefreshCcw: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <IconWrapper {...props}><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></IconWrapper>;

/* ------------------------------------------------------------------
 *  Hook – compute risk score
 * ------------------------------------------------------------------*/
const SEV_WEIGHT: Record<Severity, number> = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 10,
};
export const useRiskScore = (actions: FixAction[]) => {
  const { raw, normalized } = useMemo(() => {
    const raw = actions.reduce((sum, a) => sum + SEV_WEIGHT[a.severity], 0);
    const normalized = Math.min(100, Math.round((raw / 40) * 100)); // Adjusted max score for demo
    return { raw, normalized };
  }, [actions]);
  return { raw, normalized };
};

/* ------------------------------------------------------------------
 *  Hook – copy to clipboard with toast
 * ------------------------------------------------------------------*/
export const useCopyToClipboard = () => {
  const [copied, setCopied] = useState<string>("");
  const { addToast } = useToast();

  const copy = useCallback(async (text: string) => {
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        addToast({ title: 'Copied to Clipboard', message: 'Command copied successfully.', type: 'success' });
      } catch (_) {
        addToast({ title: 'Copy Failed', message: 'Could not copy to clipboard.', type: 'error' });
      }
      setCopied(text);
      setTimeout(() => setCopied(""), 1500);
    }
  }, [addToast]);

  return { copy, copied };
};

/* ------------------------------------------------------------------
 *  Copy button – small helper component
 * ------------------------------------------------------------------*/
interface CopyButtonProps {
  id: string;
  label: string;
  script: string;
  copy: (txt: string) => void;
  isCopied: boolean;
}
const CopyButton = ({ id, label, script, copy, isCopied,}: CopyButtonProps) => {
    const { playConfirm, playHover } = useSound();
    return (
      <button onMouseEnter={playHover} id={id} onClick={() => { playConfirm(); copy(script); }} className={`btn ghost text-xs ${ isCopied ? "border-emerald-500 text-emerald-300" : "border-zinc-700 hover:border-zinc-600 text-zinc-300"}`} aria-pressed={isCopied}>
        <Terminal className="h-3.5 w-3.5" aria-hidden />
        {isCopied ? "Copied" : label}
      </button>
    );
};

/* ------------------------------------------------------------------
 *  Severity chip styling
 * ------------------------------------------------------------------*/
const sevChipColor = (sev: Severity, type: 'bg' | 'text' | 'border') => {
  const colors: Record<Severity, Record<typeof type, string>> = {
      low:      { bg: 'rgba(22, 163, 74, 0.1)', text: 'var(--lime)', border: 'rgba(22, 163, 74, 0.2)' },
      medium:   { bg: 'rgba(245, 158, 11, 0.1)', text: 'var(--amber)', border: 'rgba(245, 158, 11, 0.2)' },
      high:     { bg: 'rgba(192, 38, 211, 0.1)', text: 'var(--mag)', border: 'rgba(192, 38, 211, 0.2)' },
      critical: { bg: 'rgba(220, 38, 38, 0.1)', text: 'var(--red)', border: 'rgba(220, 38, 38, 0.2)' },
  };
  return colors[sev]?.[type] || '';
};

/* ------------------------------------------------------------------
 *  Component – FixActionItem
 * ------------------------------------------------------------------*/
interface FixActionItemProps {
  fx: FixAction;
  oracleInsight: AIInsightState | undefined;
  onRequestFix?: (fx: FixAction) => void;
  onGetAIInsight: (fx: FixAction) => void;
  onFeedback: (fixId: string, feedback: 'up' | 'down') => void;
  copy: (text: string) => void;
  copied: string;
}

const FixActionItem: React.FC<FixActionItemProps> = ({
  fx,
  oracleInsight,
  onRequestFix,
  onGetAIInsight,
  onFeedback,
  copy,
  copied,
}) => {
  const { playHover, playConfirm, playClick } = useSound();
  const insightRef = useRef<HTMLDivElement>(null);
  const oracleButtonText = oracleInsight?.loading ? "Asking the Oracle..." : oracleInsight?.text ? "Refresh Oracle" : "Ask the Oracle";

  useEffect(() => {
    if (oracleInsight?.text && !oracleInsight.loading) {
      insightRef.current?.focus();
    }
  }, [oracleInsight]);

  const glowColor = sevChipColor(fx.severity, 'text');

  return (
    <li
      className="hx-glow-border p-4 bg-zinc-900/60 transition-all duration-300"
      role="listitem"
      style={{ '--glow-color': glowColor } as React.CSSProperties}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <SeveritySigil severity={fx.severity} />
            <h3 className="font-semibold text-zinc-100 truncate">{fx.title}</h3>
          </div>
          <p className="mt-1 text-sm text-zinc-300">{fx.description}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`px-2 py-0.5 rounded-full border text-xs capitalize`} style={{ color: sevChipColor(fx.severity, 'text'), borderColor: sevChipColor(fx.severity, 'border'), backgroundColor: sevChipColor(fx.severity, 'bg') }}>{fx.severity}</span>
            <span className="px-2 py-0.5 rounded-full border border-zinc-700 text-xs text-zinc-300">{fx.category}</span>
            {fx.tags?.map(t => (<span key={t} className="px-2 py-0.5 rounded-full border border-zinc-700 text-xs text-zinc-400">#{t}</span>))}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2 self-start sm:self-center">
           <button onClick={() => onGetAIInsight(fx)} onMouseEnter={playHover} disabled={oracleInsight?.loading} className={`btn text-sm ${oracleInsight?.loading ? "opacity-50 cursor-wait" : "text-fuchsia-300"}`}>
              <GeminiIcon className={`h-4 w-4 ${oracleInsight?.loading ? 'animate-spin' : ''}`} /> {oracleButtonText}
           </button>
           <button onClick={() => { playConfirm(); onRequestFix?.(fx); }} onMouseEnter={playHover} disabled={!onRequestFix} className={`btn text-sm ${!onRequestFix ? "opacity-50 cursor-not-allowed" : "text-cyan-300"}`} aria-label={`Request fix for ${fx.title}`} >
            <Wrench className="h-4 w-4" /> Queue Fix
          </button>
          {fx.scripts && (
            <div className="flex flex-wrap gap-2 justify-end">
              {fx.scripts.windows && (<CopyButton id={`${fx.id}-win`} label="Win" script={fx.scripts.windows} copy={copy} isCopied={copied === fx.scripts.windows}/>)}
              {fx.scripts.linux && (<CopyButton id={`${fx.id}-li`} label="Linux" script={fx.scripts.linux} copy={copy} isCopied={copied === fx.scripts.linux} />)}
              {fx.scripts.mac && (<CopyButton id={`${fx.id}-mac`} label="macOS" script={fx.scripts.mac} copy={copy} isCopied={copied === fx.scripts.mac}/>)}
            </div>
          )}
        </div>
      </div>
      {oracleInsight && (
        <div className="mt-4 pt-4 border-t border-fuchsia-500/20 animate-fade-in" aria-live="polite">
            {oracleInsight.loading && (
                <div className="flex items-center gap-3 text-fuchsia-300">
                    <GeminiIcon className="h-5 w-5 animate-spin" />
                    <p className="text-sm">The Oracle is contemplating...</p>
                </div>
            )}
            {oracleInsight.error && (
                <div className="p-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-300 text-sm">
                   <p className="font-semibold">Error:</p>
                   <p>{oracleInsight.error}</p>
                </div>
            )}
            {oracleInsight.text && (
                <div 
                    ref={insightRef} 
                    tabIndex={-1} 
                    className="text-zinc-300 max-w-none focus:outline-none focus:ring-1 focus:ring-fuchsia-500 rounded"
                >
                    <pre className="whitespace-pre-wrap font-serif text-sm">
                        {oracleInsight.text}
                    </pre>
                    <p className="text-xs text-zinc-400 mt-4 italic">
                        Explained by Gemini Proxy on {new Date(oracleInsight.fetchedAt || Date.now()).toLocaleDateString()}.
                    </p>
                    <div className="mt-4 flex items-center gap-4">
                        <p className="text-xs text-zinc-400 m-0">Was this explanation helpful?</p>
                        <button
                            onClick={() => { playClick(); onFeedback(fx.id, 'up'); }}
                            onMouseEnter={playHover}
                            disabled={!!oracleInsight.feedback}
                            aria-pressed={oracleInsight.feedback === 'up'}
                            className={`p-1.5 rounded-full transition-colors ${
                                oracleInsight.feedback === 'up'
                                    ? 'bg-emerald-500/20 text-emerald-500'
                                    : 'hover:bg-zinc-700 disabled:opacity-50'
                            }`}
                            aria-label="Helpful"
                        >
                            <ThumbsUp className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => { playClick(); onFeedback(fx.id, 'down'); }}
                            onMouseEnter={playHover}
                            disabled={!!oracleInsight.feedback}
                            aria-pressed={oracleInsight.feedback === 'down'}
                            className={`p-1.5 rounded-full transition-colors ${
                                oracleInsight.feedback === 'down'
                                    ? 'bg-rose-500/20 text-rose-500'
                                    : 'hover:bg-zinc-700 disabled:opacity-50'
                            }`}
                            aria-label="Not helpful"
                        >
                            <ThumbsDown className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
      )}
      {fx.references && fx.references.length > 0 && (
        <div className="mt-3 text-xs text-zinc-400 flex flex-wrap gap-3 border-t border-zinc-700/50 pt-2">
          {fx.references.map(r => (<a key={r.href} href={r.href} target="_blank" rel="noreferrer" className="underline hover:text-cyan-300 hover:no-underline">{r.label}</a>))}
        </div>
      )}
    </li>
  );
}

/* ------------------------------------------------------------------
 *  UI component – SecurityAdvisor
 * ------------------------------------------------------------------*/
export interface SecurityAdvisorProps {
  signals: Signal[];
  packs?: AdvicePack[]; // default to [defaultAdvicePack]
  onRequestFix?: (fx: FixAction) => void;
  title?: string;
  oracleCache: Record<string, AIInsightState>;
  setOracleCache: React.Dispatch<React.SetStateAction<Record<string, AIInsightState>>>;
  onClearOracleCache: () => void;
}

const SECURITY_ICON = <ShieldHalf className="h-6 w-6" aria-hidden="true" />;

const SecurityAdvisor: React.FC<SecurityAdvisorProps> = ({
  signals,
  packs = [defaultAdvicePack],
  onRequestFix,
  title = "Security Advisor",
  oracleCache,
  setOracleCache,
  onClearOracleCache,
}: SecurityAdvisorProps) => {
  const actions = useMemo(() => packs.flatMap(p => p.evaluate(signals)), [packs, signals]);
  const [filter, setFilter] = useState<Category | "All">("All");
  const filtered = useMemo(
    () => (filter === "All" ? actions : actions.filter(a => a.category === filter)),
    [actions, filter]
  );
  const { normalized } = useRiskScore(actions);
  const { copy, copied } = useCopyToClipboard();
  const { playClick, playHover, playConfirm } = useSound();

  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    actions.forEach(a => counts[a.severity]++);
    return counts;
  }, [actions]);
  
  const handleGetAIInsight = useCallback(async (fixAction: FixAction) => {
    playConfirm();
    const insight = oracleCache[fixAction.id];
    if (insight?.loading) return;

    const TTL_MS = 24 * 60 * 60 * 1000;
    if (insight?.text && insight.fetchedAt && (Date.now() - insight.fetchedAt < TTL_MS)) {
        return;
    }

    const storedFeedback = localStorage.getItem(`sigil-feedback-pref:${fixAction.id}`) as 'up' | 'down' | null;

    setOracleCache(prev => ({
        ...prev,
        [fixAction.id]: {
            ...prev[fixAction.id],
            loading: true,
            text: null,
            error: null,
            feedback: prev[fixAction.id]?.feedback || storedFeedback,
        }
    }));
    
    const context = {
        signals: signals.map(s => ({ key: s.key, value: s.value, category: s.category })),
    };

    const result = await explainWithGemini(fixAction.id, context);

    if (result.text.startsWith('Explain failed:')) {
        setOracleCache(prev => ({ ...prev, [fixAction.id]: { ...prev[fixAction.id]!, loading: false, text: null, error: result.text, fetchedAt: Date.now() }}));
    } else {
        setOracleCache(prev => ({ ...prev, [fixAction.id]: { ...prev[fixAction.id]!, loading: false, text: result.text, error: null, fetchedAt: Date.now() }}));
    }
  }, [signals, oracleCache, playConfirm, setOracleCache]);

  const handleFeedback = (fixId: string, feedback: 'up' | 'down') => {
    const insight = oracleCache[fixId];
    if (!insight || !insight.text) return;
    
    try {
        const key = "sigil-gemini-feedback";
        const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
        const newEntry = { ts: new Date().toISOString(), recId: fixId, vote: feedback, text: insight.text };
        const updatedLog = [...prev, newEntry].slice(-100);
        localStorage.setItem(key, JSON.stringify(updatedLog));
        localStorage.setItem(`sigil-feedback-pref:${fixId}`, feedback);
    } catch (e) {
        console.warn("Failed to save feedback to localStorage", e);
    }

    setOracleCache(prev => ({
        ...prev,
        [fixId]: { ...prev[fixId]!, feedback: feedback }
    }));
  };

  return (
    <div
      className="space-y-6 p-6 rounded-lg"
      role="region"
      aria-labelledby="security-advisor-header"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div id="security-advisor-header" className="flex items-center gap-3 text-cyan-400">
          {SECURITY_ICON}
          <h1 className="title-depth text-3xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent tracking-wide">{title}</h1>
        </div>
        <div className="flex items-center gap-4 mt-2 sm:mt-0">
          <button onClick={onClearOracleCache} onMouseEnter={playHover} className="btn ghost text-xs" title="Clear all cached Oracle explanations">
              <RefreshCcw className="h-4 w-4" />
              <span>Clear Oracle Cache</span>
          </button>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-black/30">
            <span className="text-4xl font-bold text-zinc-100">
              {100 - normalized}
            </span>
            <div className="flex flex-col">
              <span className="text-sm align-top text-zinc-400">/100</span>
              <span className="text-xs text-zinc-400">System Score</span>
            </div>
          </div>
        </div>
      </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map(sev => (
                <div key={sev} className="p-3 bg-black/20 rounded-lg border border-zinc-800">
                    <p className="text-3xl font-bold" style={{ color: sevChipColor(sev, 'text')}}>{severityCounts[sev]}</p>
                    <p className="text-xs capitalize" style={{ color: sevChipColor(sev, 'text')}}>{sev} Risk</p>
                </div>
            ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["All", "OS", "Network", "Endpoint", "Auth", "Privacy", "Hardening"] as const).map(c => (
          <button
            key={c}
            className={`btn text-sm ${
              filter === c
                ? "bg-cyan-500/20 border-cyan-500 text-white"
                : "ghost"
            }`}
            onClick={() => { playClick(); setFilter(c); }}
            onMouseEnter={playHover}
            aria-pressed={filter === c}
          >
            {c}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-700 p-6 text-zinc-300 flex items-center gap-3" role="alert">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="font-medium">No Recommendations</div>
            <div className="text-sm text-zinc-400">
              Your system signals did not trigger any advisories. The realm is secure.
            </div>
          </div>
        </div>
      ) : (
        <ul className="space-y-3" role="list">
          {filtered.map(fx => (
            <FixActionItem
              key={fx.id}
              fx={fx}
              oracleInsight={oracleCache[fx.id]}
              onRequestFix={onRequestFix}
              onGetAIInsight={handleGetAIInsight}
              onFeedback={handleFeedback}
              copy={copy}
              copied={copied}
            />
          ))}
        </ul>
      )}
      <div className="text-xs text-zinc-500 flex items-center gap-2" role="note">
        <Info className="h-4 w-4" />
        Guidance is conservative and defensive. Always review commands before execution.
      </div>
    </div>
  );
}

export default SecurityAdvisor;
