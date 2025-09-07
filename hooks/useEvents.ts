import { useEffect, useState } from 'react';
import { getLatestEvents } from '../lib/api';

type SeverityLabel = 'Critical' | 'High' | 'Medium' | 'Low';
interface RecentEvent {
    id: string;
    type: string;
    ts: string;
    msg: string;
    severity: SeverityLabel;
}

export function useEvents(){
  const [items, setItems] = useState<RecentEvent[]>([]);
  
  useEffect(() => {
    let isMounted = true;
    
    getLatestEvents().then(initialEvents => {
        if(isMounted) {
            setItems(initialEvents);
        }
    });

    const intervalId = setInterval(() => {
        // Simulate a new event from WebSocket
        const newEvent: RecentEvent = { 
            id: `e-${Date.now()}`, 
            type: "RANDOM_EVENT", 
            ts: new Date().toISOString(), 
            msg: "A new simulated event occurred.", 
            severity: 'Low' 
        };
        if (Math.random() > 0.8) {
            newEvent.type = "AUTH_FAIL";
            newEvent.msg = "Simulated ssh failed login";
            newEvent.severity = "High";
        }
        setItems(prevItems => [newEvent, ...prevItems].slice(0, 50));
    }, 5000);

    return () => {
        isMounted = false;
        clearInterval(intervalId);
    };
  },[]);
  
  return items;
}