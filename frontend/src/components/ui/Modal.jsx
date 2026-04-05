import { useEffect } from 'react'

export default function Modal({ children, onClose, title }) {
  // Закрытие по Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black/45 backdrop-blur-sm z-[200] flex items-end justify-center animate-[fadeIn_.15s_ease]"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-bg-2 border border-border rounded-t-[20px] w-full max-w-modal max-h-[92dvh] overflow-y-auto p-5 animate-[slideUp_.25s_ease]">
        <div className="w-9 h-1 bg-border rounded-full mx-auto mb-4" />
        {title && (
          <h3 className="text-lg font-extrabold mb-3.5">{title}</h3>
        )}
        {children}
      </div>
    </div>
  )
}
