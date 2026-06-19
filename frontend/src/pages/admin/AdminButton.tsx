import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'accent' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const AdminButton: React.FC<AdminButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[#1D2D49] text-white hover:bg-[#162238] active:bg-[#0F1A2E] border border-[#1D2D49]',
    accent:  'bg-[#0D9488] text-white hover:bg-[#0F766E] active:bg-[#115E59] border border-[#0D9488]',
    success: 'bg-[#059669] text-white hover:bg-[#047857] active:bg-[#065F46] border border-[#059669]',
    danger:  'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border border-[#DC2626]',
    warning: 'bg-[#D97706] text-white hover:bg-[#B45309] active:bg-[#92400E] border border-[#D97706]',
    ghost:   'bg-transparent text-[#1D2D49] hover:bg-[#F3F4F6] active:bg-[#E5E7EB] border border-transparent',
    outline: 'bg-transparent text-[#1D2D49] hover:bg-[#1D2D49] hover:text-white active:bg-[#162238] active:text-white border border-[#1D2D49]',
  };

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
    md: 'px-4 py-2 text-sm font-medium rounded-lg',
    lg: 'px-6 py-2.5 text-base font-semibold rounded-xl',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!isLoading && icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
