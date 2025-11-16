'use client';

import { useCallback } from 'react';
import { toast as sonnerToast, Toaster } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
}

export function useToast() {
  const toast = useCallback((options: ToastOptions) => {
    const { title, description, duration = 4000, variant = 'default' } = options;
    
    let content = '';
    if (title && description) {
      content = `${title}\n${description}`;
    } else if (title) {
      content = title;
    } else if (description) {
      content = description;
    }

    switch (variant) {
      case 'destructive':
        sonnerToast.error(content, { duration });
        break;
      case 'success':
        sonnerToast.success(content, { duration });
        break;
      default:
        sonnerToast(content, { duration });
        break;
    }
  }, []);

  return { toast };
}

export { Toaster };