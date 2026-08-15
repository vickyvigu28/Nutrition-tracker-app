import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { h } from '../../utils/h.js';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return h(
    ToastContext.Provider,
    { value: showToast },
    children,
    h(
      'div',
      { className: 'fixed bottom-4 left-0 right-0 flex flex-col items-center gap-2 px-4 z-50 pointer-events-none' },
      toasts.map((t) =>
        h(
          'div',
          {
            key: t.id,
            className: `app-max-width w-full flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
              t.type === 'error' ? 'bg-red-500' : t.type === 'success' ? 'bg-green-500' : 'bg-gray-800'
            }`
          },
          t.type === 'error'
            ? h(XCircle, { size: 16 })
            : t.type === 'success'
              ? h(CheckCircle, { size: 16 })
              : h(Info, { size: 16 }),
          t.message
        )
      )
    )
  );
}

export const useToast = () => useContext(ToastContext);
