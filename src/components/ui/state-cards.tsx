import React from 'react';
import {
  Loader2,
  Inbox,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
} from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Chargement en cours...' }) => (
  <div className="flex flex-col items-center justify-center p-8 space-y-3 text-slate-500 bg-slate-50/50 rounded-2xl border border-slate-100">
    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
    <p className="text-xs font-semibold">{message}</p>
  </div>
);

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) => (
  <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white rounded-2xl border border-dashed border-slate-200">
    <div className="p-3 bg-amber-50 rounded-full text-amber-600">
      <Icon className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
      <p className="text-xs text-slate-500 max-w-xs">{description}</p>
    </div>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-xs"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

interface ErrorCardProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({
  title = 'Une erreur est survenue',
  message,
  onRetry,
}) => (
  <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-rose-950 text-xs">
    <div className="flex items-center gap-2 font-bold text-rose-800">
      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
      <span>{title}</span>
    </div>
    <p className="text-rose-900">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-1 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all text-[11px]"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Réessayer
      </button>
    )}
  </div>
);

interface SuccessBannerProps {
  title: string;
  message: string;
  onClose?: () => void;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({ title, message, onClose }) => (
  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-start justify-between text-emerald-950 text-xs shadow-xs">
    <div className="flex items-start gap-2.5">
      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
      <div className="space-y-0.5">
        <p className="font-extrabold text-emerald-900">{title}</p>
        <p className="text-emerald-800 leading-relaxed">{message}</p>
      </div>
    </div>
    {onClose && (
      <button onClick={onClose} className="text-emerald-700 hover:text-emerald-900 p-1">
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

interface CancelledModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const CancelledModal: React.FC<CancelledModalProps> = ({
  isOpen,
  title,
  description,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
        <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base border-b border-slate-100 pb-2">
          <XCircle className="w-5 h-5 shrink-0" />
          <span>{title}</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
          >
            Conserver la commande
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-xs"
          >
            Confirmer l&apos;annulation
          </button>
        </div>
      </div>
    </div>
  );
};
