import React, { useState, useCallback, useEffect } from 'react';
import { DLPPolicy, DLPIncident, DLPAction } from '../../types';
import { useSound } from '../../hooks/useSound';

// --- MOCK DATA ---
const INITIAL_POLICIES: DLPPolicy[] = [
    { id: 'pci-credit-card', name: 'PCI-DSS Compliance', description: 'Detects and blocks credit card numbers.', keywords: ['\\b(?:\\d[ -]*?){13,16}\\b'], action: 'Block', enabled: true },
    { id: 'internal-code-names', name: 'Internal Project Codewords', description: 'Audits for internal project code names.', keywords: ['Project Chimera', 'Sigil Core', 'Aegis Protocol'], action: 'Audit', enabled: true },
    { id: 'pii-ssn', name: 'PII - Social Security Numbers', description: 'Encrypts SSNs before they can be transmitted.', keywords: ['\\b\\d{3}-\\d{2}-\\d{4}\\b'], action: 'Encrypt', enabled: false },
    { id: 'confidentiality', name: 'Confidentiality Clause', description: 'Blocks any text marked as confidential.', keywords: ['confidential', 'secret', 'not for distribution'], action: 'Block', enabled: true },
];

const INITIAL_INCIDENTS: DLPIncident[] = [
    { id: 'inc-1', timestamp: new Date(Date.now() - 3600000).toISOString(), policyId: 'pci-credit-card', policyName: 'PCI-DSS Compliance', contentSnippet: '...send the payment to 4412... ending in 9012.', action: 'Block' },
    { id: 'inc-2', timestamp: new Date(Date.now() - 7200000).toISOString(), policyId: 'internal-code-names', policyName: 'Internal Project Codewords', contentSnippet: 'Briefing on Project Chimera is...', action: 'Audit' },
];

const DataLossPrevention: React.FC = () => {
    const [policies, setPolicies] = useState<DLPPolicy[]>(INITIAL_POLICIES);
    const [incidents, setIncidents] = useState<DLPIncident[]>(INITIAL_INCIDENTS);
    const [textContent, setTextContent] = useState('');
    const [analysisResult, setAnalysisResult] = useState<{ matchedPolicies: string[], highlightedHtml: string } | null>(null);
    const [editingPolicy, setEditingPolicy] = useState<DLPPolicy | null>(null);
    const { playClick, playConfirm, playHover } = useSound();

    useEffect(() => {
        const interval = setInterval(() => {
            const randomPolicy = policies[Math.floor(Math.random() * policies.length)];
            const newIncident: DLPIncident = {
                id: `inc-${Date.now()}`,
                timestamp: new Date().toISOString(),
                policyId: randomPolicy.id,
                policyName: randomPolicy.name,
                contentSnippet: `...a new violation related to ${randomPolicy.keywords[0]}...`,
                action: randomPolicy.action,
            };
            setIncidents(prev => [newIncident, ...prev.slice(0, 19)]);
        }, 30000);
        return () => clearInterval(interval);
    }, [policies]);

    const handleTogglePolicy = (id: string) => {
        playClick();
        setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    };

    const handleAnalyze = () => {
        playConfirm();
        if (!textContent) {
            setAnalysisResult(null);
            return;
        }

        const enabledPolicies = policies.filter(p => p.enabled);
        const matchedPolicies: string[] = [];
        let highlightedHtml = textContent;

        const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        enabledPolicies.forEach(policy => {
            // This is a simplified regex handler for the demo.
            // It assumes keywords starting with '\b' are regex, others are literals.
            const patterns = policy.keywords.map(kw => {
                const isRegex = kw.startsWith('\\b') && kw.endsWith('\\b');
                return isRegex ? kw : escapeRegExp(kw);
            });
            const regex = new RegExp(`(${patterns.join('|')})`, 'gi');
            
            if (regex.test(highlightedHtml)) {
                if (!matchedPolicies.includes(policy.id)) {
                    matchedPolicies.push(policy.id);
                }
                highlightedHtml = highlightedHtml.replace(regex, `<mark>$1</mark>`);
            }
        });
        setAnalysisResult({ matchedPolicies, highlightedHtml });
    };

    const handleSavePolicy = (updatedPolicy: DLPPolicy) => {
        playConfirm();
        setPolicies(prev => prev.map(p => p.id === updatedPolicy.id ? updatedPolicy : p));
        setEditingPolicy(null);
    };

    return (
        <div className="p-4 md:p-6 animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-amber drop-shadow-[0_2px_4px_rgba(255,192,67,0.3)]">Data Loss Prevention</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-3 space-y-6">
                    <PolicyManager policies={policies} onToggle={handleTogglePolicy} onEdit={(p) => { playClick(); setEditingPolicy(p); }} />
                    <IncidentLog incidents={incidents} />
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2">
                    <ContentAnalyzer 
                        textContent={textContent} 
                        setTextContent={setTextContent} 
                        onAnalyze={handleAnalyze} 
                        result={analysisResult}
                        policies={policies}
                    />
                </div>
            </div>
            
            {editingPolicy && (
                <PolicyEditModal policy={editingPolicy} onSave={handleSavePolicy} onClose={() => setEditingPolicy(null)} />
            )}
        </div>
    );
};

const PolicyManager: React.FC<{ policies: DLPPolicy[], onToggle: (id: string) => void, onEdit: (policy: DLPPolicy) => void }> = ({ policies, onToggle, onEdit }) => (
    <div className="card hx-glow-border p-4" style={{'--glow-color': 'var(--amber)'} as React.CSSProperties}>
        <h2 className="text-lg font-semibold text-amber-300 mb-3 border-b border-amber-500/10 pb-2">DLP Policies</h2>
        <div className="space-y-3">
            {policies.map(p => (
                <div key={p.id} className="p-3 bg-black/20 rounded-lg flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-200 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400 truncate">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                        <span className={`badge ${p.action === 'Block' ? 'red' : p.action === 'Encrypt' ? 'mag' : 'amber'}`}>{p.action}</span>
                        <label className="toggle-switch">
                            <input type="checkbox" checked={p.enabled} onChange={() => onToggle(p.id)} />
                            <span className="toggle-slider"></span>
                        </label>
                        <button onClick={() => onEdit(p)} className="btn ghost text-xs">Edit</button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const IncidentLog: React.FC<{ incidents: DLPIncident[] }> = ({ incidents }) => (
    <div className="card hx-glow-border p-4" style={{'--glow-color': 'var(--amber)'} as React.CSSProperties}>
        <h2 className="text-lg font-semibold text-amber-300 mb-3 border-b border-amber-500/10 pb-2">Recent Incidents</h2>
        <div className="space-y-2 h-64 overflow-y-auto pr-2">
            {incidents.map(inc => (
                <div key={inc.id} className="p-2 bg-black/20 rounded-md text-sm">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-300">{inc.policyName}</span>
                        <span className="text-xs text-gray-500">{new Date(inc.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-gray-400 italic mt-1">"{inc.contentSnippet}"</p>
                </div>
            ))}
        </div>
    </div>
);

const ContentAnalyzer: React.FC<{ textContent: string, setTextContent: (v: string) => void, onAnalyze: () => void, result: { matchedPolicies: string[], highlightedHtml: string } | null, policies: DLPPolicy[] }> = ({ textContent, setTextContent, onAnalyze, result, policies }) => (
    <div className="card hx-glow-border p-4" style={{'--glow-color': 'var(--amber)'} as React.CSSProperties}>
        <h2 className="text-lg font-semibold text-amber-300 mb-2">Content Analysis Oracle</h2>
        <p className="text-xs text-amber-100/60 mb-3">Paste text below to test against active DLP policies.</p>
        <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Paste content here..."
            className="w-full h-48 p-2 bg-black/40 border border-amber-500/30 rounded-lg focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
        />
        <button onClick={onAnalyze} className="btn primary w-full mt-3 bg-amber-600 hover:bg-amber-500">Analyze Content</button>
        {result && (
            <div className="mt-4 animate-fade-in">
                <h3 className="text-md font-semibold text-gray-200">Analysis Result:</h3>
                {result.matchedPolicies.length > 0 ? (
                    <div className="p-2 border border-amber-500/20 rounded-md bg-black/20 mt-2">
                        <p className="text-sm text-amber-300 font-semibold">Triggered Policies:</p>
                        <ul className="text-xs list-disc list-inside">
                            {result.matchedPolicies.map(pid => {
                                const policy = policies.find(p => p.id === pid);
                                return <li key={pid}>{policy?.name}</li>;
                            })}
                        </ul>
                    </div>
                ) : (
                    <p className="text-sm text-green-400 mt-2">No active policies were triggered.</p>
                )}
                <div 
                    className="mt-2 p-2 border border-amber-500/20 rounded-md bg-black/20 max-h-48 overflow-y-auto dlp-analyzer-output whitespace-pre-wrap text-sm" 
                    dangerouslySetInnerHTML={{ __html: result.highlightedHtml }} 
                />
            </div>
        )}
    </div>
);

const PolicyEditModal: React.FC<{ policy: DLPPolicy, onSave: (p: DLPPolicy) => void, onClose: () => void }> = ({ policy, onSave, onClose }) => {
    const [formData, setFormData] = useState(policy);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, keywords: e.target.value.split(',').map(k => k.trim()) }));
    };

    return (
        <div className="dlp-modal-backdrop" onClick={onClose}>
            <div className="dlp-modal" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-amber-500/20">
                    <h3 className="text-xl font-bold text-amber-300">Edit Policy</h3>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-300">Policy Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full mt-1 p-2 bg-black/40 border border-amber-500/30 rounded-lg"/>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-300">Description</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full mt-1 p-2 bg-black/40 border border-amber-500/30 rounded-lg" rows={2}></textarea>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-300">Keywords (comma-separated)</label>
                        <textarea value={formData.keywords.join(', ')} onChange={handleKeywordsChange} className="w-full mt-1 p-2 bg-black/40 border border-amber-500/30 rounded-lg" rows={3}></textarea>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-gray-300">Action</label>
                        <select name="action" value={formData.action} onChange={handleInputChange} className="w-full mt-1 p-2 bg-black/40 border border-amber-500/30 rounded-lg appearance-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%23fbbf24\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                            {(['Block', 'Audit', 'Encrypt'] as DLPAction[]).map(act => <option key={act} value={act}>{act}</option>)}
                        </select>
                    </div>
                </div>
                <div className="p-4 border-t border-amber-500/20 flex justify-end gap-3">
                    <button onClick={onClose} className="btn ghost">Cancel</button>
                    <button onClick={() => onSave(formData)} className="btn primary bg-amber-600 hover:bg-amber-500">Save Changes</button>
                </div>
            </div>
        </div>
    );
};

export default DataLossPrevention;