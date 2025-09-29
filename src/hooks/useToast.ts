import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  return React.createElement(
    ToastContext.Provider,
    { value: { toasts, addToast, removeToast } },
    children
  );
};