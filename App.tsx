import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navigation from './components/Navigation';
// FIX: Imported Signal and FixAction from types.ts where they are defined, instead of from SecurityAdvisor.tsx
import { View, Signal, FixAction, AIInsightState, AuditQueueItem, Threat } from './types';
import Dashboard from './components/views/Dashboard';
import FileAnalyzer from './components/views/FileAnalyzer';
import SystemMonitor from './components/views/SystemMonitor';
import SecurityAdvisor from './components/views/SecurityAdvisor';
import ThreatScanner from './components/views/ThreatScanner';
import SystemHardener from './components/views/SystemHardener';
import SubnetMessenger from './components/views/SubnetMessenger';
import MLFrameworkDemo from './components/views/MLFrameworkDemo';
import AegisHardener from './components/views/AegisHardener';
import AdminConsole from './components/views/AdminConsole';
import DataLossPrevention from './components/views/DataLossPrevention';
import AuditQueueView from './components/views/AuditQueueView';
import { CommandPalette, Command } from './components/CommandPalette';
import { NAVIGATION_ITEMS } from './constants';
import SigilLibrary from './components/SigilLibrary';
import { SigilName } from './components/SigilMark';
import { usePreserveScroll } from './hooks/usePreserveScroll';
import { ToastProvider, useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { loadAuditQueue, addToAuditQueue, removeFromAuditQueue, clearAuditQueue } from './lib/storage';
import QueueFixPrompt from './components/QueueFixPrompt';
import { ThemeProvider } from './components/ThemeProvider';
import LiveConversation from './components/views/LiveConversation';

const mockSignals: Signal[] = [
  { key: 'firewall.enabled', label: 'Firewall Status', category: 'Network', value: false, at: new Date().toISOString() },
  { key: 'os.version', label: 'Operating System Version', category: 'OS', value: '10.1.2', at: new Date().toISOString(), meta: { latest: '10.1.5' } },
  { key: 'auth.password_policy', label: 'Password Policy', category: 'Auth', value: { minLength: 6 }, at: new Date().toISOString() },
  { key: 'privacy.telemetry', label: 'Telemetry', category: 'Privacy', value: true },
  { key: 'endpoint.antivirus', label: 'Antivirus', category: 'Endpoint', value: 'active' }
];

const MOCK_THREATS: Threat[] = [
  {
    id: "T-2025-0001",
    title: "Unsigned binary executed: wrm.exe",
    reason: "Unsigned executable spawned from temp dir",
    detectedAt: new Date().toISOString(),
    source: "File Analyzer",
    severity: "high",
    details: "Parent: explorer.exe, Cmdline: C:\\Windows\\Temp\\wrm.exe --connect 192.168.1.2:443",
    explained: true,
  },
  {
    id: "T-2025-0002",
    title: "Gateway change detected",
    reason: "Default gateway shifted to suspicious host 192.168.1.254",
    detectedAt: new Date().toISOString(),
    source: "Network Monitor",
    severity: "medium",
    details: "Previous gateway 192.168.1.1 -> 192.168.1.254",
    explained: false,
  },
  {
    id: "T-2025-0003",
    title: "High entropy blob detected (packed file)",
    reason: "Entropy > 7.8",
    detectedAt: new Date().toISOString(),
    source: "File Analyzer",
    severity: "critical",
    details: "SHA256: abcdef...; size 2.7MB; suspicious extension: .bin",
    explained: false,
  },
];

const ORACLE_CACHE_KEY = 'sigil-sentinel-oracle-cache';

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>(() => {
    const savedView = localStorage.getItem('sigil-active-view');
    if (savedView && Object.values(View).includes(savedView as View)) {
      return savedView as View;
    }
    return View.DASHBOARD;
  });
  
  const [activeSigil, setActiveSigil] = useState<SigilName>('warding');
  const [isSigilLibraryOpen, setSigilLibraryOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isQueuePromptOpen, setQueuePromptOpen] = useState(false);
  
  const [oracleCache, setOracleCache] = useState<Record<string, AIInsightState>>(() => {
    try {
      const cachedData = localStorage.getItem(ORACLE_CACHE_KEY);
      return cachedData ? JSON.parse(cachedData) : {};
    } catch (error) {
      console.warn('Failed to parse oracle cache from localStorage', error);
      return {};
    }
  });

  const [auditQueue, setAuditQueue] = useState<AuditQueueItem[]>(() => loadAuditQueue());
  const { addToast } = useToast();
  
  usePreserveScroll("sigil:scroll:main", "main", { debounceMs: 140 });

  useEffect(() => {
    localStorage.setItem('sigil-active-view', view);
  }, [view]);

  // Persist oracle cache to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORACLE_CACHE_KEY, JSON.stringify(oracleCache));
    } catch (error) {
      console.warn('Failed to save oracle cache to localStorage', error);
    }
  }, [oracleCache]);

  // Load/save active sigil
  useEffect(() => {
    const savedSigil = localStorage.getItem('sigil-active-sigil') as SigilName;
    if (savedSigil && ['warding', 'divination', 'channeling', 'elderTech', 'draconic'].includes(savedSigil)) {
      setActiveSigil(savedSigil);
    }
  }, []);

  const handleSelectSigil = (name: SigilName) => {
    setActiveSigil(name);
    localStorage.setItem('sigil-active-sigil', name);
  };
  
  // Global keybindings for the command palette
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(isOpen => !isOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClearOracleCache = useCallback(() => {
    setOracleCache({});
    addToast({ title: 'Oracle Cache Cleared', message: 'All cached explanations have been removed.', type: 'info' });
  }, [addToast]);
  
  const handleQueueFix = useCallback((item: { id: string, title: string, severity: AuditQueueItem['severity'] }) => {
    const newQueueItem: AuditQueueItem = {
      id: item.id,
      title: item.title,
      severity: item.severity,
      timestamp: Date.now(),
    };
    const updatedQueue = addToAuditQueue(newQueueItem);
    setAuditQueue(updatedQueue);
    addToast({ title: 'Fix Queued', message: `Fix for "${item.title}" was added to the audit queue.`, type: 'info' });
    setQueuePromptOpen(false); // Close prompt if it was open
  }, [addToast]);

  const handleRemoveFromQueue = useCallback((timestamp: number) => {
    const updatedQueue = removeFromAuditQueue(item => item.timestamp === timestamp);
    setAuditQueue(updatedQueue);
    addToast({ title: 'Item Removed', message: 'Item removed from the audit queue.', type: 'info' });
  }, [addToast]);

  const handleClearQueue = useCallback(() => {
    clearAuditQueue();
    setAuditQueue([]);
    addToast({ title: 'Queue Cleared', message: 'The audit queue has been cleared.', type: 'info' });
  }, [addToast]);

  // Define commands for the palette
  const commands = useMemo<Command[]>(() => [
    ...NAVIGATION_ITEMS.map(item => ({
      id: `nav-${item.view}`,
      title: `Go to ${item.label}`,
      category: 'Navigation',
      icon: React.cloneElement(item.icon, { className: 'h-5 w-5' }),
      action: () => setView(item.view),
      keywords: [item.view.toLowerCase().replace('_', ' ')]
    })),
    {
      id: 'action-queue-fix',
      title: 'Queue a Fix for Audit',
      category: 'Actions',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
      action: () => setQueuePromptOpen(true),
      keywords: ['queue', 'fix', 'audit', 'ticket']
    },
    {
      id: 'action-scan',
      title: 'Initiate Threat Scan',
      category: 'Actions',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      action: () => setView(View.THREAT_SCANNER),
      keywords: ['threat', 'scanner', 'virus']
    },
    {
      id: 'action-change-sigil',
      title: 'Open Sigil Library',
      category: 'Customization',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>,
      action: () => setSigilLibraryOpen(true),
      keywords: ['sigil', 'customize', 'theme', 'icon']
    },
    {
      id: 'action-clear-oracle-cache',
      title: 'Clear Oracle Cache',
      category: 'Actions',
      icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.05 11A9 9 0 0121.95 11" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21.95 13A9 9 0 012.05 13" /></svg>,
      action: handleClearOracleCache,
      keywords: ['oracle', 'gemini', 'cache', 'clear', 'reset', 'advisor', 'explanation']
    }
  ], [setView, handleClearOracleCache]);

  const renderView = () => {
    switch (view) {
      case View.DASHBOARD: return <Dashboard onChangeView={setView} />;
      case View.LIVE_CONVERSATION: return <LiveConversation />;
      case View.FILE_ANALYZER: return <FileAnalyzer onChangeView={setView} />;
      case View.SYSTEM_MONITOR: return <SystemMonitor />;
      case View.SECURITY_ADVISOR: return <SecurityAdvisor signals={mockSignals} onRequestFix={handleQueueFix} oracleCache={oracleCache} setOracleCache={setOracleCache} onClearOracleCache={handleClearOracleCache} />;
      case View.THREAT_SCANNER: return <ThreatScanner onChangeView={setView} oracleCache={oracleCache} setOracleCache={setOracleCache} onRequestFix={handleQueueFix} threats={MOCK_THREATS} />;
      case View.SYSTEM_HARDENER: return <SystemHardener />;
      case View.SUBNET_MESSENGER: return <SubnetMessenger />;
      case View.ML_FRAMEWORK_DEMO: return <MLFrameworkDemo />;
      case View.AEGIS_HARDENER: return <AegisHardener />;
      case View.ADMIN_CONSOLE: return <AdminConsole />;
      case View.DATA_LOSS_PREVENTION: return <DataLossPrevention />;
      case View.AUDIT_QUEUE: return <AuditQueueView items={auditQueue} onRemove={handleRemoveFromQueue} onClear={handleClearQueue} />;
      default: return <Dashboard onChangeView={setView} />;
    }
  };

  return (
    <>
      <div className="app-layout flex h-screen bg-ink-900 text-gray-200 font-mono bg-grid">
        <Navigation 
          activeView={view} 
          onChangeView={setView} 
          onOpenSigilLibrary={() => setSigilLibraryOpen(true)}
          activeSigilName={activeSigil}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main id="main" className="flex-1 overflow-auto">
            {renderView()}
          </main>
        </div>
      </div>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
        commands={commands}
      />
      <SigilLibrary
        isOpen={isSigilLibraryOpen}
        onClose={() => setSigilLibraryOpen(false)}
        onSelectSigil={handleSelectSigil}
        currentSigil={activeSigil}
      />
      <QueueFixPrompt 
        isOpen={isQueuePromptOpen}
        onClose={() => setQueuePromptOpen(false)}
        onQueue={handleQueueFix}
        threats={MOCK_THREATS}
      />
      <ToastContainer />
    </>
  );
};


const App: React.FC = () => (
  <ToastProvider>
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  </ToastProvider>
);


export default App;