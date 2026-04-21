// PillInput — pill-input c круглой accent-кнопкой отправки.
// Для комментариев, чата, ввода кода приглашения.
// Enter → onSubmit. Кнопка disabled когда value пуст.

import { useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function PillInput({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  disabled = false,
  maxLength,
  icon: Icon,            // опциональная иконка слева (lucide-иконка)
  sendIcon,              // альтернативная иконка кнопки (по умолчанию ArrowUp)
  sendAriaLabel = 'Отправить',
  className = '',
  autoFocus = false,
}) {
  const [focused, setFocused] = useState(false)
  const isEmpty = !value || !value.trim()
  const canSubmit = !disabled && !isEmpty

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault()
      onSubmit?.(value)
    }
  }

  return (
    <div
      className={[
        'flex items-center gap-2 bg-bg-2 rounded-full border pl-4 pr-1.5 py-1.5',
        focused ? 'border-accent' : 'border-border',
        'transition-colors duration-150',
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={16} className="text-text-3 shrink-0" />}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent outline-none text-[14px] text-text placeholder:text-text-3 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => canSubmit && onSubmit?.(value)}
        disabled={!canSubmit}
        aria-label={sendAriaLabel}
        className={[
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
          'transition-all duration-150',
          canSubmit
            ? 'bg-accent text-white hover:bg-accent-2 cursor-pointer'
            : 'bg-border text-text-3 cursor-not-allowed',
        ].join(' ')}
      >
        {sendIcon || <ArrowUp size={16} strokeWidth={2.4} />}
      </button>
    </div>
  )
}
