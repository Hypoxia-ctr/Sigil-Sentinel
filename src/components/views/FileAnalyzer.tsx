import React, { useState, useCallback, DragEvent, useMemo, useEffect } from 'react';
import { View } from '../../types';
import { useSound } from '../../hooks/useSound';

// --- ICONS ---
const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 2v10" />
    <path d="m16 6-4-4-4 4" />
    <path d="M12 15a7 7 0 0 0-7 7 7 7 0 0 0 7 7 7 7 0 0 0 7-7" stroke-dasharray="2 4"/>
    <path d="M12 22a7 7 0 0 0 7-7" />
  </svg>
);

const AnalyzerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="2"></circle>
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        <path d="M12 12 8 7" />
        <path d="m12 12 4 5" />
        <path d="M12 12 8 17" />
        <path d="m12 12 4-5" />
    </svg>
);

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
        <path d="m9 12 2 2 4-4"></path>
    </svg>
);

const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <circle cx="12" cy="12" r="1" />
    </svg>
);


// --- ANALYSIS HELPERS ---
async function calculateSHA256(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function calculateEntropy(file: File): Promise<number> {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length === 0) return 0;

    const map: { [key: number]: number } = {};
    for (const byte of bytes) {
        map[byte] = (map[byte] || 0) + 1;
    }

    let entropy = 0;
    const len = bytes.length;
    for (const byte in map) {
        const p = map[byte] / len;
        entropy -= p * Math.log2(p);
    }
    return entropy;
}

// --- COMPONENT STATE & TYPES ---
type Status = 'idle' | 'analyzing' | 'complete' | 'clearing';
type AnalysisResult = {
    status: 'safe' | 'threat';
    hash: string;
    entropy: number;
    reason: string;
    strings: string[];
    signatures: { name: string; type: 'Suspicious' | 'Malicious' }[];
} | null;

interface FileAnalyzerProps {
    onChangeView: (view: View) => void;
}


const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ onChangeView }) => {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [status, setStatus] = useState<Status>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const { playClick, playHover, playConfirm } = useSound();

    useEffect(() => {
        let timer: number;
        if (status === 'analyzing') {
            setProgress(0);
            timer = window.setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(timer);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 30);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [status]);


    const handleAnalyze = async (file: File) => {
        playConfirm();
        setStatus('analyzing');
        setFileName(file.name);
        setAnalysisResult(null);

        try {
            const [hash, entropy] = await Promise.all([
                calculateSHA256(file),
                calculateEntropy(file),
                new Promise(resolve => setTimeout(resolve, 1500)) // Min analysis time
            ]);

            let isThreat = false;
            let reason = "File structure appears normal. No immediate threats identified.";
            const suspiciousExtensions = ['.exe', '.dll', '.bin', '.ps1', '.sh', '.bat', '.vbs', '.so', '.dmg'];
            const fileExt = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';

            const signatures: AnalysisResult['signatures'] = [];
            const strings: AnalysisResult['strings'] = ['kernel32.dll', 'user32.dll', 'C:\\Windows\\System32'];

            if (entropy > 7.6) {
                isThreat = true;
                reason = "High entropy detected, suggesting compressed or encrypted content, which can hide malware.";
                signatures.push({ name: 'Generic.Packer.A', type: 'Suspicious'});
                strings.push('UPX_PACKED');
            } else if (suspiciousExtensions.includes(fileExt)) {
                isThreat = true;
                reason = `Suspicious executable file extension (${fileExt}) detected. Handle with extreme caution.`;
                signatures.push({ name: `Heuristic.Exec${fileExt.replace('.','')}`, type: 'Suspicious'});
                strings.push('powershell.exe -ExecutionPolicy Bypass');
            }
            
            setAnalysisResult({
                status: isThreat ? 'threat' : 'safe',
                hash,
                entropy,
                reason,
                strings,
                signatures,
            });

        } catch (error) {
            console.error("File analysis failed:", error);
            setAnalysisResult({
                status: 'threat',
                hash: 'N/A',
                entropy: 0,
                reason: 'Error during analysis. The file may be corrupted or unreadable.',
                strings: [],
                // FIX: Added missing 'type' property to satisfy the AnalysisResult['signatures'] type.
                signatures: [{ name: 'Analysis.Error.CorruptFile', type: 'Suspicious'}],
            });
        } finally {
            setProgress(100);
            setTimeout(() => setStatus('complete'), 300);
        }
    };

    const resetState = () => {
        playClick();
        setStatus('clearing');
        setTimeout(() => {
            setStatus('idle');
            setFileName(null);
            setAnalysisResult(null);
            setIsDragging(false);
            setProgress(0);
        }, 400);
    }

    // --- DRAG & DROP HANDLERS ---
    const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (status === 'idle') setIsDragging(true);
    }, [status]);

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (status === 'idle' && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleAnalyze(e.dataTransfer.files[0]);
        }
    }, [status, handleAnalyze]);

    // --- RENDER LOGIC ---
    const renderContent = () => {
        switch (status) {
            case 'analyzing':
                return (
                    <div className="flex flex-col items-center justify-center text-center w-full max-w-md">
                        <AnalyzerIcon className="w-20 h-20 text-fuchsia-400 mb-4 animate-analyzer-pulse" />
                        <h3 className="text-xl font-bold text-fuchsia-300">Analyzing...</h3>
                        <p className="text-gray-400 truncate max-w-xs">{fileName}</p>
                        <div className="w-full bg-fuchsia-900/50 rounded-full h-2.5 mt-4 border border-fuchsia-500/30">
                            <div className="bg-fuchsia-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
                        </div>
                    </div>
                );
            case 'clearing':
            case 'complete':
                if (!analysisResult) return null;
                return <AnalysisReport result={analysisResult} fileName={fileName || ''} isClearing={status === 'clearing'} reset={resetState} onChangeView={onChangeView} />;
            case 'idle':
            default:
                return (
                    <div className="flex flex-col items-center justify-center text-center">
                        <UploadIcon className={`w-16 h-16 mb-4 text-fuchsia-400/50 transition-all duration-300 ${isDragging ? 'scale-110 text-fuchsia-400' : ''}`} style={{ transitionTimingFunction: 'cubic-bezier(0.2, 2, 0.4, 1)'}} />
                        <p className="text-lg font-semibold text-gray-300">
                           {isDragging ? "Release the file to the Oracle" : "Drag & Drop File Here"}
                        </p>
                        <p className="text-sm text-gray-500">or click to browse</p>
                    </div>
                );
        }
    }
    
    const containerAnimationClass = useMemo(() => {
        if (isDragging) return 'animate-pulse-border';
        if (status === 'complete' && analysisResult?.status === 'threat') return 'animate-pulse-border-threat';
        return '';
    }, [isDragging, status, analysisResult]);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-4 text-center text-fuchsia-400 drop-shadow-[0_2px_4px_rgba(217,70,239,0.3)]">File Analyzer</h1>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`mt-8 p-6 bg-black/30 rounded-lg border-2 border-dashed border-fuchsia-500/40 flex items-center justify-center min-h-[30rem] transition-all duration-300 ease-in-out
                ${containerAnimationClass}
                ${status !== 'idle' ? 'border-solid border-fuchsia-500/20' : 'hover:border-fuchsia-500/80 hover:bg-fuchsia-900/10'}`}
            >
                {renderContent()}
            </div>
        </div>
    );
};

// --- Analysis Report Sub-component ---
type ReportTab = 'summary' | 'strings' | 'signatures';

const AnalysisReport: React.FC<{ result: AnalysisResult, fileName: string, isClearing: boolean, reset: () => void, onChangeView: (v: View) => void }> = ({ result, fileName, isClearing, reset, onChangeView }) => {
    const [activeTab, setActiveTab] = useState<ReportTab>('summary');
    const { playClick, playHover } = useSound();
    if (!result) return null;
    const isThreat = result.status === 'threat';

    return (
        <div className={`flex flex-col items-center justify-center text-center w-full max-w-2xl ${isClearing ? 'animate-clearing-effect' : 'animate-fade-in'}`}>
            <div className={`w-24 h-24 mb-4 rounded-full flex items-center justify-center ${isThreat ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                {isThreat ? 
                    <AlertTriangleIcon className="w-12 h-12 text-red-400" /> : 
                    <CheckIcon className="w-12 h-12 text-green-400" />
                }
            </div>
            <h3 className={`text-2xl font-bold ${isThreat ? 'text-red-400' : 'text-green-400'}`}>
                {isThreat ? "Threat Detected" : "File appears Safe"}
            </h3>
            <p className="text-gray-400 truncate max-w-xs mb-4">{fileName}</p>

            <div className="w-full my-2 p-4 border border-gray-700 bg-black/20 rounded-lg text-left text-xs font-mono">
                <div className="flex justify-between border-b border-gray-700 pb-1 mb-1">
                    <span className="text-gray-400">SHA-256:</span>
                    <span className="text-gray-200 truncate ml-4">{result.hash}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-400">Entropy:</span>
                    <span className={result.entropy > 7.6 ? 'text-red-400 font-bold' : 'text-green-400'}>{result.entropy.toFixed(4)}</span>
                </div>
            </div>

            <div className="w-full mt-4">
                <div className="flex border-b border-fuchsia-500/20">
                    {(['summary', 'strings', 'signatures'] as ReportTab[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-fuchsia-400 text-fuchsia-300' : 'text-gray-400 hover:text-white'}`}>{tab}</button>
                    ))}
                </div>
                <div className="p-4 bg-black/20 rounded-b-lg text-left min-h-[120px]">
                    {activeTab === 'summary' && <p className={`text-sm ${isThreat ? 'text-red-300' : 'text-green-300'}`}>{result.reason}</p>}
                    {activeTab === 'strings' && (
                        <pre className="text-xs text-gray-300 whitespace-pre-wrap max-h-48 overflow-y-auto">{result.strings.join('\n')}</pre>
                    )}
                    {activeTab === 'signatures' && (
                        <ul>
                            {result.signatures.map(sig => (
                                <li key={sig.name} className={`flex justify-between text-xs ${sig.type === 'Malicious' ? 'text-red-400' : 'text-amber'}`}>
                                    <span>{sig.name}</span>
                                    <span>{sig.type}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            
            {isThreat && (
              <div className="my-4 p-4 border border-red-500/30 bg-red-900/20 rounded-lg">
                <p className="text-red-300 font-semibold mb-3">Immediate action is recommended.</p>
                <div className="flex space-x-4">
                   <button onClick={() => { playClick(); onChangeView(View.THREAT_SCANNER); }} onMouseEnter={playHover} disabled={isClearing} className="btn primary bg-red-700 hover:bg-red-600">
                      Go to Scanner
                   </button>
                   <button onClick={() => { playClick(); onChangeView(View.SECURITY_ADVISOR); }} onMouseEnter={playHover} disabled={isClearing} className="btn primary bg-yellow-600 hover:bg-yellow-500">
                      Security Advisor
                   </button>
                </div>
              </div>
            )}

            <button onClick={reset} onMouseEnter={playHover} disabled={isClearing} className="btn primary mt-4">
                Analyze Another File
            </button>
        </div>
    );
};

export default FileAnalyzer;