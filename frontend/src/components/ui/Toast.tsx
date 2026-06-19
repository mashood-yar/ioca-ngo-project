import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  onClose: (id: string) => void;
  autoDismiss?: number;
}

export function Toast({ id, message, variant = 'info', onClose, autoDismiss = 4000 }: ToastProps) {
  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        onClose(id);
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [id, onClose, autoDismiss]);

  const variants = {
    success: 'bg-brand-teal text-white border-brand-teal',
    error: 'bg-red-600 text-white border-red-600',
    info: 'bg-brand-navy text-white border-brand-navy',
    warning: 'bg-brand-gold text-white border-brand-gold',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-white" />,
    error: <AlertCircle className="w-5 h-5 text-white" />,
    info: <Info className="w-5 h-5 text-white" />,
    warning: <AlertTriangle className="w-5 h-5 text-white" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      layout
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border shadow-lg ${variants[variant]} min-w-[300px] pointer-events-auto`}
    >
      <div className="flex items-center gap-3">
        {icons[variant]}
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onClose(id)}
        className="opacity-70 hover:opacity-100 transition-opacity ml-4"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
