import React from 'react';
import { DailyThreatCount } from '../../hooks/useThreatHistory';
import { Severity } from '../../types';

interface ThreatHistoryChartProps {
  history: DailyThreatCount[];
}

const SEVERITY_ORDER: Severity[] = ['critical', 'high', 'medium', 'low'];
const SEVERITY_COLORS: Record<Severity, string> = {
  critical: 'var(--red)',
  high: 'var(--mag)',
  medium: 'var(--amber)',
  low: 'var(--lime)',
};

const ThreatHistoryChart: React.FC<ThreatHistoryChartProps> = ({ history }) => {
  const width = 400;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const maxTotal = Math.max(...history.map(day => 
    Object.values(day.counts).reduce((sum, count) => sum + count, 0)
  ), 1);

  const xScale = (index: number) => padding.left + (index * (width - padding.left - padding.right)) / history.length;
  const yScale = (value: number) => height - padding.bottom - (value / maxTotal) * (height - padding.top - padding.bottom);
  const barWidth = ((width - padding.left - padding.right) / history.length) * 0.7;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Y-axis grid lines and labels */}
        {Array.from({ length: 5 }).map((_, i) => {
          const y = padding.top + (i * (height - padding.top - padding.bottom)) / 4;
          const value = Math.round(maxTotal * (1 - i / 4));
          return (
            <g key={`y-grid-${i}`} className="text-xs text-gray-500">
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(255,255,255,0.05)" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="currentColor">{value}</text>
            </g>
          );
        })}

        {/* Bars */}
        {history.map((day, index) => {
          let currentY = 0;
          const totalForDay = SEVERITY_ORDER.reduce((sum, sev) => sum + day.counts[sev], 0);

          return (
            <g key={day.date} transform={`translate(${xScale(index)}, 0)`}>
              {SEVERITY_ORDER.map(severity => {
                const count = day.counts[severity];
                if (count === 0) return null;
                const barHeight = (count / maxTotal) * (height - padding.top - padding.bottom);
                const yPos = yScale(currentY + count);
                currentY += count;
                return (
                  <rect
                    key={severity}
                    x={0}
                    y={yPos}
                    width={barWidth}
                    height={barHeight}
                    fill={SEVERITY_COLORS[severity]}
                  >
                    <title>{`${day.date} - ${severity}: ${count}`}</title>
                  </rect>
                );
              })}
              <text x={barWidth / 2} y={height - padding.bottom + 15} textAnchor="middle" className="text-xs fill-current text-gray-400">
                {day.date}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-center items-center gap-4 mt-2 text-xs text-gray-400">
        {SEVERITY_ORDER.map(severity => (
          <div key={severity} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: SEVERITY_COLORS[severity] }} />
            <span className="capitalize">{severity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThreatHistoryChart;
