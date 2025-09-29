/**
 * Establishes a WebSocket connection to the backend service.
 * @param url The WebSocket URL. If not provided, it defaults based on the window location.
 * @returns The WebSocket instance.
 */
export function connectWS(url?: string) {
  if (!url) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = '8000'; // Default FastAPI backend port from build sheet
    url = `${proto}//${host}:${port}/ws`;
  }
  
  const ws = new WebSocket(url);

  ws.onopen = () => {
    console.log(`[WS] Connection established to ${url}`);
    ws.send('Sigil Sentinel FE connected');
  };

  ws.onclose = (event) => {
    console.log(`[WS] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
  };

  ws.onerror = (error) => {
    console.error('[WS] Error:', error);
  };

  return ws;
}
