import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useStore()
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = mode === 'login'
        ? await api.login(email, password)
        : await api.register(email, password, name)
      setAuth(res.user, res.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(249,115,22,.12) 0%, transparent 60%), var(--bg)',
    }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '.5rem' }}>🍽️</div>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '2rem', color: 'var(--accent)' }}>
            MealBot
          </h1>
          <p style={{ color: 'var(--text2)', marginTop: '.3rem', fontSize: '.95rem' }}>
            Умный помощник в выборе блюд
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '1.8rem' }}>
          {/* Mode toggle */}
          <div style={{
            display: 'flex', background: 'var(--bg3)',
            borderRadius: 'var(--radius-sm)', padding: '3px', marginBottom: '1.5rem',
          }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError('') }}
                style={{
                  flex: 1, padding: '.5rem', borderRadius: '6px',
                  background: mode === m ? 'var(--accent)' : 'transparent',
                  color: mode === m ? '#fff' : 'var(--text2)',
                  fontWeight: 700, fontSize: '.9rem', transition: 'all .2s',
                }}>
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'register' && (
              <div>
                <label style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.3rem', display: 'block' }}>
                  Имя
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Как вас зовут?" />
              </div>
            )}
            <div>
              <label style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.3rem', display: 'block' }}>
                Email
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required />
            </div>
            <div>
              <label style={{ fontSize: '.8rem', color: 'var(--text2)', marginBottom: '.3rem', display: 'block' }}>
                Пароль
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={6} />
            </div>

            {error && (
              <div style={{
                background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)',
                borderRadius: 'var(--radius-sm)', padding: '.7rem 1rem',
                color: 'var(--red)', fontSize: '.9rem',
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}
              style={{ marginTop: '.5rem', padding: '.85rem' }}>
              {loading ? <span className="spinner" style={{ width:18,height:18 }} /> : null}
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
