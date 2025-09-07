import React from "react";
import { View } from "../../types";
import SigilHeader from '../SigilHeader';
import { ThreatVisionCard } from '../dashboard/ThreatVisionCard';
import AnomalySpark from '../dashboard/AnomalySpark';
import { useSound } from "../../hooks/useSound";
import SystemStatusCard from "../dashboard/SystemStatusCard";
import ThreatTrendsCard from "../dashboard/ThreatTrendsCard";
import NetworkMap from "../dashboard/NetworkMap";

const Dashboard: React.FC<{ onChangeView: (view: View) => void }> = ({ onChangeView }) => {
  const { playClick, playHover } = useSound();

  const handleActionClick = (view: View) => {
    playClick();
    onChangeView(view);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigilHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ThreatVisionCard onChangeView={onChangeView} />
        </div>
        
        <div className="card p-5 h-full flex flex-col">
          <header>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold tracking-wide text-cyan-100/90">Subnet Map</h3>
              <span className="badge lime">Live</span>
            </div>
            <p className="text-xs text-cyan-100/60 mt-1">Live visualization of local network traffic.</p>
          </header>
          <div className="flex-grow flex items-center justify-center min-h-[150px]">
            <NetworkMap />
          </div>
        </div>

        <AnomalySpark />
        <ThreatTrendsCard />
        <SystemStatusCard />

      </div>

      <div>
        {/* FIX: Casted style object to React.CSSProperties to allow for CSS custom properties. */}
        <section className="p-5 hx-glow-border" style={{ '--glow-color': 'var(--mag)' } as React.CSSProperties}>
            <h3 className="font-semibold tracking-wide text-cyan-100/90">Quick Actions</h3>
             <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="btn primary justify-center" onMouseEnter={playHover} onClick={() => handleActionClick(View.THREAT_SCANNER)}>Run Threat Scan</button>
                <button className="btn justify-center" onMouseEnter={playHover} onClick={() => handleActionClick(View.SYSTEM_HARDENER)}>System Hardener</button>
                <button className="btn justify-center" onMouseEnter={playHover} onClick={() => handleActionClick(View.FILE_ANALYZER)}>Analyze File</button>
                <button className="btn ghost justify-center" onMouseEnter={playHover} onClick={() => handleActionClick(View.ADMIN_CONSOLE)}>Admin Console</button>
            </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;