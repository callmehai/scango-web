import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  /** Override auto-dismiss duration (ms). Default 3500. 0 = sticky. */
  duration?: number;
}

export interface ToastApi {
  /** Show a toast. Returns the toast id (for manual dismiss). */
  show: (message: string, variant?: ToastVariant, options?: ToastOptions) => number;
  success: (message: string, options?: ToastOptions) => number;
  error: (message: string, options?: ToastOptions) => number;
  info: (message: string, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi | undefined>(undefined);
