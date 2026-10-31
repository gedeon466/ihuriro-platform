import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border border-neutral-200 shadow-sm ${hover ? 'transition-all duration-300 hover:shadow-lg hover:border-primary-300 hover:-translate-y-1 cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

export function StatCard({ label, value, icon, trend, trendUp, color = 'primary' }: StatCardProps) {
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    accent: 'bg-accent-50 text-accent-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    error: 'bg-error-50 text-error-600',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-neutral-800 mt-1 font-heading">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trendUp ? 'text-success-600' : 'text-error-600'}`}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variants: Record<string, string> = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-success-100 text-success-700',
    warning: 'bg-warning-100 text-warning-700',
    error: 'bg-error-100 text-error-700',
    info: 'bg-primary-100 text-primary-700',
    accent: 'bg-accent-100 text-accent-700',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit';
  icon?: ReactNode;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button',
  icon,
  className = '',
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-400 hover:bg-secondary-500 text-neutral-900 shadow-sm hover:shadow-md',
    outline: 'border border-neutral-300 hover:border-primary-400 text-neutral-700 hover:text-primary-600 hover:bg-primary-50',
    ghost: 'text-neutral-600 hover:bg-neutral-100',
    danger: 'bg-error-500 hover:bg-error-600 text-white shadow-sm hover:shadow-md',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white shadow-sm hover:shadow-md',
  };
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ value, max = 100, color = 'primary', showLabel = false, label }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap: Record<string, string> = {
    primary: 'bg-primary-500',
    secondary: 'bg-secondary-400',
    accent: 'bg-accent-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  };
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-neutral-600 mb-1">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color] || colorMap.primary}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-neutral-800 font-heading">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

interface ModuleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color?: string;
  onClick?: () => void;
  badge?: string;
}

export function ModuleCard({ icon, title, description, color = 'primary', onClick, badge }: ModuleCardProps) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'hover:border-primary-300' },
    secondary: { bg: 'bg-secondary-50', text: 'text-secondary-600', border: 'hover:border-secondary-300' },
    accent: { bg: 'bg-accent-50', text: 'text-accent-600', border: 'hover:border-accent-300' },
    error: { bg: 'bg-error-50', text: 'text-error-600', border: 'hover:border-error-300' },
    warning: { bg: 'bg-warning-50', text: 'text-warning-600', border: 'hover:border-warning-300' },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <Card hover onClick={onClick} className={`p-5 ${c.border}`}>
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-2xl ${c.bg} ${c.text} flex items-center justify-center text-2xl flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-neutral-800 font-heading truncate">{title}</h3>
            {badge && <Badge variant="info" size="sm">{badge}</Badge>}
          </div>
          <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{description}</p>
        </div>
      </div>
    </Card>
  );
}

interface SubModuleGridProps {
  items: { id: string; label: string; icon: ReactNode; description?: string }[];
  onSelect: (id: string) => void;
  columns?: number;
}

export function SubModuleGrid({ items, onSelect, columns = 3 }: SubModuleGridProps) {
  const colMap: Record<number, string> = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };
  return (
    <div className={`grid grid-cols-1 ${colMap[columns] || colMap[3]} gap-4`}>
      {items.map((item) => (
        <Card key={item.id} hover onClick={() => onSelect(item.id)} className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-neutral-800 text-sm truncate">{item.label}</p>
              {item.description && <p className="text-xs text-neutral-500 mt-0.5 truncate">{item.description}</p>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-neutral-700 font-heading">{title}</h3>
      {description && <p className="text-sm text-neutral-500 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, subtitle, icon, children, footer, wide = false }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? 'max-w-5xl' : 'max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 p-6 border-b border-neutral-100">
          {icon && (
            <div className="w-11 h-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center text-xl flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-neutral-800 font-heading">{title}</h2>
            {subtitle && <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer && <div className="flex gap-3 p-6 border-t border-neutral-100">{footer}</div>}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

export function FormField({ label, children, hint }: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium text-neutral-700 mb-1.5 block">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all ${props.className || ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all resize-none ${props.className || ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-4 py-2.5 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all bg-white ${props.className || ''}`}
    />
  );
}

export { InfoModal } from './InfoModal';
