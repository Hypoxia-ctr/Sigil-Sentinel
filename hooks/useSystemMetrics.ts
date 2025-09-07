import { useState, useEffect } from 'react';

export interface HistoryPoint {
  cpu: number;
  mem: number;
  net: number;
}

const HISTORY_LENGTH = 50;

export const useSystemMetrics = () => {
  const [history, setHistory] = useState<HistoryPoint[]>(() => 
    Array.from({ length: HISTORY_LENGTH }, () => ({ cpu: 0, mem: 0, net: 0 }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prevHistory => {
        const last = prevHistory[prevHistory.length - 1] || { cpu: 20, mem: 30, net: 5 };
        
        const newCpu = Math.max(5, Math.min(95, last.cpu + (Math.random() - 0.5) * 10));
        const newMem = Math.max(10, Math.min(90, last.mem + (Math.random() - 0.45) * 8));
        const newNet = Math.max(0, Math.min(100, last.net + (Math.random() - 0.6) * 15 + (Math.random() > 0.9 ? 20 : -5) ));

        const newPoint: HistoryPoint = {
          cpu: newCpu,
          mem: newMem,
          net: Math.max(0, newNet), // Ensure net doesn't go below 0
        };

        const newHistory = [...prevHistory.slice(1), newPoint];
        return newHistory;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const latestMetrics = history[history.length - 1];

  return { history, latestMetrics };
};
