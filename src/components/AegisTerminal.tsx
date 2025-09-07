import React, { useEffect, useRef, useState } from "react";

type ExecResult = { cmd: string; output: string; time: number };
type OnExecuteFn = (cmd: string) => Promise<string | void> | string | void;

const HISTORY_KEY = "sigil:terminal:history";
const HISTORY_LIMIT = 200;

export const DEFAULT_KNOWN_CMDS = [
  "harden firewall",
  "enable auditd",
  "apply nftables baseline",
  "enable journald-persistence",
  "run quickscan",
  "show status",
  "list wards",
];

export default function AegisTerminal({
  onExecute,
  knownCommands = DEFAULT_KNOWN_CMDS,
  historyKey = HISTORY_KEY,
}: {
  onExecute: OnExecuteFn;
  knownCommands?: string[];
  historyKey?: string;
}) {
  const [line, setLine] = useState("");
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      if (!raw) return [];
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  });
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [outputs, setOutputs] = useState<ExecResult[]>([]);
  const [busy, setBusy] = useState(false);
  const outRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [outputs]);

  useEffect(() => {
    try {
      localStorage.setItem(historyKey, JSON.stringify(history.slice(-HISTORY_LIMIT)));
    } catch {}
  }, [history, historyKey]);

  function pushHistory(cmd: string) {
    setHistory((prev) => {
      const next = [...prev.slice(-HISTORY_LIMIT + 1), cmd];
      return next;
    });
  }

  async function runCmd(cmd: string) {
    setBusy(true);
    try {
      const r = await Promise.resolve(onExecute?.(cmd));
      const text = typeof r === "string" ? r : r == null ? "" : String(r);
      setOutputs((o) => [...o, { cmd, output: text, time: Date.now() }]);
    // FIX: Renamed catch block variable from `err` to `error` to avoid "Cannot find name" error.
    } catch (error: any) {
      setOutputs((o) => [...o, { cmd, output: `Error: ${error?.message ?? String(error)}`, time: Date.now() }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const cmd = line.trim();
    if (!cmd) return;
    pushHistory(cmd);
    setHistIdx(null);
    setLine("");
    await runCmd(cmd);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      setHistIdx((cur) => {
        const nextIdx = cur === null ? history.length - 1 : Math.max(0, cur - 1);
        setLine(history[nextIdx] ?? "");
        return nextIdx;
      });
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (history.length === 0) return;
      setHistIdx((cur) => {
        if (cur === null) return null; // Already at new line
        const nextIdx = cur + 1;
        if (nextIdx >= history.length) {
          setLine(""); // We've moved past the end of history
          return null;
        }
        setLine(history[nextIdx] ?? "");
        return nextIdx;
      });
    } else if (e.key === "PageUp") {
      e.preventDefault();
      if (history.length === 0) return;
      setHistIdx(0);
      setLine(history[0] ?? "");
    } else if (e.key === "PageDown") {
      e.preventDefault();
      if (history.length === 0) return;
      setHistIdx(null);
      setLine("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const p = line.trim();
      if (!p) return;
      const match = knownCommands.find((c) => c.startsWith(p));
      if (match) setLine(match);
    } else if (e.key === "Enter" && !e.shiftKey) {
      handleSubmit();
    }
  }

  function clearOutput() {
    setOutputs([]);
  }

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <strong className="text-lg text-cyan-300 font-bold tracking-wider">Aegis Terminal</strong>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn ghost text-xs"
            onClick={() => {
              setLine("");
              inputRef.current?.focus();
            }}
          >
            Clear input
          </button>
          <button type="button" className="btn ghost text-xs" onClick={clearOutput}>
            Clear output
          </button>
        </div>
      </div>

      <div
        ref={outRef}
        className="h-64 overflow-y-auto bg-black/40 p-3 rounded-lg font-mono text-sm text-gray-200 whitespace-pre-wrap border border-cyan-500/10"
        aria-live="polite"
        aria-atomic="false"
      >
        {outputs.length === 0 ? (
          <div className="text-gray-500">No output — try <code>run quickscan</code>.</div>
        ) : (
          outputs.map((o, i) => (
            <div key={`${o.time}-${i}`} className="mb-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{new Date(o.time).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-start">
                <span className="text-cyan-400 mr-2 select-none">$</span>
                <p className="flex-1 text-gray-100 break-words">{o.cmd}</p>
              </div>
              {o.output && (
                <pre className="m-0 mt-1 text-gray-300 whitespace-pre-wrap">{o.output}</pre>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-2">
        <input
          ref={inputRef}
          value={line}
          onChange={(e) => setLine(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type command — Tab for completion — Enter to run"
          aria-label="Terminal input"
          className="flex-1 bg-black/20 rounded-lg py-2 px-3 font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 border border-cyan-500/10 transition-colors duration-200"
        />
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Running…" : "Run"}
        </button>
      </form>

      <div className="text-xs text-gray-500">
        <span>History: ↑/↓, PageUp/PageDown — Tab to complete — Enter to run</span>
      </div>
    </div>
  );
}