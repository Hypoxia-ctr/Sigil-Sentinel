import React, { useEffect, useRef, useState } from "react";
import { useSound } from "../../hooks/useSound";
import { useToast } from "../../hooks/useToast";

const ClipboardCopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
);
const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12"></polyline></svg>
);


type Ward = {
  id: string;
  title: string;
  description: string;
  applied?: boolean;
  category: 'Kernel' | 'Firewall' | 'Logging' | 'System';
  impact: string;
  applyCmd: string;
  revertCmd: string;
};

const DEFAULT_WARDS: Ward[] = [
  {
    id: "sysctl-secure",
    title: "Sysctl Secure Defaults",
    description: "Tightens kernel networking and IPC parameters. Ideal for servers & exposed hosts.",
    category: 'Kernel',
    impact: 'May slightly reduce performance on high-throughput network applications. Disables certain ICMP features.',
    applyCmd: 'sudo sysctl -p /etc/sysctl.d/90-hardening.conf',
    revertCmd: '# Comment out lines in /etc/sysctl.d/90-hardening.conf and reboot',
    applied: true,
  },
  {
    id: "auditd-rules",
    title: "Auditd Ruleset",
    description: "Enables auditing for sensitive syscall paths. Ideal when you require forensic trails.",
    category: 'Logging',
    impact: 'Increases disk I/O and log volume. Requires log rotation setup to prevent disk space exhaustion.',
    applyCmd: 'sudo augenrules --load',
    revertCmd: 'sudo service auditd stop && sudo rm /etc/audit/rules.d/*',
  },
  {
    id: "nftables-baseline",
    title: "nftables Baseline",
    description: "Default host firewall ruleset. Ideal for most Linux desktops and servers.",
    category: 'Firewall',
    impact: 'Blocks all inbound traffic by default, except for established connections. May require custom rules for specific services.',
    applyCmd: 'sudo nft -f /etc/nftables.conf',
    revertCmd: 'sudo nft flush ruleset',
    applied: true,
  },
  {
    id: "journald-hard",
    title: "Journald Hardening",
    description: "Limits journal size & forward logs to remote collector. Ideal for high-uptime machines.",
    category: 'Logging',
    impact: 'Reduces local log retention period. Requires a remote syslog server to be configured for long-term storage.',
    applyCmd: 'sudo systemctl restart systemd-journald',
    revertCmd: '# Edit /etc/systemd/journald.conf and restart service',
  },
];


const STORAGE_KEY = "sigil-hardener-wards-config";

export default function SystemHardener() {
  const [wards, setWards] = useState<Ward[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        // Use saved config, but reconcile with defaults to get latest titles, descriptions, etc.
        const savedWards = JSON.parse(saved) as Ward[];
        const savedMap = new Map(savedWards.map(w => [w.id, w]));
        return DEFAULT_WARDS.map(defaultWard => 
            savedMap.has(defaultWard.id) 
            ? { ...defaultWard, applied: savedMap.get(defaultWard.id)!.applied } 
            : defaultWard
        );
      }
    } catch {}
    return DEFAULT_WARDS.slice();
  });
  const [expandedWard, setExpandedWard] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState(0);
  const { playClick, playConfirm, playHover } = useSound();
  const { addToast } = useToast();

  const prevRef = useRef<Ward[] | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wards));
  }, [wards]);

  const dragIndexRef = useRef<number | null>(null);

  function onDragStart(e: React.DragEvent, idx: number) {
    dragIndexRef.current = idx;
    e.dataTransfer.effectAllowed = "move";
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from == null || from === idx) return;
    const next = wards.slice();
    const [m] = next.splice(from, 1);
    next.splice(idx, 0, m);
    dragIndexRef.current = null;
    setWards(next);
  }
  
  const handleToggleWard = (wardId: string) => {
    playClick();
    prevRef.current = JSON.parse(JSON.stringify(wards));
    const updatedWards = wards.map(w =>
      w.id === wardId ? { ...w, applied: !w.applied } : w
    );
    const changedWard = updatedWards.find(w => w.id === wardId);
    setWards(updatedWards);
    addToast({
      title: 'Ward Configuration Updated',
      message: `Ward "${changedWard?.title}" is now ${changedWard?.applied ? 'enabled' : 'disabled'}.`,
      type: 'info'
    });
  };

  async function handleApplyEnabledWards() {
    playClick();
    
    const wardsToApply = wards.filter(w => w.applied);
    if (wardsToApply.length === 0) {
      addToast({ title: 'No Wards to Apply', message: 'There are no enabled wards in the profile.', type: 'warning' });
      return;
    }
    
    setIsApplying(true);
    setApplyProgress(0);
    
    for (let i = 0; i < wardsToApply.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setApplyProgress(((i + 1) / wardsToApply.length) * 100);
    }
    
    playConfirm();
    setIsApplying(false);
    addToast({ title: 'Profile Applied', message: `${wardsToApply.length} enabled wards have been applied.`, type: 'success' });
  }

  function handleUndo() {
    playClick();
    if (!prevRef.current) {
        addToast({ title: 'Nothing to Undo', message: 'There is no previous action to revert.', type: 'warning' });
        return;
    }
    setWards(prevRef.current);
    prevRef.current = null;
    addToast({ title: 'Undo Successful', message: 'The last change has been reverted.', type: 'info' });
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      playConfirm();
      setCopiedCmd(text);
      addToast({ title: "Command Copied", message: "The command was copied to your clipboard.", type: "success" });
      setTimeout(() => setCopiedCmd(null), 2000);
    });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">System Hardener — Wards</h2>
        <div className="flex gap-2">
          <button onClick={handleApplyEnabledWards} onMouseEnter={playHover} className="btn primary" disabled={isApplying}>
            {isApplying ? 'Applying...' : 'Apply Enabled Wards'}
          </button>
          <button onClick={handleUndo} onMouseEnter={playHover} className="btn" disabled={!prevRef.current || isApplying}>Undo Last Change</button>
        </div>
      </div>
      
       {isApplying && (
         <div className="w-full bg-zinc-800 rounded-full h-2.5 my-2 border border-yellow-500/20">
            <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${applyProgress}%`, transition: 'width 0.3s ease-in-out' }}></div>
         </div>
       )}

      <p className="text-sm text-zinc-400">Drag the wards to reorder their priority. Enable the desired wards and then apply them. Your configuration is saved automatically.</p>

      <ul className="space-y-2">
        {wards.map((w, idx) => (
          <li
            key={w.id}
            draggable={!isApplying}
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDrop={(e) => onDrop(e, idx)}
            className={`p-3 flex items-start gap-3 transition-all hx-glow-border ${isApplying ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing'}`}
            aria-grabbed={undefined}
          >
            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded border border-zinc-700">
              <span className="text-xs">{idx + 1}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100 truncate">{w.title}</h3>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{w.description}</p>
              <div className="mt-2 flex gap-4 items-center">
                 <label className="flex items-center gap-2 cursor-pointer" onMouseEnter={playHover}>
                    <div className="toggle-switch">
                        <input 
                            type="checkbox" 
                            checked={w.applied || false} 
                            onChange={() => handleToggleWard(w.id)}
                            disabled={isApplying}
                            aria-labelledby={`ward-title-${w.id}`}
                        />
                        <span className="toggle-slider"></span>
                    </div>
                    <span id={`ward-title-${w.id}`} className={`text-sm font-semibold ${w.applied ? 'text-ok' : 'text-zinc-400'}`}>
                        {w.applied ? 'Enabled' : 'Disabled'}
                    </span>
                </label>
                 <button
                  onMouseEnter={playHover}
                  onClick={() => { playClick(); setExpandedWard(expandedWard === w.id ? null : w.id); }}
                  className="btn text-sm"
                  aria-expanded={expandedWard === w.id}
                  disabled={isApplying}
                >
                  {expandedWard === w.id ? 'Hide Details' : 'View Details'}
                </button>
              </div>

               {expandedWard === w.id && (
                <div className="mt-4 p-4 bg-black/30 rounded-md border border-zinc-700 animate-fade-in space-y-3">
                  <div>
                    <h4 className="font-semibold text-zinc-300 text-sm">Potential Impact</h4>
                    <p className="text-xs text-zinc-400 mt-1">{w.impact}</p>
                  </div>
                   <div>
                    <h4 className="font-semibold text-zinc-300 text-sm">Apply Command</h4>
                    <div className="relative mt-1">
                      <pre className="text-xs bg-black/50 p-2 pr-10 rounded font-mono text-cyan-300 overflow-x-auto"><code>{w.applyCmd}</code></pre>
                      <button onMouseEnter={playHover} onClick={() => copyToClipboard(w.applyCmd)} className="absolute top-2 right-2 p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300" aria-label="Copy apply command">
                        {copiedCmd === w.applyCmd ? <CheckIcon/> : <ClipboardCopyIcon/>}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-300 text-sm">Revert Command</h4>
                     <div className="relative mt-1">
                      <pre className="text-xs bg-black/50 p-2 pr-10 rounded font-mono text-cyan-300 overflow-x-auto"><code>{w.revertCmd}</code></pre>
                       <button onMouseEnter={playHover} onClick={() => copyToClipboard(w.revertCmd)} className="absolute top-2 right-2 p-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300" aria-label="Copy revert command">
                         {copiedCmd === w.revertCmd ? <CheckIcon/> : <ClipboardCopyIcon/>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
