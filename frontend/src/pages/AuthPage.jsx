// AuthPage — вход и регистрация.
// Полный экран без Layout (Layout не оборачивает /auth).
// Логика как была: email login/register, verify-email, phone-enter, phone-code,
// Google one-tap, skip-link «продолжить без регистрации».
// Визуал — в стиле других редизайн-страниц: pill-инпуты, lucide-иконки, accent-кнопки.

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { ChefHat, Mail, Phone, AlertCircle } from 'lucide-react'

import { api } from '../api'
import { useStore } from '../store'
import { Button } from '../components/ui'

// ─── Field primitives ─────────────────────────────────────────────
function FieldLabel({ children }) {
  return (
    <label
      className="block text-[11px] font-bold uppercase tracking-wider text-text-3 mb-1.5"
      style={{ letterSpacing: 0.6 }}
    >
      {children}
    </label>
  )
}

function PillInput({ className = '', ...props }) {
  return (
    <input
      className={[
        'w-full h-11 px-4 rounded-full bg-bg-2 border border-border text-text text-[14.5px]',
        'outline-none placeholder:text-text-3',
        'focus:border-accent',
        className,
      ].join(' ')}
      style={{ boxShadow: 'none' }}
      {...props}
    />
  )
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return (
    <div className="flex items-start gap-1.5 text-red-500 text-[13px]">
      <AlertCircle size={14} strokeWidth={2.2} className="shrink-0 mt-0.5" />
      <span style={{ textWrap: 'pretty' }}>{msg}</span>
    </div>
  )
}

function ResendLine({ countdown, onResend, loading, label = 'Отправить повторно' }) {
  return (
    <p className="text-center mt-4 text-[13px] text-text-2">
      Не получили?{' '}
      {countdown > 0
        ? <span className="text-text-3">Повторно через {countdown} с</span>
        : (
          <button
            type="button"
            className="text-accent font-bold"
            onClick={onResend}
            disabled={loading}
          >
            {label}
          </button>
        )
      }
    </p>
  )
}

// ─── Tab switcher (email | phone) ────────────────────────────────
function TabSwitcher({ tab, onChange }) {
  const items = [
    { id: 'email', label: 'Email',   Icon: Mail  },
    { id: 'phone', label: 'Телефон', Icon: Phone },
  ]
  return (
    <div className="flex rounded-full p-1 bg-bg-3 border border-border">
      {items.map(({ id, label, Icon }) => {
        const on = tab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              'flex-1 h-9 rounded-full text-[13px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors',
              on ? 'bg-accent text-white' : 'bg-transparent text-text-2',
            ].join(' ')}
          >
            <Icon size={14} strokeWidth={2.2} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ═══ Page ═════════════════════════════════════════════════════════
export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [tab,  setTab]  = useState('email')
  const [step, setStep] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', code: '' })
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)
  const { setAuth } = useStore()
  const navigate = useNavigate()

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (resendCountdown <= 0) return
    const t = setTimeout(() => setResendCountdown(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCountdown])

  async function submitEmailAuth(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      if (step === 'login') {
        const res = await api.login(form.email, form.password)
        setAuth(res.user, res.token); navigate(redirectTo, { replace: true })
      } else {
        const res = await api.register(form.email, form.password, form.name)
        if (res.requireVerification) {
          setPendingEmail(res.email); setStep('verify-email'); setResendCountdown(60)
        } else {
          localStorage.setItem('mealbot_show_onboarding', '1')
          setAuth(res.user, res.token); navigate(redirectTo, { replace: true })
        }
      }
    } catch (err) {
      if (err.data?.requireVerification) {
        setPendingEmail(err.data.email || form.email)
        setStep('verify-email')
        setResendCountdown(0)
        return
      }
      setError(err.message)
    } finally { setLoading(false) }
  }

  async function submitVerifyEmail(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.verifyEmail(pendingEmail, form.code)
      localStorage.setItem('mealbot_show_onboarding', '1')
      setAuth(res.user, res.token); navigate(redirectTo, { replace: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function resendEmail() {
    setError(''); setLoading(true)
    try { await api.resendEmailCode(pendingEmail); setResendCountdown(60) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function submitSendPhone(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.sendPhoneCode(form.phone)
      setPendingPhone(res.phone); setStep('phone-code'); setResendCountdown(60)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function submitVerifyPhone(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.verifyPhone(pendingPhone, form.code, form.name || undefined)
      localStorage.setItem('mealbot_show_onboarding', '1')
      setAuth(res.user, res.token); navigate(redirectTo, { replace: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleGoogle(credential) {
    setError(''); setLoading(true)
    try {
      const res = await api.googleAuth(credential)
      setAuth(res.user, res.token); navigate(redirectTo, { replace: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function switchTab(t) {
    setTab(t); setError('')
    setStep(t === 'phone' ? 'phone-enter' : 'login')
    setForm({ email: '', password: '', name: '', phone: '', code: '' })
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-bg fade-in">
      {/* Brand */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-accent-muted"
          style={{ border: '1px solid rgba(196,112,74,0.25)' }}
        >
          <ChefHat size={28} strokeWidth={2} className="text-accent" />
        </div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-text">MealBot</h1>
        <p className="text-[13px] text-text-2 mt-1">Умный помощник для выбора блюд</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-[380px] bg-bg-2 border border-border rounded-2xl p-6 fade-up">

        {/* ── Verify email ── */}
        {step === 'verify-email' && (
          <>
            <h2 className="text-[20px] font-extrabold tracking-tight text-text mb-1">
              Подтверди email
            </h2>
            <p className="text-[13px] text-text-2 leading-relaxed mb-5" style={{ textWrap: 'pretty' }}>
              Код отправлен на <strong className="text-text">{pendingEmail}</strong>.
              Если не нашли — проверь папку «Спам».
            </p>
            <form onSubmit={submitVerifyEmail} className="flex flex-col gap-4">
              <div>
                <FieldLabel>Код из письма</FieldLabel>
                <PillInput
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.code}
                  onChange={upd('code')}
                  required
                  autoFocus
                />
              </div>
              <ErrorMsg msg={error} />
              <Button type="submit" className="w-full" loading={loading}>
                {!loading && 'Подтвердить'}
              </Button>
            </form>
            <ResendLine countdown={resendCountdown} onResend={resendEmail} loading={loading} />
          </>
        )}

        {/* ── Phone enter ── */}
        {step === 'phone-enter' && (
          <>
            <h2 className="text-[20px] font-extrabold tracking-tight text-text mb-4">
              Вход по телефону
            </h2>
            <form onSubmit={submitSendPhone} className="flex flex-col gap-4">
              <div>
                <FieldLabel>Номер телефона</FieldLabel>
                <PillInput
                  placeholder="+7 999 000-00-00"
                  type="tel"
                  value={form.phone}
                  onChange={upd('phone')}
                  required
                  autoFocus
                />
              </div>
              <ErrorMsg msg={error} />
              <Button type="submit" className="w-full" loading={loading}>
                {!loading && 'Получить код'}
              </Button>
            </form>
          </>
        )}

        {/* ── Phone code ── */}
        {step === 'phone-code' && (
          <>
            <h2 className="text-[20px] font-extrabold tracking-tight text-text mb-1">
              Введи код
            </h2>
            <p className="text-[13px] text-text-2 leading-relaxed mb-5" style={{ textWrap: 'pretty' }}>
              Код отправлен на <strong className="text-text">{pendingPhone}</strong>
            </p>
            <form onSubmit={submitVerifyPhone} className="flex flex-col gap-4">
              <div>
                <FieldLabel>Код из SMS</FieldLabel>
                <PillInput
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.code}
                  onChange={upd('code')}
                  required
                  autoFocus
                />
              </div>
              <div>
                <FieldLabel>Имя (опционально)</FieldLabel>
                <PillInput
                  placeholder="Как тебя зовут?"
                  value={form.name}
                  onChange={upd('name')}
                />
              </div>
              <ErrorMsg msg={error} />
              <Button type="submit" className="w-full" loading={loading}>
                {!loading && 'Войти'}
              </Button>
            </form>
            <p className="text-center mt-4 text-[13px] text-text-2">
              {resendCountdown > 0
                ? <span className="text-text-3">Повторно через {resendCountdown} с</span>
                : (
                  <button
                    type="button"
                    className="text-accent font-bold"
                    onClick={() => { setStep('phone-enter'); setForm(f => ({ ...f, code: '' })) }}
                  >
                    Изменить номер
                  </button>
                )
              }
            </p>
          </>
        )}

        {/* ── Email login / register ── */}
        {(step === 'login' || step === 'register') && (
          <>
            <TabSwitcher tab={tab} onChange={switchTab} />

            <h2 className="text-[20px] font-extrabold tracking-tight text-text mt-5 mb-4">
              {step === 'login' ? 'Войти' : 'Создать аккаунт'}
            </h2>

            <form onSubmit={submitEmailAuth} className="flex flex-col gap-4">
              {step === 'register' && (
                <div>
                  <FieldLabel>Имя</FieldLabel>
                  <PillInput
                    placeholder="Как тебя зовут?"
                    value={form.name}
                    onChange={upd('name')}
                  />
                </div>
              )}
              <div>
                <FieldLabel>Email</FieldLabel>
                <PillInput
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={upd('email')}
                />
              </div>
              <div>
                <FieldLabel>Пароль</FieldLabel>
                <PillInput
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={upd('password')}
                />
              </div>
              <ErrorMsg msg={error} />
              <Button type="submit" className="w-full" loading={loading}>
                {!loading && (step === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </Button>
            </form>

            <p className="text-center mt-4 text-[13px] text-text-2">
              {step === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
              <button
                type="button"
                className="text-accent font-bold"
                onClick={() => { setStep(s => s === 'login' ? 'register' : 'login'); setError('') }}
              >
                {step === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>

            {/* Google divider */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[12px] text-text-3 font-semibold uppercase tracking-wide" style={{ letterSpacing: 0.6 }}>или</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={r => handleGoogle(r.credential)}
                    onError={() => setError('Ошибка Google авторизации')}
                    text="continue_with"
                    shape="pill"
                    width="100%"
                    locale="ru"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Skip link */}
      <button
        type="button"
        className="mt-6 text-[13px] text-text-3 hover:text-text-2"
        onClick={() => navigate('/')}
      >
        Продолжить без регистрации →
      </button>
    </div>
  )
}
