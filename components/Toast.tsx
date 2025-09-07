import React, { useEffect, useState } from 'react';
import { useToast, ToastMessage } from '../hooks/useToast';

// --- ICONS ---
const CheckCircle: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const Info: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const AlertTriangle: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const XCircle: React.FC = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;

const ICONS: Record<ToastMessage['type'], React.ReactNode> = {
  success: <CheckCircle />,
  info: <Info />,
  warning: <AlertTriangle />,
  error: <XCircle />,
};

const COLORS: Record<ToastMessage['type'], string> = {
  success: 'border-green-500/50 text-green-300',
  info: 'border-cyan-500/50 text-cyan-300',
  warning: 'border-yellow-500/50 text-yellow-300',
  error: 'border-red-500/50 text-red-300',
};


const Toast: React.FC<{ toast: ToastMessage; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };
  
  const animationClass = isExiting ? 'animate-fade-out-right' : 'animate-fade-in-right';

  return (
    <div
      role="alert"
      className={`relative w-full max-w-sm p-4 pr-10 rounded-lg shadow-lg bg-ink-700/80 backdrop-blur-md border ${COLORS[toast.type]} ${animationClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6">{ICONS[toast.type]}</div>
        <div>
          <h4 className="font-bold text-gray-100">{toast.title}</h4>
          <p className="text-sm text-gray-300">{toast.message}</p>
        </div>
      </div>
      <button onClick={handleRemove} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10" aria-label="Dismiss notification">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  );
};


export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

// Add keyframes to index.html or global stylesheet
/*
@keyframes fade-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}
.animate-fade-in-right { animation: fade-in-right 0.3s ease-out forwards; }

@keyframes fade-out-right {
  from { opacity: 1; transform: translateX(0); }
  to { opacity: 0; transform: translateX(100%); }
}
.animate-fade-out-right { animation: fade-out-right 0.3s ease-in forwards; }
*/
