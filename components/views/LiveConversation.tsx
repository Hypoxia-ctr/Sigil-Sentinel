import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useSound } from '../../hooks/useSound';

// --- Helper Functions for Audio Processing ---

// Decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Encode Uint8Array to base64 string
function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Decode raw PCM audio data into an AudioBuffer for playback
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Create a Blob object for the Gemini API from raw audio data
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Component Types ---

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';

interface TranscriptionEntry {
  id: number;
  speaker: 'user' | 'oracle';
  text: string;
}


// --- Main Component ---

const LiveConversation: React.FC = () => {
    const [status, setStatus] = useState<ConnectionStatus>('idle');
    const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [micVolume, setMicVolume] = useState(0);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    const animationFrameRef = useRef<number>();
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const { playClick, playConfirm } = useSound();

    const cleanup = useCallback(() => {
        animationFrameRef.current && cancelAnimationFrame(animationFrameRef.current);
        streamRef.current?.getTracks().forEach(track => track.stop());
        scriptProcessorRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        sessionPromiseRef.current?.then(session => session.close());

        streamRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        analyserRef.current = null;
        scriptProcessorRef.current = null;
        sessionPromiseRef.current = null;
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        setMicVolume(0);
    }, []);

    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const visualizeMic = useCallback(() => {
        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            const volume = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
            setMicVolume(Math.min(100, volume));
        }
        animationFrameRef.current = requestAnimationFrame(visualizeMic);
    }, []);
    
    const handleStart = async () => {
        playClick();
        if (status === 'connected' || status === 'connecting') return;

        setStatus('connecting');
        setError(null);
        setTranscription([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('connected');
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        // FIX: Cast `window` to `any` to access prefixed `webkitAudioContext` for broader browser support.
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        // FIX: Cast `window` to `any` to access prefixed `webkitAudioContext` for broader browser support.
                        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

                        const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        analyserRef.current = inputAudioContextRef.current.createAnalyser();
                        analyserRef.current.fftSize = 256;
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        source.connect(analyserRef.current);
                        analyserRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);

                        visualizeMic();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle Audio Output
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            const ctx = outputAudioContextRef.current;
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => sourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }
                        
                        // Handle Interruptions
                        if (message.serverContent?.interrupted) {
                            sourcesRef.current.forEach(s => s.stop());
                            sourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }

                        // Handle Transcription
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const userInput = currentInputTranscriptionRef.current.trim();
                            const oracleOutput = currentOutputTranscriptionRef.current.trim();
                            const newEntries: TranscriptionEntry[] = [];
                            if (userInput) newEntries.push({ id: Date.now(), speaker: 'user', text: userInput });
                            if (oracleOutput) newEntries.push({ id: Date.now() + 1, speaker: 'oracle', text: oracleOutput });
                            
                            setTranscription(prev => [...prev, ...newEntries]);
                            
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        setStatus('error');
                        setError(e.message || 'An unknown connection error occurred.');
                        cleanup();
                    },
                    onclose: () => {
                        setStatus('disconnected');
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: 'You are a cybersecurity assistant named Oracle, embedded within the Sigil Sentinel dashboard. Be concise, professional, and helpful.',
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });
        } catch (e: any) {
            setStatus('error');
            setError(e.message || 'Failed to initialize the session.');
            cleanup();
        }
    };

    const handleStop = () => {
        playConfirm();
        if (status === 'connected' || status === 'connecting') {
            setStatus('disconnected');
            cleanup();
        }
    };
    
    return (
        <div className="p-6 h-full flex flex-col items-center justify-center gap-6">
            <h1 className="text-3xl font-bold text-fuchsia-400 drop-shadow-[0_2px_4px_rgba(217,70,239,0.3)]">
                Live Conversation with Oracle
            </h1>
            
            <div className="relative w-48 h-48 flex items-center justify-center">
                <div 
                    className="absolute w-full h-full rounded-full bg-fuchsia-500/10 transition-transform duration-100"
                    style={{ transform: `scale(${1 + (micVolume / 250)})` }}
                />
                <div className="relative w-32 h-32 rounded-full bg-black/30 border-2 border-fuchsia-500/50 flex items-center justify-center">
                    <button onClick={status === 'connected' ? handleStop : handleStart} className="btn primary !rounded-full !p-6">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                    </button>
                </div>
            </div>

            <div className="text-center">
                <p className="text-lg font-semibold capitalize">{status}</p>
                {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
                {status === 'idle' && <p className="text-sm text-gray-400">Press the button to start the session.</p>}
            </div>

            <div className="card w-full max-w-2xl h-64 p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Transcription</h3>
                <div className="h-full overflow-y-auto space-y-3 pr-2">
                    {transcription.map(entry => (
                        <div key={entry.id} className={`flex gap-3 ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                            {entry.speaker === 'oracle' && <div className="w-8 h-8 rounded-full bg-fuchsia-800/50 flex-shrink-0" />}
                            <div className={`p-2 rounded-lg max-w-md text-sm ${entry.speaker === 'user' ? 'bg-cyan-900/50 text-right' : 'bg-zinc-800/50'}`}>
                                {entry.text}
                            </div>
                        </div>
                    ))}
                    {transcription.length === 0 && <p className="text-center text-gray-500 pt-16">Awaiting conversation...</p>}
                </div>
            </div>
        </div>
    );
};

export default LiveConversation;
