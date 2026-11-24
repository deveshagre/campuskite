import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import hotToast from 'react-hot-toast'

export const toast = hotToast
export const ToastContext = createContext(null)

const TOAST_DURATION = 4000
const MAX_TOASTS = 5

/**
 * Toast item component displaying the notification card.
 */
export function Toast({ toast, onDismiss }) {
  const { id, type, message } = toast

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} color="var(--success, #4D9868)" strokeWidth={2.5} />
      case 'error':
        return <XCircle size={20} color="var(--danger, #D85D52)" strokeWidth={2.5} />
      case 'info':
      default:
        return <Info size={20} color="var(--primary, #FFDE59)" strokeWidth={2.5} />
    }
  }

  return (
    <div
      className={`toast toast-${type}`.trim()}
      role="status"
      aria-live="polite"
      style={{
        animation: 'toastSlideRight 0.25s cubic-bezier(0.2, 0, 0, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm, 8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {renderIcon()}
      </div>
      <div className="toast-content" style={{ flex: 1, minWidth: 0 }}>
        <div className="toast-message" style={{ wordBreak: 'break-word', color: 'var(--text, #171717)' }}>
          {message}
        </div>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(id)}
        aria-label="Close notification"
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

/**
 * Toast notification provider managing the active toasts.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const removeToast = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id))
      timersRef.current.delete(id)
    }
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newToast = { id, type, message }

    setToasts((prev) => {
      const next = [...prev, newToast]
      if (next.length > MAX_TOASTS) {
        // Drop the oldest toast
        const oldest = next[0]
        if (timersRef.current.has(oldest.id)) {
          clearTimeout(timersRef.current.get(oldest.id))
          timersRef.current.delete(oldest.id)
        }
        return next.slice(-MAX_TOASTS)
      }
      return next
    })

    const timer = setTimeout(() => {
      removeToast(id)
    }, TOAST_DURATION)

    timersRef.current.set(id, timer)
    return id
  }, [removeToast])

  const success = useCallback((message) => addToast('success', message), [addToast])
  const error = useCallback((message) => addToast('error', message), [addToast])
  const info = useCallback((message) => addToast('info', message), [addToast])

  const contextValue = {
    success,
    error,
    info,
    removeToast,
  }
  // Support both `const toast = useToast()` and `const { toast } = useToast()`
  contextValue.toast = contextValue

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        className="toast-container"
        style={{
          position: 'fixed',
          top: 'var(--space-lg, 24px)',
          right: 'var(--space-lg, 24px)',
          bottom: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm, 8px)',
          zIndex: 'var(--z-toast, 9999)',
          pointerEvents: 'none',
        }}
      >
        <style>{`
          @keyframes toastSlideRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <Toast toast={t} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Hook to access toast notifications.
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Provide a safe fallback console warning if used outside provider
    const fallback = {
      success: (msg) => console.log('[Toast Success]', msg),
      error: (msg) => console.error('[Toast Error]', msg),
      info: (msg) => console.info('[Toast Info]', msg),
      removeToast: () => {},
    }
    fallback.toast = fallback
    return fallback
  }
  return context
}

export default ToastProvider
