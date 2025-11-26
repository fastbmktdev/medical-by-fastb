// Client-only toast utilities
// Uses optional require to avoid bundling issues in server environments

type ToastType = {
  success: (message: string, options?: unknown) => void;
  error: (message: string, options?: unknown) => void;
  loading: (message: string, options?: unknown) => string;
  dismiss: (toastId: string) => void;
};

let toastInstance: ToastType | null = null;

function getToast(): ToastType {
  if (typeof window === 'undefined') {
    // Server-side: return no-op functions
    return {
      success: () => {},
      error: () => {},
      loading: () => '',
      dismiss: () => {},
    };
  }
  
  if (!toastInstance) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      toastInstance = require('react-hot-toast').default;
    } catch (err) {
      // Fallback if react-hot-toast is not available
      toastInstance = {
        success: () => {},
        error: () => {},
        loading: () => '',
        dismiss: () => {},
      };
    }
  }
  
  // toastInstance is guaranteed to be non-null at this point
  return toastInstance as ToastType;
}

export const showSuccessToast = (message: string) => {
  const toast = getToast();
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
    },
  });
};

export const showErrorToast = (message: string) => {
  const toast = getToast();
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
    },
  });
};

export const showLoadingToast = (message: string) => {
  const toast = getToast();
  return toast.loading(message, {
    position: 'top-right',
  });
};

export const dismissToast = (toastId: string) => {
  const toast = getToast();
  toast.dismiss(toastId);
};
