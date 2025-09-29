import React from 'react';
import { useThreatHistory } from '../../hooks/useThreatHistory';
import ThreatHistoryChart from './ThreatHistoryChart';

const ThreatTrendsCard: React.FC = () => {
    const history = useThreatHistory();

    return (
        <div className="card hx-glow-border p-5 h-full">
            <header>
                <h3 className="font-semibold tracking-wide text-cyan-100/90">Threat Trends</h3>
                <p className="text-xs text-cyan-100/60 mt-1">Threats detected over the last 7 days, by severity.</p>
            </header>
            <div className="mt-4">
                {history.length > 0 ? <ThreatHistoryChart history={history} /> : <div className="text-center text-gray-500">Loading trend data...</div>}
            </div>
        </div>
    );
};

export default ThreatTrendsCard;