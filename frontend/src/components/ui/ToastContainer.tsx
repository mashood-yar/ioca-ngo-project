import React, { useState, useEffect } from 'react';
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
      const detail = customEvent.detail?.detail || customEvent.detail;
      const type = customEvent.detail?.type || 'info';
      
      const newToast: ToastData = {
        id: Math.random().toString(36).substring(2, 9),
        message: typeof detail === 'string' ? detail : 'Notification',
        type: (type as ToastVariant) || 'info'
      };

      setToasts(prev => [...prev, newToast]);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
