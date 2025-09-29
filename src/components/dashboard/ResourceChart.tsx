import React, { useMemo } from 'react';

interface HistoryPoint {
  cpu: number;
  mem: number;
  net: number;
}

interface ResourceChartProps {
  history: HistoryPoint[];
}

const ResourceChart: React.FC<ResourceChartProps> = ({ history }) => {
  const width = 200;
  const height = 80;
  const padding = { top: 5, right: 5, bottom: 5, left: 5 };

  const paths = useMemo(() => {
    const dataLength = history.length;
    if (dataLength < 2) return { cpu: '', mem: '', net: '' };

    const xScale = (index: number) => padding.left + (index / (dataLength - 1)) * (width - padding.left - padding.right);
    
    const createPath = (key: keyof HistoryPoint) => {
        const yScale = (value: number) => padding.top + ((100 - value) / 100) * (height - padding.top - padding.bottom);
        return history.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(d[key]).toFixed(2)}`).join(' ');
    };

    return {
      cpu: createPath('cpu'),
      mem: createPath('mem'),
      net: createPath('net'),
    };
  }, [history]);

  return (
    <div className="my-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
           <filter id="glow-fuchsia" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Grid lines */}
        {Array.from({ length: 3 }).map((_, i) => (
          <line key={`h-${i}`} x1={padding.left} y1={padding.top + (i + 1) * (height-padding.top-padding.bottom)/4} x2={width-padding.right} y2={padding.top + (i + 1) * (height-padding.top-padding.bottom)/4} stroke="rgba(255,255,255,0.05)" />
        ))}
        
        {/* Data Paths */}
        <path d={paths.cpu} stroke="var(--cyan)" fill="none" strokeWidth="1.5" style={{ filter: 'url(#glow-cyan)' }} />
        <path d={paths.mem} stroke="var(--fuchsia)" fill="none" strokeWidth="1.5" style={{ filter: 'url(#glow-fuchsia)' }} />
        <path d={paths.net} stroke="var(--lime)" fill="none" strokeWidth="1.5" opacity="0.7" />
      </svg>
      <div className="resource-chart-legend">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--cyan)]"></div>CPU</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--fuchsia)]"></div>Mem</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--lime)]"></div>Net</div>
      </div>
    </div>
  );
};

export default ResourceChart;