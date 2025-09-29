import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Signal, FixAction, AIInsightState, AuditQueueItem, Threat } from '../types';
import Dashboard from './views/Dashboard';
import FileAnalyzer from './views/FileAnalyzer';
import SystemMonitor from './views/SystemMonitor';
import SecurityAdvisor from './views/SecurityAdvisor';
import ThreatScanner from './views/ThreatScanner';
import SystemHardener from './views/SystemHardener';
import SubnetMessenger from './views/SubnetMessenger';
import MLFrameworkDemo from './views/MLFrameworkDemo';
import AegisHardener from './views/AegisHardener';
import AdminConsole from './views/AdminConsole';
import DataLossPrevention from './views/DataLossPrevention';
import AuditQueueView from './views/AuditQueueView';
import SystemLog from './views/SystemLog';
import LiveConversation from './views/LiveConversation';
import { CommandPalette, Command } from './ui/CommandPalette';
import { NAVIGATION_ITEMS } from '../lib/constants';
import SigilLibrary from './ui/SigilLibrary';
import { SigilName } from './common/SigilMark';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { ToastProvider, useToast } from '../hooks/useToast';
import { ToastContainer } from './ui/Toast';
import { loadAuditQueue, addToAuditQueue, removeFromAuditQueue, clearAuditQueue, updateInAuditQueue } from '../lib/storage';
import QueueFixPrompt from './ui/QueueFixPrompt';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getSignals, getThreats } from '../lib/api';
import { useEvents } from '../hooks/useEvents';
import { ThemeProvider } from './ThemeProvider';

const ORACLE_CACHE_KEY = 'sigil-sentinel-oracle-cache';

const ErrorOverlay: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="card hx-glow-border p-8 text-center" style={{ '--glow-color': 'var(--red)' } as React.CSSProperties}>
            <h2 className="text-2xl font-bold text-red-400">Connection Error</h2>
            <p className="mt-2 text-gray-300 max-w-md">{message}</p>
            <button onClick={onRetry} className="btn primary mt-6">
                Retry Connection
            </button>
        </div>
    </div>
);

const AppContent: React.FC = () => {
  const [view, setView] = useState<View>(() => (localStorage.getItem('sigil-active-view') as View) || View.DASHBOARD);
  const [activeSigil, setActiveSigil] = useState<SigilName>('warding');
  const [isSigilLibraryOpen, setSigilLibraryOpen] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isQueuePromptOpen, setQueuePromptOpen] = useState(false);
  
  const [oracleCache, setOracleCache] = useState<Record<string, AIInsightState>>(() => {
    try { return JSON.parse(localStorage.getItem(ORACLE_CACHE_KEY) || '{}'); } catch { return {}; }
  });

  const [auditQueue, setAuditQueue] = useState<AuditQueueItem[]>(() => loadAuditQueue());
  const { addToast } = useToast();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { events, isConnected } = useEvents();
  
  usePreserveScroll("sigil:scroll:main", "main-content", { debounceMs: 140 });

  const fetchData = useCallback(async () => {
    try {
        setIsLoading(true);
        setError(null);
        const [signalsData, threatsData] = await Promise.all([
            getSignals(),
            getThreats()
        ]);
        setSignals(signalsData);
        setThreats(threatsData);
    } catch (err: any) {
        console.error("Failed to fetch initial data", err);
        setError(err.message || "Failed to connect to the Sigil Sentinel core. Please check your connection and refresh.");
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => localStorage.setItem('sigil-active-view', view), [view]);
  useEffect(() => localStorage.setItem(ORACLE_CACHE_KEY, JSON.stringify(oracleCache)), [oracleCache]);
  useEffect(() => {
    const savedSigil = localStorage.getItem('sigil-active-sigil') as SigilName;
    if (savedSigil) setActiveSigil(savedSigil);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectSigil = (name: SigilName) => {
    setActiveSigil(name);
    localStorage.setItem('sigil-active-sigil', name);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCommandPaletteOpen(isOpen => !isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleClearOracleCache = useCallback(() => {
    setOracleCache({});
    addToast({ title: 'Oracle Cache Cleared', message: 'All cached explanations have been removed.', type: 'info' });
  }, [addToast]);
  
  const handleQueueFix = useCallback((item: { id: string, title: string, severity: AuditQueueItem['severity'] }) => {
    const newQueueItem = { id: item.id, title: item.title, severity: item.severity, timestamp: Date.now() };
    const updatedQueue = addToAuditQueue(newQueueItem);
    setAuditQueue(updatedQueue);
    addToast({ title: 'Fix Queued', message: `Fix for "${item.title}" added to audit queue.`, type: 'info' });
    setQueuePromptOpen(false);
  }, [addToast]);

  const handleRemoveFromQueue = useCallback((timestamp: number) => {
    const updatedQueue = removeFromAuditQueue(item => item.timestamp === timestamp);
    setAuditQueue(updatedQueue);
    addToast({ title: 'Item Removed', message: 'Item removed from audit queue.', type: 'info' });
  }, [addToast]);

  const handleUpdateQueueItem = useCallback((timestamp: number, updates: { title: string; severity: AuditQueueItem['severity'] }) => {
    const updatedQueue = updateInAuditQueue(timestamp, updates);
    setAuditQueue(updatedQueue);
    addToast({ title: 'Item Updated', message: 'The audit queue item has been successfully updated.', type: 'success' });
  }, [addToast]);

  const handleClearQueue = useCallback(() => {
    clearAuditQueue();
    setAuditQueue([]);
    addToast({ title: 'Queue Cleared', message: 'The audit queue has been cleared.', type: 'info' });
  }, [addToast]);

  const commands = useMemo<Command[]>(() => [
    ...NAVIGATION_ITEMS.map(item => ({
      id: `nav-${item.view}`, title: `Go to ${item.label}`, category: 'Navigation',
      icon: React.cloneElement(item.icon, { className: 'h-5 w-5' }),
      action: () => setView(item.view),
      keywords: [item.view.toLowerCase().replace('_', ' ')]
    })),
    { id: 'action-queue-fix', title: 'Queue a Fix for Audit', category: 'Actions', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>, action: () => setQueuePromptOpen(true), keywords: ['queue', 'fix', 'audit', 'ticket'] },
    { id: 'action-scan', title: 'Initiate Threat Scan', category: 'Actions', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>, action: () => setView(View.THREAT_SCANNER), keywords: ['threat', 'scanner', 'virus'] },
    { id: 'action-change-sigil', title: 'Open Sigil Library', category: 'Customization', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>, action: () => setSigilLibraryOpen(true), keywords: ['sigil', 'customize', 'theme', 'icon'] },
    { id: 'action-clear-oracle-cache', title: 'Clear Oracle Cache', category: 'Actions', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.05 11A9 9 0 0121.95 11" /><path strokeLinecap="round" strokeLinejoin="round" d="M20 20v-5h-5" /><path strokeLinecap="round" strokeLinejoin="round" d="M21.95 13A9 9 0 012.05 13" /></svg>, action: handleClearOracleCache, keywords: ['oracle', 'gemini', 'cache', 'clear', 'reset'] }
  ], [setView, handleClearOracleCache]);
  
  const currentViewTitle = useMemo(() => NAVIGATION_ITEMS.find(item => item.view === view)?.label || 'Dashboard', [view]);

  const renderView = () => {
    if (isLoading) {
        return <div className="p-8 text-center text-cyan-300">Connecting to the Oracle Core...</div>;
    }

    switch (view) {
      case View.DASHBOARD: return <Dashboard onChangeView={setView} events={events} isConnected={isConnected} />;
      case View.LIVE_CONVERSATION: return <LiveConversation />;
      case View.FILE_ANALYZER: return <FileAnalyzer onChangeView={setView} />;
      case View.SYSTEM_MONITOR: return <SystemMonitor />;
      case View.SYSTEM_LOG: return <SystemLog />;
      case View.SECURITY_ADVISOR: return <SecurityAdvisor signals={signals} onRequestFix={handleQueueFix} oracleCache={oracleCache} setOracleCache={setOracleCache} onClearOracleCache={handleClearOracleCache} />;
      case View.THREAT_SCANNER: return <ThreatScanner onChangeView={setView} oracleCache={oracleCache} setOracleCache={setOracleCache} onRequestFix={handleQueueFix} threats={threats} />;
      case View.SYSTEM_HARDENER: return <SystemHardener />;
      case View.SUBNET_MESSENGER: return <SubnetMessenger />;
      case View.ML_FRAMEWORK_DEMO: return <MLFrameworkDemo />;
      case View.AEGIS_HARDENER: return <AegisHardener />;
      case View.ADMIN_CONSOLE: return <AdminConsole />;
      case View.DATA_LOSS_PREVENTION: return <DataLossPrevention />;
      case View.AUDIT_QUEUE: return <AuditQueueView items={auditQueue} onRemove={handleRemoveFromQueue} onClear={handleClearQueue} onUpdate={handleUpdateQueueItem} />;
      default: return <Dashboard onChangeView={setView} events={events} isConnected={isConnected} />;
    }
  };

  return (
    <>
      <div className="app-layout bg-ink-900 text-gray-200 font-sans bg-grid">
        <Sidebar 
          activeView={view} 
          onChangeView={setView} 
          onOpenSigilLibrary={() => setSigilLibraryOpen(true)}
          activeSigilName={activeSigil}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
           <Topbar title={currentViewTitle} onOpenCommandPalette={() => setCommandPaletteOpen(true)} onChangeView={setView} setView={setView} />
           <div id="main-content" className="main-content flex-1">
              {renderView()}
           </div>
        </div>
      </div>
      {error && <ErrorOverlay message={error} onRetry={fetchData} />}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} commands={commands} />
      <SigilLibrary isOpen={isSigilLibraryOpen} onClose={() => setSigilLibraryOpen(false)} onSelectSigil={handleSelectSigil} currentSigil={activeSigil} />
      <QueueFixPrompt isOpen={isQueuePromptOpen} onClose={() => setQueuePromptOpen(false)} onQueue={handleQueueFix} threats={threats} />
      <ToastContainer />
    </>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </ThemeProvider>
);

export default App;