import { useState, useCallback } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  const show = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const ToastComponent = toast ? (
    <div className={[
      'fixed bottom-20 left-1/2 -translate-x-1/2 z-[300]',
      'px-4 py-2.5 rounded-sm text-sm font-bold whitespace-nowrap',
      'pointer-events-none border animate-[fadeUp_.25s_ease]',
      toast.type === 'error'
        ? 'bg-bg-3 border-red-400 text-red-400'
        : 'bg-bg-3 border-teal text-teal',
    ].join(' ')}>
      {toast.message}
    </div>
  ) : null

  return { show, Toast: ToastComponent }
}
