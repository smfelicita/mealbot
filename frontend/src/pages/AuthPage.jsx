import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../api'
import { useStore } from '../store'
import { Button, TextInput } from '../components/ui'

// ─── Shared input style ───────────────────────────────────────────────────────
const inputCls = 'w-full bg-bg-3 border border-border rounded-sm text-text text-[15px] px-3.5 py-2.5 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 placeholder:text-text-3'

function FieldLabel({ children }) {
  return <p className="text-xs font-bold text-text-2 uppercase tracking-wider mb-1.5">{children}</p>
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return <p className="text-red-400 text-[13px] mb-3">⚠️ {msg}</p>
}

function ResendLine({ countdown, onResend, loading, label = 'Отправить повторно' }) {
  return (
    <p className="text-center mt-4 text-[13px] text-text-2">
      Не получили?{' '}
      {countdown > 0
        ? <span className="text-text-3">Повторно через {countdown} с</span>
        : <button type="button" className="text-accent font-bold" onClick={onResend} disabled={loading}>{label}</button>
      }
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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
        // countdown = 0 — кнопка "Отправить повторно" сразу доступна,
        // потому что при логине новый код не отправляется автоматически
        setResendCountdown(0)
        return
      }
      setError(err.message)
    }
    finally { setLoading(false) }
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 bg-bg fade-in">
      {/* Logo */}
      <div className="text-[40px] mb-1">🍽️</div>
      <h1 className="font-serif text-[26px] font-extrabold mb-1">MealBot</h1>
      <p className="text-sm text-text-2 mb-8">Умный помощник для выбора блюд</p>

      {/* Card */}
      <div className="w-full max-w-[360px] bg-bg-2 border border-border rounded-DEFAULT p-6 fade-up">

        {/* ── Verify email ── */}
        {step === 'verify-email' && (
          <>
            <h2 className="font-serif text-xl font-extrabold mb-1">Подтверди email</h2>
            <p className="text-[13px] text-text-2 mb-4 leading-relaxed">
              Код отправлен на <strong>{pendingEmail}</strong><br />
              <span className="text-text-3 text-xs">Не нашли? Проверьте папку «Спам»</span>
            </p>
            <form onSubmit={submitVerifyEmail} className="flex flex-col gap-4">
              <div>
                <FieldLabel>Код из письма</FieldLabel>
                <input className={inputCls} placeholder="123456" maxLength={6}
                  value={form.code} onChange={upd('code')} required autoFocus />
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
            <h2 className="font-serif text-xl font-extrabold mb-4">Вход по телефону</h2>
            <form onSubmit={submitSendPhone} className="flex flex-col gap-4">
              <div>
                <FieldLabel>Номер телефона</FieldLabel>
                <input className={inputCls} placeholder="+7 999 000-00-00" type="tel"
                  value={form.phone} onChange={upd('phone')} required autoFocus />
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
            <h2 className="font-serif text-xl font-extrabold mb-1">Введи код</h2>
            <p className="text-[13px] text-text-2 mb-4 leading-relaxed">
              Код отправлен на <strong>{pendingPhone}</strong>
            </p>
            <form onSubmit={submitVerifyPhone} className="flex flex-col gap-4">
              <div>
                <FieldLabel>Код из SMS</FieldLabel>
                <input className={inputCls} placeholder="123456" maxLength={6}
                  value={form.code} onChange={upd('code')} required autoFocus />
              </div>
              <div>
                <FieldLabel>Имя <span className="normal-case font-normal text-text-3">(опционально)</span></FieldLabel>
                <input className={inputCls} placeholder="Как тебя зовут?" value={form.name} onChange={upd('name')} />
              </div>
              <ErrorMsg msg={error} />
              <Button type="submit" className="w-full" loading={loading}>
                {!loading && 'Войти'}
              </Button>
            </form>
            <p className="text-center mt-4 text-[13px] text-text-2">
              {resendCountdown > 0
                ? <span className="text-text-3">Повторно через {resendCountdown} с</span>
                : <button type="button" className="text-accent font-bold"
                    onClick={() => { setStep('phone-enter'); setForm(f => ({ ...f, code: '' })) }}>
                    Изменить номер
                  </button>
              }
            </p>
          </>
        )}

        {/* ── Email login / register ── */}
        {(step === 'login' || step === 'register') && (
          <>
            {/* Tab switcher */}
            <div className="flex rounded-sm overflow-hidden border border-border mb-5">
              {[['email', '📧 Email'], ['phone', '📱 Телефон']].map(([t, label]) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => switchTab(t)}
                  className={[
                    'flex-1 py-2 text-[13px] font-bold transition-colors',
                    tab === t ? 'bg-accent text-white' : 'bg-bg-3 text-text-2 hover:text-text',
                  ].join(' ')}
                >{label}</button>
              ))}
            </div>

            <h2 className="font-serif text-xl font-extrabold mb-4">
              {step === 'login' ? 'Войти' : 'Создать аккаунт'}
            </h2>

            <form onSubmit={submitEmailAuth} className="flex flex-col gap-4">
              {step === 'register' && (
                <div>
                  <FieldLabel>Имя</FieldLabel>
                  <input className={inputCls} placeholder="Как тебя зовут?" value={form.name} onChange={upd('name')} />
                </div>
              )}
              <div>
                <FieldLabel>Email</FieldLabel>
                <input className={inputCls} type="email" required placeholder="you@example.com"
                  value={form.email} onChange={upd('email')} />
              </div>
              <div>
                <FieldLabel>Пароль</FieldLabel>
                <input className={inputCls} type="password" required minLength={6} placeholder="••••••••"
                  value={form.password} onChange={upd('password')} />
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

            {/* Divider + Google */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-text-3">или</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={r => handleGoogle(r.credential)}
                    onError={() => setError('Ошибка Google авторизации')}
                    text="continue_with"
                    shape="rectangular"
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
