import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTheme } from '../contexts/ThemeContext';

export const Toaster = () => {
  const { darkMode } = useTheme();
  
  return (
    <SonnerToaster 
      position="top-right"
      theme={darkMode ? 'dark' : 'light'}
      toastOptions={{
        style: {
          background: darkMode ? '#1e293b' : '#ffffff',
          border: darkMode ? '1px solid #334155' : '1px solid #e5e7eb',
          color: darkMode ? '#f1f5f9' : '#1f2937',
        },
        className: 'shadow-lg',
      }}
      richColors
      closeButton
    />
  );
};

// Toast helper functions
export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast.info(message),
  warning: (message: string) => toast.warning(message),
  loading: (message: string) => toast.loading(message),
  dismiss: (id?: string | number) => toast.dismiss(id),
  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) => toast.promise(promise, messages),
};

export { toast };
