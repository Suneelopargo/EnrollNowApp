// frontend/microfrontends/participant/src/components/Toast.tsx - Toast Notification Popup
import React, { useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { ToastNotification } from '../types/participant';

interface ToastProps {
  notification: ToastNotification | string | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose, duration = 4000 }) => {
  const toastMsg = typeof notification === 'object' ? notification?.message : notification;
  const toastType = typeof notification === 'object' ? notification?.type : 'info';

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toastMsg, duration, onClose]);

  if (!toastMsg) return null;

  const isError =
    toastType === 'error' ||
    toastMsg.toLowerCase().includes('deleted') ||
    toastMsg.toLowerCase().includes('removed') ||
    toastMsg.toLowerCase().includes('error') ||
    toastMsg.toLowerCase().includes('failed');

  return (
    <div
      className="fixed top-5 right-5 z-50 flex items-center justify-between gap-4 px-4 py-3 rounded-lg shadow-2xl text-white text-sm font-medium transition-all animate-fade-in min-w-[280px] max-w-md"
      style={{ backgroundColor: isError ? '#d9534f' : '#1976d2' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
          {isError ? (
            <X className="w-3.5 h-3.5 text-[#d9534f] stroke-[3]" />
          ) : (
            <Check className="w-3.5 h-3.5 text-[#1976d2] stroke-[3]" />
          )}
        </div>
        <span className="text-white font-medium text-sm tracking-wide leading-tight">{toastMsg}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="text-white/80 hover:text-white p-1 rounded-full hover:bg-black/15 transition-colors cursor-pointer shrink-0"
        title="Close notification"
      >
        <X className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
};

export default Toast;
