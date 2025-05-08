'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: string;
  title: string;
  description: string;
  status: 'info' | 'warning' | 'success' | 'error';
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccessToast: (title: string, description: string) => void;
  showErrorToast: (title: string, description: string) => void;
  showInfoToast: (title: string, description: string) => void;
  showWarningToast: (title: string, description: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...toast, id }]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
    
    return id;
  };

  const showSuccessToast = (title: string, description: string) => {
    return showToast({ title, description, status: 'success' });
  };

  const showErrorToast = (title: string, description: string) => {
    return showToast({ title, description, status: 'error' });
  };

  const showInfoToast = (title: string, description: string) => {
    return showToast({ title, description, status: 'info' });
  };

  const showWarningToast = (title: string, description: string) => {
    return showToast({ title, description, status: 'warning' });
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const value = {
    toasts,
    showToast,
    showSuccessToast,
    showErrorToast,
    showInfoToast,
    showWarningToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-0 right-0 p-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`rounded-md p-4 max-w-md shadow-md ${
                toast.status === 'error'
                  ? 'bg-red-50 text-red-800 border-l-4 border-red-500'
                  : toast.status === 'success'
                  ? 'bg-green-50 text-green-800 border-l-4 border-green-500'
                  : toast.status === 'warning'
                  ? 'bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500'
                  : 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
              }`}
            >
              <div className="flex justify-between">
                <div className="font-medium">{toast.title}</div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <div className="mt-1 text-sm">{toast.description}</div>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
