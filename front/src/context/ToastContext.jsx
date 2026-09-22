import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Adiciona um novo toast
  const addToast = useCallback(
    ({ message, type = 'success', duration = 2500 }) => {
      const id = Date.now() + Math.random().toString(36).slice(2, 7);

      setToasts((prev) => [...prev, { id, message, type }]);

      // Remove automaticamente após o tempo definido
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    [],
  );

  // Helpers práticos
  const toast = {
    success: (msg, duration) =>
      addToast({ message: msg, type: 'success', duration }),
    error: (msg, duration) =>
      addToast({ message: msg, type: 'error', duration }),
    info: (msg, duration) => addToast({ message: msg, type: 'info', duration }),
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, addToast }}>
      {children}

      {/* Container visual dos Toasts fixado na tela */}
      <div className='toast-container' aria-live='polite'>
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className='toast-icon'>
              {t.type === 'success' && '✓'}
              {t.type === 'error' && '✕'}
              {t.type === 'info' && 'ℹ'}
            </span>
            <div className='toast-message'>{t.message}</div>
            <button
              type='button'
              className='toast-close'
              onClick={() => removeToast(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context.toast;
}
