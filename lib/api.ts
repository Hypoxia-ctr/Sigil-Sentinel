import { GoogleGenAI } from "@google/genai";

interface GeminiExplainResponse {
  text: string;
  provenance?: string;
  model?: string;
}

/**
 * Calls the Gemini API to get an explanation for a security threat.
 * @param recId The record ID to explain (used for context, though not sent to API).
 * @param context Additional context about the threat for the explanation.
 * @returns A promise resolving to the explanation details.
 */
export async function explainWithGemini(recId: string, context: Record<string, unknown> = {}): Promise<GeminiExplainResponse> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `You are a senior cybersecurity analyst called The Oracle.
A security threat has been detected. Your role is to provide a concise and clear explanation of the potential impact and recommend specific actions for remediation.
Do not use markdown formatting. Structure your response with clear headings for "Impact" and "Recommended Actions".

Threat Details:
${JSON.stringify(context, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text;

    if (!text) {
      throw new Error("Received an empty response from the Oracle.");
    }
    
    return { text, model: 'gemini-2.5-flash' };

  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "The Oracle is silent. The connection was disturbed.";
    console.error("Gemini API call failed", err);
    return { text: `Explain failed: ${errorMessage}` };
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