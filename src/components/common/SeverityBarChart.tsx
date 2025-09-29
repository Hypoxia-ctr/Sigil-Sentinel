import React from 'react';
import { Severity } from '../../types';

interface SeverityBarChartProps {
    counts: Record<Severity, number>;
}

const SeverityBarChart: React.FC<SeverityBarChartProps> = ({ counts }) => {
    const severities: Severity[] = ['low', 'medium', 'high', 'critical'];
    const total = severities.reduce((sum, sev) => sum + counts[sev], 0);
    const maxCount = Math.max(...severities.map(sev => counts[sev]), 1);

    const colorMap: Record<Severity, string> = {
        low: 'var(--lime)',
        medium: 'var(--amber)',
        high: 'var(--mag)',
        critical: 'var(--danger)',
    };

    return (
        <div className="w-full h-20 flex items-end justify-around gap-2 p-2 bg-black/20 rounded-md border border-indigo-500/10">
            {severities.map(sev => {
                const height = total > 0 ? `${(counts[sev] / maxCount) * 90 + 5}%` : '5%';
                return (
                    <div key={sev} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <div className="text-indigo-200 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity -mb-1">
                            {counts[sev]}
                        </div>
                        <div
                            className="w-full rounded-t-sm transition-all duration-300"
                            style={{ height: height, backgroundColor: colorMap[sev], boxShadow: `0 0 8px ${colorMap[sev]}` }}
                        />
                        <div className="text-xs capitalize text-gray-400 mt-1">{sev}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default SeverityBarChart;