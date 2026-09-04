import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toast, type ToastVariant } from './Toast';

interface ToastData {
  id: string;
  message: string;
  type: ToastVariant;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      const message = typeof data === 'string' ? data : (data?.message || data?.detail || 'Notification');
      const type = data?.variant || data?.type || 'info';
      
      const newToast: ToastData = {
        id: Math.random().toString(36).substring(2, 9),
        message,
        type: (type as ToastVariant) || 'info'
      };

      setToasts(prev => [...prev, newToast]);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  // M4: useCallback prevents a new reference on every render, which would reset
  // the auto-dismiss timer of all existing toasts every time a new one is added.
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);


  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast 
            key={toast.id}
            id={toast.id}
            message={toast.message}
            variant={toast.type}
            onClose={removeToast}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
