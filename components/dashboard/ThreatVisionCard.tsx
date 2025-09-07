import React from 'react';
import { useEvents } from '../../hooks/useEvents';
import { View, Severity } from '../../types';
import SeveritySigil from '../SeveritySigil';
import { useSound } from '../../hooks/useSound';

type SeverityLabel = 'Critical' | 'High' | 'Medium' | 'Low';
interface RecentEvent {
    id: string;
    type: string;
    ts: string;
    msg: string;
    severity: SeverityLabel;
}

export function ThreatVisionCard({ onChangeView }: { onChangeView: (view: View) => void }) {
  const items = useEvents();
  const { playClick, playHover } = useSound();
  
  const sevClass = (s: SeverityLabel) => {
    switch(s.toLowerCase()) {
        case 'critical': return 'badge red';
        case 'high': return 'badge mag';
        case 'medium': return 'badge amber';
        default: return 'badge';
    }
  }

  return (
    <section className="card card-ornamented p-5">
      <header className="flex items-center justify-between">
        <h3 className="font-semibold tracking-wide text-cyan-100/90">Threat Vision</h3>
        <span className="badge lime">Live</span>
      </header>
      <ul className="mt-4 space-y-3 h-48 overflow-y-auto pr-2">
        {items.map((x: RecentEvent)=>(
          <li key={x.id} className="group animate-fade-in" onMouseEnter={playHover}>
            <div className="flex items-start justify-between gap-3 rounded-xl p-3 bg-white/0 hover:bg-white/[.02] transition">
              <div>
                <div className="text-cyan-50">{x.type}</div>
                <div className="text-cyan-100/60 text-sm">{x.msg}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SeveritySigil severity={x.severity.toLowerCase() as Severity} />
                <span className={sevClass(x.severity)}>{x.severity.toUpperCase()}</span>
                <time className="text-xs text-cyan-200/50">{new Date(x.ts).toLocaleTimeString()}</time>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="cta-row mt-3">
          <button className="btn ghost" onMouseEnter={playHover} onClick={() => { playClick(); onChangeView(View.THREAT_SCANNER); }}>View All Threats</button>
      </div>
    </section>
  );
}