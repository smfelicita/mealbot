import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { api } from '../api'
import { useStore } from '../store'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  // tab: 'email' | 'phone'
  const [tab, setTab] = useState('email')
  // step: 'login' | 'register' | 'verify-email' | 'phone-enter' | 'phone-code'
  const [step, setStep] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '', code: '' })
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingPhone, setPendingPhone] = useState('')
  const [error, setError] = useState('')
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
        setAuth(res.user, res.token); navigate('/')
      } else {
        const res = await api.register(form.email, form.password, form.name)
        if (res.requireVerification) {
          setPendingEmail(res.email)
          setStep('verify-email')
          setResendCountdown(60)
        } else {
          setAuth(res.user, res.token); navigate('/')
        }
      }
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function submitVerifyEmail(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.verifyEmail(pendingEmail, form.code)
      setAuth(res.user, res.token); navigate('/')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function resendEmail() {
    setError(''); setLoading(true)
    try {
      await api.resendEmailCode(pendingEmail)
      setResendCountdown(60)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function submitSendPhone(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.sendPhoneCode(form.phone)
      setPendingPhone(res.phone)
      setStep('phone-code')
      setResendCountdown(60)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function submitVerifyPhone(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await api.verifyPhone(pendingPhone, form.code, form.name || undefined)
      setAuth(res.user, res.token); navigate('/')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function handleGoogle(credential) {
    setError(''); setLoading(true)
    try {
      const res = await api.googleAuth(credential)
      setAuth(res.user, res.token); navigate('/')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  function switchTab(t) {
    setTab(t); setError('')
    setStep(t === 'phone' ? 'phone-enter' : 'login')
    setForm({ email: '', password: '', name: '', phone: '', code: '' })
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-logo">🍽️ MealBot</div>
      <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center' }}>Умный помощник для выбора блюд</p>

      <div className="auth-card fade-up">
        {/* Шаг: подтверждение email */}
        {step === 'verify-email' ? (
          <>
            <h2>Подтверди email</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Код отправлен на <strong>{pendingEmail}</strong>
              <br /><span style={{ color: 'var(--accent)', fontSize: 12 }}>Для теста смотри логи сервера</span>
            </p>
            <form onSubmit={submitVerifyEmail}>
              <div className="form-group">
                <label>Код из письма</label>
                <input className="input" placeholder="123456" maxLength={6}
                  value={form.code} onChange={upd('code')} required autoFocus />
              </div>
              {error && <p className="form-error" style={{ marginBottom: 12 }}>⚠️ {error}</p>}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="loader" style={{ width: 16, height: 16 }} /> : 'Подтвердить'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text2)' }}>
              Не получили код?{' '}
              {resendCountdown > 0
                ? <span style={{ color: 'var(--text3)' }}>Повторно через {resendCountdown} с</span>
                : <button className="btn-ghost" style={{ padding: 0, color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}
                  onClick={resendEmail} disabled={loading}>Отправить повторно</button>
              }
            </p>
          </>
        ) : step === 'phone-enter' ? (
          <>
            <h2>Вход по телефону</h2>
            <form onSubmit={submitSendPhone}>
              <div className="form-group">
                <label>Номер телефона</label>
                <input className="input" placeholder="+7 999 000-00-00" type="tel"
                  value={form.phone} onChange={upd('phone')} required autoFocus />
              </div>
              {error && <p className="form-error" style={{ marginBottom: 12 }}>⚠️ {error}</p>}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="loader" style={{ width: 16, height: 16 }} /> : 'Получить код'}
              </button>
            </form>
          </>
        ) : step === 'phone-code' ? (
          <>
            <h2>Введи код</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              Код отправлен на <strong>{pendingPhone}</strong>
              <br /><span style={{ color: 'var(--accent)', fontSize: 12 }}>Для теста смотри логи сервера</span>
            </p>
            <form onSubmit={submitVerifyPhone}>
              <div className="form-group">
                <label>Код из SMS</label>
                <input className="input" placeholder="123456" maxLength={6}
                  value={form.code} onChange={upd('code')} required autoFocus />
              </div>
              <div className="form-group">
                <label>Имя <span style={{ color: 'var(--text3)', fontSize: 12 }}>(опционально)</span></label>
                <input className="input" placeholder="Как тебя зовут?" value={form.name} onChange={upd('name')} />
              </div>
              {error && <p className="form-error" style={{ marginBottom: 12 }}>⚠️ {error}</p>}
              <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <span className="loader" style={{ width: 16, height: 16 }} /> : 'Войти'}
              </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text2)' }}>
              {resendCountdown > 0
                ? <span style={{ color: 'var(--text3)' }}>Повторно через {resendCountdown} с</span>
                : <button className="btn-ghost" style={{ padding: 0, color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}
                  onClick={() => { setStep('phone-enter'); setForm(f => ({ ...f, code: '' })) }}>
                  Изменить номер
                </button>
              }
            </p>
          </>
        ) : (
          <>
            {/* Вкладки Email / Телефон */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
              {[['email', '📧 Email'], ['phone', '📱 Телефон']].map(([t, label]) => (
                <button key={t} onClick={() => switchTab(t)} style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: tab === t ? 'var(--accent)' : 'var(--bg3)',
                  color: tab === t ? '#fff' : 'var(--text2)',
                  transition: 'background .2s',
                }}>
                  {label}
                </button>
              ))}
            </div>

            <h2 style={{ marginBottom: 16 }}>{step === 'login' ? 'Войти' : 'Создать аккаунт'}</h2>

            <form onSubmit={submitEmailAuth}>
              {step === 'register' && (
                <div className="form-group">
                  <label>Имя</label>
                  <input className="input" placeholder="Как тебя зовут?" value={form.name} onChange={upd('name')} />
                </div>
              )}
              <div className="form-group">
                <label>Email</label>
                <input className="input" type="email" required placeholder="you@example.com"
                  value={form.email} onChange={upd('email')} />
              </div>
              <div className="form-group">
                <label>Пароль</label>
                <input className="input" type="password" required minLength={6} placeholder="••••••••"
                  value={form.password} onChange={upd('password')} />
              </div>
              {error && <p className="form-error" style={{ marginBottom: 12 }}>⚠️ {error}</p>}
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
                {loading ? <span className="loader" style={{ width: 16, height: 16 }} />
                  : step === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text2)' }}>
              {step === 'login' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
              <button className="btn-ghost" style={{ padding: 0, color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}
                onClick={() => { setStep(s => s === 'login' ? 'register' : 'login'); setError('') }}>
                {step === 'login' ? 'Зарегистрироваться' : 'Войти'}
              </button>
            </p>

            {/* Google */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>или</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>
              <GoogleLogin
                onSuccess={credentialResponse => handleGoogle(credentialResponse.credential)}
                onError={() => setError('Ошибка Google авторизации')}
                text="continue_with"
                shape="rectangular"
                width="100%"
                locale="ru"
              />
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
        <button className="btn-ghost" style={{ padding: 0, fontSize: 13, color: 'var(--text3)' }}
          onClick={() => navigate('/')}>
          Продолжить без регистрации →
        </button>
      </p>
    </div>
  )
}
