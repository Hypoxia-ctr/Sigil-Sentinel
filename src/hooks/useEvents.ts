import { useEffect, useState } from 'react';
import { getLatestEvents } from '../lib/api';
import { connectWS } from '../lib/ws';

export type SeverityLabel = 'Critical' | 'High' | 'Medium' | 'Low';
export interface RecentEvent {
    id: string;
    type: string;
    ts: string;
    msg: string;
    severity: SeverityLabel;
}

export function useEvents(){
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;
    
    // 1. Fetch initial historical events
    getLatestEvents().then(initialEvents => {
        if(isMounted) {
            setEvents(initialEvents);
        }
    });

    // 2. Establish WebSocket connection for live updates
    ws = connectWS();
    
    ws.onopen = () => {
        if (isMounted) setIsConnected(true);
    };

    ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
            // Assuming backend sends JSON parsable events
            const newEvent: RecentEvent = JSON.parse(event.data);
            if (newEvent && newEvent.id && newEvent.msg) {
                setEvents(prevEvents => [newEvent, ...prevEvents].slice(0, 50));
            }
        } catch (error) {
            console.warn("Received non-JSON WebSocket message, treating as simple text event.", event.data);
            const fallbackEvent: RecentEvent = {
                id: `ws-${Date.now()}`,
                type: "WS_TEXT_MESSAGE",
                ts: new Date().toISOString(),
                msg: String(event.data),
                severity: 'Low'
            };
            setEvents(prevEvents => [fallbackEvent, ...prevEvents].slice(0, 50));
        }
    };

    ws.onclose = () => {
        if (isMounted) setIsConnected(false);
    };
    
    ws.onerror = () => {
        if (isMounted) setIsConnected(false);
    }

    // 3. Cleanup on unmount
    return () => {
        isMounted = false;
        if (ws) {
            ws.close();
        }
    };
  },[]);
  
  return { events, isConnected };
}