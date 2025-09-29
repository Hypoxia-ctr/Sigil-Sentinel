import React from "react";
import { View } from "../../types";
import SigilHeader from '../common/SigilHeader';
import { ThreatVisionCard } from '../dashboard/ThreatVisionCard';
import AnomalySpark from '../dashboard/AnomalySpark';
import { useSound } from "../../hooks/useSound";
import SystemStatusCard from "../dashboard/SystemStatusCard";
import ThreatTrendsCard from "../dashboard/ThreatTrendsCard";
import NetworkMap from "../dashboard/NetworkMap";
import { RecentEvent } from "../../hooks/useEvents";

const Dashboard: React.FC<{ 
    onChangeView: (view: View) => void;
    events: RecentEvent[];
    isConnected: boolean;
}> = ({ onChangeView, events, isConnected }) => {
  const { playClick, playHover } = useSound();

  const handleActionClick = (view: View) => {
    playClick();
    onChangeView(view);
  };

  return (
    <div className="space-y-6">
      <div className="px-6 pt-6">
        <SigilHeader />
      </div>

      <div className="dashboard-grid">
        {/* Row 1: Real-time visibility */}
        <ThreatVisionCard onChangeView={onChangeView} events={events} isConnected={isConnected} />
        
        <div className="card p-5 flex flex-col">
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
        
        {/* Row 2: Analytical/historical data */}
        <AnomalySpark />
        <ThreatTrendsCard />
        
        {/* Row 3: Overarching system status */}
        <div className="full-span">
            <SystemStatusCard />
        </div>
        
        {/* Row 4: Quick actions */}
        <div className="full-span card quick-actions">
            <button className="btn primary" onMouseEnter={playHover} onClick={() => handleActionClick(View.THREAT_SCANNER)}>Run Threat Scan</button>
            <button className="btn" onMouseEnter={playHover} onClick={() => handleActionClick(View.SYSTEM_HARDENER)}>System Hardener</button>
            <button className="btn" onMouseEnter={playHover} onClick={() => handleActionClick(View.FILE_ANALYZER)}>Analyze File</button>
            <button className="btn ghost" onMouseEnter={playHover} onClick={() => handleActionClick(View.ADMIN_CONSOLE)}>Admin Console</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;