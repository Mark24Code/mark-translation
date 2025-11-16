import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Toast, { ToastType } from '../components/Toast/index';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastIdCounter = 0;

// Global toast state
let toasts: ToastItem[] = [];
let listeners: Array<() => void> = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const useToast = () => {
  const [_, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate(n => n + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType, duration = 3000) => {
    const id = `toast-${toastIdCounter++}`;
    const newToast: ToastItem = { id, message, type, duration };

    toasts = [...toasts, newToast];
    notifyListeners();
  }, []);

  const hideToast = useCallback((id: string) => {
    toasts = toasts.filter(toast => toast.id !== id);
    notifyListeners();
  }, []);

  return { showToast, hideToast, toasts };
};

export const ToastPortal: React.FC = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  );
};