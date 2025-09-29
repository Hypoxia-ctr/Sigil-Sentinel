import { GoogleGenAI } from "@google/genai";
import { Signal, Threat } from "../types";

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

const mockSignals: Signal[] = [
  { key: 'firewall.enabled', label: 'Firewall Status', category: 'Network', value: false, at: new Date().toISOString() },
  { key: 'os.version', label: 'Operating System Version', category: 'OS', value: '10.1.2', at: new Date().toISOString(), meta: { latest: '10.1.5' } },
  { key: 'auth.password_policy', label: 'Password Policy', category: 'Auth', value: { minLength: 6 }, at: new Date().toISOString() },
  { key: 'privacy.telemetry', label: 'Telemetry', category: 'Privacy', value: true },
  { key: 'endpoint.antivirus', label: 'Antivirus', category: 'Endpoint', value: 'active' }
];

const MOCK_THREATS: Threat[] = [
  { id: "T-2025-0001", title: "Unsigned binary executed: wrm.exe", reason: "Unsigned executable spawned from temp dir", detectedAt: new Date().toISOString(), source: "File Analyzer", severity: "high", details: "Parent: explorer.exe, Cmdline: C:\\Windows\\Temp\\wrm.exe --connect 192.168.1.2:443", explained: true },
  { id: "T-2025-0002", title: "Gateway change detected", reason: "Default gateway shifted", detectedAt: new Date().toISOString(), source: "Network Monitor", severity: "medium", details: "Previous gateway 192.168.1.1 -> 192.168.1.254", explained: false },
  { id: "T-2025-0003", title: "High entropy blob detected", reason: "Entropy > 7.8", detectedAt: new Date().toISOString(), source: "File Analyzer", severity: "critical", details: "SHA256: abcdef...; size 2.7MB; suspicious extension: .bin", explained: false },
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

export async function getSignals(): Promise<Signal[]> {
    console.log('[API MOCK] fetching /api/signals');
    await new Promise(res => setTimeout(res, 400)); // Simulate network delay
    return mockSignals;
}

export async function getThreats(): Promise<Threat[]> {
    console.log('[API MOCK] fetching /api/threats');
    await new Promise(res => setTimeout(res, 600)); // Simulate network delay
    return MOCK_THREATS;
}