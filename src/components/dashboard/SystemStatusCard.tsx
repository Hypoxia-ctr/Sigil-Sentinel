import React from 'react';
import { useSystemMetrics } from '../../hooks/useSystemMetrics';
import ResourceChart from './ResourceChart';

const SystemStatusCard: React.FC = () => {
    const { history, latestMetrics } = useSystemMetrics();

    const getStatusColor = (value: number) => {
        if (value > 85) return 'text-red-400';
        if (value > 60) return 'text-amber';
        return 'text-lime';
    };

    return (
        <div className="card hx-glow-border p-5 h-full" style={{'--glow-color': 'var(--cyan)'} as React.CSSProperties}>
            <header className="flex items-center justify-between">
                <h3 className="font-semibold tracking-wide text-cyan-100/90">System Status</h3>
                <span className="badge lime">Live</span>
            </header>
            <div className="mt-2 flex flex-col flex-grow">
                <p className="text-xs text-cyan-100/60 mb-2">Real-time resource utilization. High values may indicate system strain or anomalous activity.</p>
                <div className="flex-grow">
                  <ResourceChart history={history} />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mt-3">
                    <div>
                        <p className="text-xs text-cyan-200/70">CPU</p>
                        <p className={`text-2xl font-bold ${getStatusColor(latestMetrics.cpu)}`}>
                            {latestMetrics.cpu.toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-fuchsia-300/70">Memory</p>
                         <p className={`text-2xl font-bold ${getStatusColor(latestMetrics.mem)}`}>
                            {latestMetrics.mem.toFixed(1)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-lime/70">Network I/O</p>
                        <p className={`text-2xl font-bold ${getStatusColor(latestMetrics.net)}`}>
                            {latestMetrics.net.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemStatusCard;