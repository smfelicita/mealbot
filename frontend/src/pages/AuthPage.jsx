import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login')
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useStore()
  const navigate = useNavigate()
  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = mode === 'login'
        ? await api.login(form.email, form.password)
        : await api.register(form.email, form.password, form.name)
      setAuth(res.user, res.token); navigate('/')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-logo">🍽️ MealBot</div>
      <p style={{color:'var(--text2)',fontSize:14,textAlign:'center'}}>Умный помощник для выбора блюд</p>
      <div className="auth-card fade-up">
        <h2>{mode === 'login' ? 'Войти' : 'Создать аккаунт'}</h2>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="form-group">
              <label>Имя</label>
              <input className="input" placeholder="Как тебя зовут?" value={form.name} onChange={update('name')} />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" required placeholder="you@example.com" value={form.email} onChange={update('email')} />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input className="input" type="password" required minLength={6} placeholder="••••••••" value={form.password} onChange={update('password')} />
          </div>
          {error && <p className="form-error" style={{marginBottom:12}}>⚠️ {error}</p>}
          <button className="btn btn-primary" style={{width:'100%',marginTop:4}} disabled={loading}>
            {loading ? <span className="loader" style={{width:16,height:16}}/> : mode==='login'?'Войти':'Зарегистрироваться'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:16,fontSize:13,color:'var(--text2)'}}>
          {mode==='login'?'Нет аккаунта? ':'Уже есть аккаунт? '}
          <button className="btn-ghost" style={{padding:0,color:'var(--accent)',fontWeight:700,fontSize:13}}
            onClick={()=>{setMode(m=>m==='login'?'register':'login');setError('')}}>
            {mode==='login'?'Зарегистрироваться':'Войти'}
          </button>
        </p>
      </div>
    </div>
  )
}
