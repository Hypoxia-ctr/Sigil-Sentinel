import { useState, useEffect } from 'react';
import { Severity } from '../types';

export interface DailyThreatCount {
  date: string; // e.g., 'Mon', 'Tue'
  counts: Record<Severity, number>;
}

export const useThreatHistory = () => {
  const [history, setHistory] = useState<DailyThreatCount[]>([]);

  useEffect(() => {
    const generateHistory = () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      const last7Days: DailyThreatCount[] = [];

      for (let i = 6; i >= 0; i--) {
        const dayIndex = (today - i + 7) % 7;
        const dayName = days[dayIndex];
        
        // Mock data generation logic
        const low = Math.floor(Math.random() * 15) + 5;
        const medium = Math.floor(Math.random() * 8);
        const high = Math.random() > 0.6 ? Math.floor(Math.random() * 4) : 0;
        const critical = Math.random() > 0.9 ? 1 : 0;

        last7Days.push({
          date: dayName,
          counts: {
            low,
            medium,
            high,
            critical,
          },
        });
      }
      setHistory(last7Days);
    };

    generateHistory();
  }, []);

  return history;
};
