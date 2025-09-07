import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useSound } from '../../hooks/useSound';

// --- Data from the metrics.json artifact ---
const initialMetrics = {
  "best_epoch": 46,
  "best_val_loss": 0.0450531505048275,
  "final_test_acc": 0.98,
  "train_loss_curve": [0.751, 0.589, 0.45, 0.35, 0.28, 0.23, 0.2, 0.17, 0.15, 0.13, 0.12, 0.11, 0.1, 0.09, 0.09, 0.08, 0.08, 0.07, 0.07, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
  "val_loss_curve": [0.65, 0.5, 0.38, 0.29, 0.23, 0.19, 0.16, 0.14, 0.12, 0.11, 0.1, 0.09, 0.09, 0.08, 0.08, 0.07, 0.07, 0.07, 0.06, 0.06, 0.06, 0.06, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.045, 0.045],
  "train_acc_curve": [0.65, 0.8, 0.88, 0.93, 0.96, 0.97, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99, 0.99],
  "val_acc_curve": [0.73, 0.85, 0.92, 0.95, 0.96, 0.97, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98, 0.98]
};

// --- CHART COMPONENT ---
interface LineChartProps {
    datasets: { label: string; data: number[]; color: string }[];
    title: string;
    yLabel: string;
    highlightIndex?: number;
}

const LineChart: React.FC<LineChartProps> = ({ datasets, title, yLabel, highlightIndex }) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; dataIndex: number } | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const width = 500;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };

    const { xScale, yScale, paths } = useMemo(() => {
        const allData = datasets.flatMap(d => d.data);
        const maxVal = Math.max(...allData, 0.001);
        const minVal = Math.min(...allData);
        const dataLength = datasets[0]?.data.length || 1;

        const xScale = (index: number) => padding.left + (index / (dataLength - 1)) * (width - padding.left - padding.right);
        const yScale = (value: number) => padding.top + ((maxVal - value) / (maxVal - minVal)) * (height - padding.top - padding.bottom);

        const paths = datasets.map(dataset => ({
            ...dataset,
            path: dataset.data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d)}`).join(' ')
        }));
        
        return { xScale, yScale, paths };
    }, [datasets]);
    
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        if (!svgRef.current) return;
        const svgRect = svgRef.current.getBoundingClientRect();
        const x = e.clientX - svgRect.left;
        const dataLength = datasets[0].data.length;
        const chartWidth = width - padding.left - padding.right;
        
        const index = Math.round(((x - padding.left) / chartWidth) * (dataLength - 1));
        
        if (index >= 0 && index < dataLength) {
            setTooltip({ x: xScale(index), y: e.clientY - svgRect.top, dataIndex: index });
        } else {
            setTooltip(null);
        }
    };

    const tooltipPosition = useMemo(() => {
        if (!tooltip) return {};
        const isRightHalf = tooltip.x > width / 2;
        const tooltipX = isRightHalf ? tooltip.x - 16 : tooltip.x + 16;
        const transform = isRightHalf ? 'translateX(-100%)' : 'translateX(0)';
        return {
            left: tooltipX,
            top: tooltip.y,
            transform: `${transform} translateY(-50%)`,
        };
    }, [tooltip, width]);

    return (
        <div className="relative p-4 bg-black/30 rounded-lg border border-orange-500/20">
            <h3 className="text-lg font-semibold text-orange-300 text-center mb-2">{title}</h3>
            <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} onMouseMove={handleMouseMove} onMouseLeave={() => setTooltip(null)} className="overflow-visible">
                {/* Axes */}
                <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="rgba(255,255,255,0.2)" />
                <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="rgba(255,255,255,0.2)" />
                
                {/* Y-axis label */}
                <text x={-height/2} y={15} transform="rotate(-90)" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">{yLabel}</text>
                
                {/* X-axis label */}
                <text x={width/2} y={height-10} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">Epoch</text>

                {/* HIGHLIGHT FOR BEST EPOCH */}
                {highlightIndex !== undefined && (
                    <g>
                        <line x1={xScale(highlightIndex)} y1={padding.top} x2={xScale(highlightIndex)} y2={height - padding.bottom} stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
                        <text x={xScale(highlightIndex) + 5} y={padding.top + 10} fill="var(--amber)" fontSize="10" className="font-bold">Best Epoch</text>
                    </g>
                )}

                {/* Data Paths */}
                {paths.map(({ label, path, color }) => (
                    <path key={label} d={path} stroke={color} fill="none" strokeWidth="2" />
                ))}

                {/* Tooltip */}
                {tooltip && (
                    <g className="pointer-events-none">
                        <line x1={tooltip.x} y1={padding.top} x2={tooltip.x} y2={height - padding.bottom} stroke="rgba(255,255,255,0.5)" strokeDasharray="4 4" />
                        {datasets.map(({ data, color }, index) => (
                             <circle
                                key={`dot-${index}`}
                                cx={tooltip.x}
                                cy={yScale(data[tooltip.dataIndex])}
                                r="4"
                                fill={color}
                                stroke="rgba(0,0,0,0.7)"
                                strokeWidth="2"
                            />
                        ))}
                    </g>
                )}
            </svg>
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-2 text-xs">
                {datasets.map(({label, color}) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{backgroundColor: color}}></div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>
            {/* Tooltip Content (HTML for better styling) */}
            {tooltip && (
                <div className="absolute z-10 p-2 text-xs bg-ink-800/90 backdrop-blur-sm border border-orange-400/50 rounded-lg shadow-lg pointer-events-none" 
                     style={tooltipPosition}>
                    <div className="font-bold mb-1 text-orange-200">Epoch: {tooltip.dataIndex + 1}</div>
                    {datasets.map(({label, data, color}) => (
                         <div key={label} className="flex items-center gap-2 text-gray-200">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: color}}></div>
                            <span>{label}: {data[tooltip.dataIndex].toFixed(4)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- METRIC CARD COMPONENT ---
interface MetricCardProps {
    label: string;
    value: string | number;
    unit?: string;
}
const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit }) => (
    <div className="p-4 bg-black/30 rounded-lg border border-orange-500/20 text-center">
        <p className="text-sm text-orange-300 tracking-wider">{label}</p>
        <p className="text-4xl font-bold text-gray-100">
            {value}
            {unit && <span className="text-lg text-gray-400 ml-1">{unit}</span>}
        </p>
    </div>
);


const MLFrameworkDemo: React.FC = () => {
    const [metrics, setMetrics] = useState(initialMetrics);
    const [isTraining, setIsTraining] = useState(false);
    const { playConfirm, playClick } = useSound();

    const handleRetrain = useCallback(() => {
        playClick();
        setIsTraining(true);
        setTimeout(() => {
            // Simulate new data by applying some noise
            const newMetrics = JSON.parse(JSON.stringify(initialMetrics));
            newMetrics.val_loss_curve = newMetrics.val_loss_curve.map((v: number) => v * (1 + (Math.random() - 0.5) * 0.1));
            newMetrics.val_acc_curve = newMetrics.val_acc_curve.map((v: number) => v * (1 + (Math.random() - 0.5) * 0.02));
            newMetrics.final_test_acc = Math.min(0.995, newMetrics.final_test_acc * (1 + (Math.random() - 0.4) * 0.03));
            newMetrics.best_val_loss = Math.min(...newMetrics.val_loss_curve);
            newMetrics.best_epoch = newMetrics.val_loss_curve.indexOf(newMetrics.best_val_loss) + 1;

            setMetrics(newMetrics);
            setIsTraining(false);
            playConfirm();
        }, 2500);
    }, [playClick, playConfirm]);

    const accuracyData = [
        { label: 'Train Accuracy', data: metrics.train_acc_curve, color: '#2dd4bf' }, // teal-400
        { label: 'Val Accuracy', data: metrics.val_acc_curve, color: '#f472b6' } // pink-400
    ];
    const lossData = [
        { label: 'Train Loss', data: metrics.train_loss_curve, color: '#818cf8' }, // indigo-400
        { label: 'Val Loss', data: metrics.val_loss_curve, color: '#fbbf24' } // amber-400
    ];

    return (
        <div className="animate-fade-in p-4 md:p-6">
            <div className="flex justify-between items-center mb-2">
                 <h1 className="text-4xl font-bold text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.4)] tracking-wider">
                    Oracle Core Training
                </h1>
                <button className="btn primary" onClick={handleRetrain} disabled={isTraining}>
                    {isTraining ? 'Training...' : 'Retrain Oracle'}
                </button>
            </div>
            <p className="text-center text-orange-200/70 max-w-3xl mx-auto mb-6">
                This dashboard visualizes the performance of the latest training cycle for the anomaly detection model. The model learns to identify unusual system behavior by minimizing loss and maximizing accuracy on validation data.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <MetricCard label="Final Test Accuracy" value={(metrics.final_test_acc * 100).toFixed(1)} unit="%" />
                <MetricCard label="Best Validation Loss" value={metrics.best_val_loss.toFixed(4)} />
                <MetricCard label="Best Epoch" value={metrics.best_epoch} />
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${isTraining ? 'opacity-30 blur-sm' : 'opacity-100'}`}>
                <div>
                    <LineChart datasets={accuracyData} title="Model Accuracy" yLabel="Accuracy" highlightIndex={metrics.best_epoch - 1} />
                    <p className="text-xs text-orange-200/60 mt-2 p-2">
                        <strong>Accuracy:</strong> Represents the percentage of correct predictions. Higher is better. The model should achieve high accuracy on both training data (teal) and unseen validation data (pink) without significant divergence, which would indicate overfitting.
                    </p>
                </div>
                <div>
                    <LineChart datasets={lossData} title="Model Loss" yLabel="Loss" highlightIndex={metrics.best_epoch - 1} />
                    <p className="text-xs text-orange-200/60 mt-2 p-2">
                        <strong>Loss:</strong> A measure of prediction error. Lower is better. The goal is to find the point (epoch) where validation loss (yellow) is at its minimum before it starts to rise, indicating the model has learned the patterns without memorizing the noise.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MLFrameworkDemo;