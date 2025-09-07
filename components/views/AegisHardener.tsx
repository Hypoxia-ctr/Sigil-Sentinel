import React, { useState, useEffect, ReactNode } from 'react';
import AegisTerminal from '../AegisTerminal';

// --- ICONS ---
const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const CpuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
);
const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 7h6m-5 3h4m-3 3h2M4 12a8 8 0 1116 0c0 4.418-3.582 8-8 8s-8-3.582-8-8zm8-10v2m0 16v2m-8-9H2m20 0h-2m-3.9-5.1L4.5 7.5M19.5 7.5l-3.6 3.6" /></svg>
);
const GaugeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M12 1v2m5.66 2.34l-1.42 1.42M19 12h-2m-2.34 5.66l-1.42-1.42M12 19v2m-5.66-2.34l1.42-1.42M5 12h2m2.34-5.66l1.42 1.42" /></svg>
);


// --- HELPER COMPONENTS ---

const AegisGauge: React.FC<{ label: string; value: number; icon: ReactNode; color: string }> = ({ label, value, icon, color }) => {
    const circumference = 2 * Math.PI * 28;
    const offset = circumference - (value / 100) * circumference;
    const valueColor = value > 90 ? 'text-green-400' : value > 70 ? 'text-yellow-400' : 'text-red-400';

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-black/30 border border-yellow-500/10 rounded-lg text-center">
            <div className="relative w-24 h-24 mb-2">
                <svg className="w-full h-full" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" strokeWidth="4" className="stroke-yellow-500/10" fill="none" />
                    <circle
                        cx="32" cy="32" r="28" strokeWidth="4"
                        className={`transform -rotate-90 origin-center transition-all duration-500 ${color}`}
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-yellow-300">
                    {icon}
                </div>
            </div>
            <div className={`text-2xl font-bold ${valueColor}`}>{value.toFixed(0)}<span className="text-base">%</span></div>
            <p className="text-xs text-gray-400 tracking-wider uppercase">{label}</p>
        </div>
    );
};

const StatusListItem: React.FC<{ label: string; status: 'Hardened' | 'Active' | 'Inactive' }> = ({ label, status }) => {
    const statusStyles = {
        Hardened: { text: 'text-green-400', bg: 'bg-green-500', dot: 'shadow-[0_0_8px_theme(colors.green.500)]' },
        Active: { text: 'text-yellow-400', bg: 'bg-yellow-500', dot: 'shadow-[0_0_8px_theme(colors.yellow.500)]' },
        Inactive: { text: 'text-red-500', bg: 'bg-red-500', dot: 'shadow-[0_0_8px_theme(colors.red.500)]' },
    };
    const styles = statusStyles[status];
    return (
        <div className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-md">
            <span className="text-gray-300">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${styles.bg} ${styles.dot}`}></div>
                <span className={`text-xs font-bold ${styles.text}`}>{status.toUpperCase()}</span>
            </div>
        </div>
    );
};

// FIX: Changed the return type from React.ReactNode to string to match the expected type for the `onExecute` prop.
const getCommandResponse = (cmd: string): string => {
    const lowerCmd = cmd.toLowerCase();
    if (lowerCmd === 'help') return `Available commands:\n  status              - Overall system security status.\n  harden firewall     - Apply hardened firewall rules.\n  network inventory   - List active devices on the subnet.\n  ml status           - Check anomaly detection model status.\n  ml train            - Force a retraining cycle for the ML model.`;
    if (lowerCmd.includes('status')) return `[OK] Aegis services are active.\n[OK] Firewall wards at 98%.\n[OK] Anomaly detection core is vigilant.\n[OK] System integrity verified.`;
    if (lowerCmd.includes('harden firewall')) return `Hardening firewall...\n[✔] Applying deny-by-default policy.\n[✔] Configuring ssh_hosts_v4 set.\n[✔] Enabling nftables service.\nFirewall hardened.`;
    if (lowerCmd.includes('network inventory')) return `Scanning subnet...\nHost: 127.0.0.1 (localhost) - Status: Active\nHost: 192.168.1.1 (gateway) - Status: Active`;
    if (lowerCmd.includes('ml status')) return `Aegis ML Anomaly Detector\nStatus: IDLE\nEvents since last training: 125 / 800`;
    if (lowerCmd.includes('ml train')) return `Initiating ML training cycle...\nEpoch 1/10 - loss: 0.1234, acc: 0.95\nEpoch 2/10 - loss: 0.0876, acc: 0.97\n...\nTraining complete. Model updated.`;
    return `Unknown command: "${cmd}". Type 'help' for available commands.`;
};

const KNOWN_COMMANDS = [
    'help', 
    'status', 
    'harden firewall', 
    'network inventory', 
    'ml status', 
    'ml train'
];

const initialOutput = [{
    cmd: '',
    output: `Aegis Command Interface Initialized. Type 'help' for commands.`,
    time: Date.now()
}];


const AegisHardener: React.FC = () => {
    const [scores, setScores] = useState({ firewall: 98, kernel: 92, ml: 75, overall: 88 });

    useEffect(() => {
        const interval = setInterval(() => {
            setScores(prev => ({
                ...prev,
                ml: Math.min(100, prev.ml + 0.1),
                overall: Math.round((prev.firewall + prev.kernel + Math.min(100, prev.ml + 0.1)) / 3)
            }));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="animate-fade-in space-y-6 h-full flex flex-col p-4 md:p-6">
            <h1 className="text-3xl font-bold text-yellow-400 drop-shadow-[0_2px_4px_rgba(250,204,21,0.3)] text-center tracking-wider">
                Aegis Control Core
            </h1>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <AegisGauge label="Firewall Integrity" value={scores.firewall} icon={<ShieldIcon className="w-8 h-8"/>} color="stroke-yellow-400" />
                <AegisGauge label="Kernel Hardness" value={scores.kernel} icon={<CpuIcon className="w-8 h-8"/>} color="stroke-yellow-400" />
                <AegisGauge label="Anomaly Detection" value={scores.ml} icon={<BrainCircuitIcon className="w-8 h-8"/>} color="stroke-yellow-400" />
                <AegisGauge label="Overall Score" value={scores.overall} icon={<GaugeIcon className="w-8 h-8"/>} color="stroke-yellow-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow min-h-0">
                <div className="lg:col-span-1 space-y-4">
                     <div className="p-4 bg-black/30 rounded-lg border border-yellow-500/10 h-full">
                        <h2 className="text-lg font-semibold text-yellow-300 mb-3 border-b border-yellow-500/10 pb-2">Active Services</h2>
                        <div className="space-y-2">
                            <StatusListItem label="nftables" status="Hardened" />
                            <StatusListItem label="sshd" status="Hardened" />
                            <StatusListItem label="fail2ban" status="Active" />
                            <StatusListItem label="auditd" status="Active" />
                             <StatusListItem label="Aegis Agent" status="Hardened" />
                        </div>
                         <h2 className="text-lg font-semibold text-yellow-300 mb-3 border-b border-yellow-500/10 pb-2 mt-6">Configuration</h2>
                          <div className="space-y-2">
                            <StatusListItem label="ssh/99-hardening.conf" status="Hardened" />
                            <StatusListItem label="sysctl/90-hardening.conf" status="Hardened" />
                            <StatusListItem label="aegis/policy.yaml" status="Active" />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 h-[50vh] lg:h-auto">
                    <AegisTerminal 
                        onExecute={getCommandResponse}
                        knownCommands={KNOWN_COMMANDS}
                        initialOutput={initialOutput}
                    />
                </div>
            </div>
        </div>
    );
};

export default AegisHardener;
