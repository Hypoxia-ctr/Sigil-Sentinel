import React, { useMemo } from 'react';

interface CpuChartProps {
  history: number[];
}

const CpuChart: React.FC<CpuChartProps> = ({ history }) => {
  const width = 200;
  const height = 80;
  const padding = { top: 5, right: 5, bottom: 5, left: 5 };

  const { path, areaPath } = useMemo(() => {
    const dataLength = history.length;
    if (dataLength < 2) return { path: '', areaPath: '' };

    const xScale = (index: number) => padding.left + (index / (dataLength - 1)) * (width - padding.left - padding.right);
    const yScale = (value: number) => padding.top + ((100 - value) / 100) * (height - padding.top - padding.bottom);
    
    const pathData = history.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(2)} ${yScale(d).toFixed(2)}`).join(' ');
    const areaPathData = `${pathData} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
    
    return { path: pathData, areaPath: areaPathData };
  }, [history]);

  return (
    <div className="my-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <filter id="glow-cyan-cpu" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
           <linearGradient id="cpu-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0"/>
            </linearGradient>
        </defs>
        {/* Grid lines */}
        {Array.from({ length: 3 }).map((_, i) => (
          <line key={`h-${i}`} x1={padding.left} y1={padding.top + (i + 1) * (height-padding.top-padding.bottom)/4} x2={width-padding.right} y2={padding.top + (i + 1) * (height-padding.top-padding.bottom)/4} stroke="rgba(255,255,255,0.05)" />
        ))}
        
        {/* Fill Area */}
        <path d={areaPath} fill="url(#cpu-gradient)" />

        {/* Data Path */}
        <path d={path} stroke="var(--cyan)" fill="none" strokeWidth="1.5" style={{ filter: 'url(#glow-cyan-cpu)' }} />
      </svg>
      <div className="resource-chart-legend">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--cyan)]"></div>CPU Usage</div>
      </div>
    </div>
  );
};

export default CpuChart;