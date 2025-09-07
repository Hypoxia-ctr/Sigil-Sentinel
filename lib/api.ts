/**
 * A secure fetch wrapper with a timeout mechanism.
 * @param input RequestInfo (URL)
 * @param init RequestInit options
 * @param ms Timeout in milliseconds
 * @returns Promise<Response>
 */
async function fetchWithTimeout(input: RequestInfo, init?: RequestInit, ms = 12000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(input, { ...(init ?? {}), signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

interface GeminiExplainResponse {
  text: string;
  provenance: string;
  model: string;
}

/**
 * Calls a server-side proxy to get an explanation from Gemini.
 * @param recId The record ID to explain.
 * @param context Additional context for the explanation.
 * @returns A promise resolving to the explanation details.
 */
export async function explainWithGemini(recId: string, context: Record<string, unknown> = {}): Promise<GeminiExplainResponse> {
  try {
    const r = await fetchWithTimeout("/api/gemini/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ recId, context }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "Could not retrieve error details.");
      throw new Error(`Upstream error: ${r.status} ${t}`);
    }

    // A real implementation might return JSON, but for this app we adapt to the text-based proxy
    const text = await r.text();
    const prov = r.headers.get("X-Explain-Provenance") ?? "";
    const model = r.headers.get("X-Explain-Model") ?? "";
    
    return { text: text.slice(0, 4000), provenance: prov, model };

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "The Oracle is silent. The connection was disturbed.";
    console.error("Gemini proxy call failed", err);
    return { text: `Explain failed: ${errorMessage}`, provenance: "", model: "" };
  }
}

// Mock data for new API endpoints
const mockEvents = [
    { id: "e1", type: "NET_SHIFT", ts: new Date().toISOString(), msg: "Gateway changed: 192.168.1.254", severity: 'Medium' },
    { id: "e2", type: "AUTH_FAIL", ts: new Date().toISOString(), msg: "ssh: failed login for root", severity: 'High' },
    { id: "e3", type: "ROGUE_PROCESS", ts: new Date().toISOString(), msg: "Unsigned binary 'wrm.exe' started", severity: 'Critical' },
];

export async function getLatestEvents(): Promise<any[]> {
    console.log('[API MOCK] fetching /api/events/latest');
    await new Promise(res => setTimeout(res, 300));
    return mockEvents.map(e => ({...e, ts: new Date().toISOString()})).sort(() => Math.random() - 0.5);
}

export async function getAnomalyScores(): Promise<{scores: number[]}> {
    console.log('[API MOCK] fetching /api/predict/anomaly');
    await new Promise(res => setTimeout(res, 500));
    const scores = Array.from({length: 50}, () => Math.random() * 0.4 + (Math.random() > 0.95 ? Math.random() * 0.6 : 0));
    return { scores };
}