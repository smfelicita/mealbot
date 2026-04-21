// GuestBlock — блок-заглушка для гостей с CTA на регистрацию/вход.
// Variants:
//   - 'full'   — большая карточка-пустое-состояние (для целых страниц: холодильник, профиль)
//   - 'banner' — компактный баннер сверху секции (для чата, напр.)
//
// Props:
//   - variant: 'full' | 'banner'  (default: 'full')
//   - icon?: ReactNode (lucide, 24-32px для full, 18-20 для banner)
//   - title: string
//   - description?: string
//   - registerText?: string (default: 'Зарегистрироваться')
//   - loginText?: string (default: 'Войти')
//   - onRegister?: () => void   (если не передано — window.location '/auth?mode=register')
//   - onLogin?: () => void      (если не передано — window.location '/auth')
//   - dismissible?: boolean (только для banner)
//   - storageKey?: string (для banner + dismissible)

import { useNavigate } from 'react-router-dom'
import Button from './Button'
import HintBanner from './HintBanner'

export default function GuestBlock({
  variant = 'full',
  icon,
  title,
  description,
  registerText = 'Зарегистрироваться',
  loginText = 'Войти',
  onRegister,
  onLogin,
  dismissible = false,
  storageKey,
  className = '',
}) {
  // useNavigate может быть не доступен если компонент рендерится вне Router.
  // На этот случай делаем fallback на window.location.
  let navigate
  try { navigate = useNavigate() } catch { navigate = null }

  const goRegister = () => {
    if (onRegister) return onRegister()
    if (navigate) return navigate('/auth?mode=register')
    window.location.href = '/auth?mode=register'
  }
  const goLogin = () => {
    if (onLogin) return onLogin()
    if (navigate) return navigate('/auth')
    window.location.href = '/auth'
  }

  if (variant === 'banner') {
    return (
      <HintBanner
        storageKey={storageKey}
        variant="accent"
        icon={icon}
        title={title}
        dismissible={dismissible}
        className={className}
      >
        <div className="mb-2">{description}</div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={goRegister}
            className="text-[13px] font-bold text-accent hover:underline"
          >
            {registerText}
          </button>
          <span className="text-text-3">·</span>
          <button
            type="button"
            onClick={goLogin}
            className="text-[13px] font-semibold text-text-2 hover:text-text hover:underline"
          >
            {loginText}
          </button>
        </div>
      </HintBanner>
    )
  }

  // variant = 'full'
  return (
    <div
      className={[
        'bg-bg-2 border border-border rounded-2xl px-6 py-8',
        'flex flex-col items-center text-center gap-3',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="w-14 h-14 rounded-full bg-accent-muted flex items-center justify-center text-accent mb-1">
          {icon}
        </div>
      )}
      <h3
        className="text-[19px] font-extrabold text-text leading-tight tracking-tight"
        style={{ textWrap: 'balance' }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="text-[14px] text-text-2 leading-relaxed max-w-sm"
          style={{ textWrap: 'pretty' }}
        >
          {description}
        </p>
      )}
      <div className="flex flex-col gap-2 w-full max-w-xs mt-2">
        <Button variant="primary" onClick={goRegister} fullWidth>
          {registerText}
        </Button>
        <Button variant="ghost" onClick={goLogin} fullWidth>
          {loginText}
        </Button>
      </div>
    </div>
  )
}
