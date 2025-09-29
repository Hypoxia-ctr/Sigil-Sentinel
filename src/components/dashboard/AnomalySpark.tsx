import React, { useEffect, useState } from "react";
import { getAnomalyScores } from "../../lib/api";

export default function AnomalySpark(){
  const [scores, setScores] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAnomalyScores().then(data => {
        if (isMounted) {
            setScores(data.scores || []);
            setLoading(false);
        }
    });
    return () => { isMounted = false; };
  }, []);

  const maxScore = Math.max(...scores, 0);
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : 0;

  return (
    <div className="card hx-glow-border p-4" style={{'--glow-color': 'var(--mag)'} as React.CSSProperties}>
      <div className="flex items-center justify-between">
        <h3 className="text-cyan-100/90">Anomaly Score</h3>
        {loading ? <span className="badge">Loading...</span> : <span className={`badge ${maxScore > .7 ? 'mag':'lime'}`}>Peak: {(maxScore*100).toFixed(0)}%</span>}
      </div>
      <p className="text-xs text-cyan-100/60 mt-1">Real-time deviation from baseline system behavior. Higher scores indicate potential anomalies.</p>
      <svg viewBox="0 0 200 60" className="mt-3 w-full">
        <defs>
            <linearGradient id="spark-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--mag)" stopOpacity="0.5"/>
                <stop offset="100%" stopColor="var(--mag)" stopOpacity="0.1"/>
            </linearGradient>
        </defs>
        {scores.length > 1 && (
            <>
                <path fill="url(#spark-gradient)"
                    d={`M0,60 ${scores.map((s,i)=>`${(i/(scores.length-1))*200},${60-(s*60)}`).join(' ')} L200,60 Z`} />
                <polyline fill="none" stroke="var(--mag)" strokeOpacity=".8" strokeWidth="2"
                points={scores.map((s,i)=>`${(i/(scores.length-1))*200},${60-(s*60)}`).join(' ')}/>
            </>
        )}
      </svg>
      {!loading && (
        <div className="grid grid-cols-2 gap-4 text-center mt-3 text-xs">
            <div>
                <p className="text-gray-400">Latest</p>
                <p className="font-bold text-lg text-mag">{(latestScore * 100).toFixed(0)}%</p>
            </div>
            <div>
                <p className="text-gray-400">50-Event Avg</p>
                <p className="font-bold text-lg text-mag">{(averageScore * 100).toFixed(0)}%</p>
            </div>
        </div>
      )}
    </div>
  );
}