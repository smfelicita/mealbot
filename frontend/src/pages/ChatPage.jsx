import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'

const SUGGESTIONS = [
  'Что приготовить на завтрак?',
  'Хочу что-то лёгкое на обед',
  'Быстрый ужин за 15 минут',
  'Вегетарианский вариант',
  'Что можно из яиц и молока?',
]

const GUEST_LIMIT = 5
const STORAGE_KEY = 'mealbot_guest_chat'

function getGuestState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, date: new Date().toDateString() }
    const parsed = JSON.parse(raw)
    if (parsed.date !== new Date().toDateString()) return { count: 0, date: new Date().toDateString() }
    return parsed
  } catch {
    return { count: 0, date: new Date().toDateString() }
  }
}

function saveGuestState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export default function ChatPage() {
  const { chatMessages, addChatMessage, clearChatMessages, token } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLeft, setGuestLeft] = useState(() => {
    const s = getGuestState()
    return GUEST_LIMIT - s.count
  })
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  const isGuest = !token
  const guestBlocked = isGuest && guestLeft <= 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    if (guestBlocked) return

    setInput('')
    addChatMessage({ role: 'user', content: msg, id: Date.now() })
    setLoading(true)
    try {
      const res = await api.sendMessage(msg)
      addChatMessage({ role: 'assistant', content: res.message, id: Date.now() + 1 })

      if (isGuest) {
        if (res.guestMessagesLeft !== undefined) {
          setGuestLeft(res.guestMessagesLeft)
          const s = getGuestState()
          saveGuestState({ count: GUEST_LIMIT - res.guestMessagesLeft, date: s.date })
        }
      }
    } catch (e) {
      if (e.message === 'Лимит исчерпан') {
        setGuestLeft(0)
        saveGuestState({ count: GUEST_LIMIT, date: new Date().toDateString() })
      } else {
        addChatMessage({ role: 'assistant', content: '⚠️ Ошибка: ' + e.message, id: Date.now() + 1 })
      }
    } finally {
      setLoading(false)
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="chat-container">
      <div className="top-bar" style={{ position: 'relative', top: 'auto' }}>
        <span className="top-bar-logo">✨ ИИ-помощник</span>
        <div style={{ flex: 1 }} />
        {isGuest && !guestBlocked && (
          <span style={{ fontSize: 12, color: 'var(--text2)', marginRight: 8 }}>
            {guestLeft} из {GUEST_LIMIT} бесплатных
          </span>
        )}
        {!isGuest && chatMessages.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)' }} onClick={clearChatMessages}>
            Очистить
          </button>
        )}
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && !guestBlocked && (
          <div className="fade-up">
            <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>✨</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>ИИ-помощник</h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                {isGuest
                  ? `Расскажите что хотите съесть — подберу варианты из базы блюд. Гостям доступно ${GUEST_LIMIT} сообщений в день.`
                  : 'Расскажите что хотите съесть, и я подберу лучшие варианты из базы блюд с учётом вашего холодильника'
                }
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="card card-hover"
                  style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, color: 'var(--text2)', cursor: 'pointer' }}
                  onClick={() => send(s)}>
                  {s} →
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            {msg.role === 'assistant'
              ? <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              : msg.content
            }
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant fade-in">
            <div style={{ display: 'flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          </div>
        )}

        {guestBlocked && (
          <div className="fade-up" style={{ padding: '24px 0' }}>
            <div className="card" style={{ padding: 24, textAlign: 'center', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✨</div>
              <h3 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Лимит исчерпан</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 20 }}>
                Вы использовали все {GUEST_LIMIT} бесплатных сообщений на сегодня.<br />
                Зарегистрируйтесь — и получите безлимитный доступ к ИИ-помощнику с контекстом холодильника.
              </p>
              <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }}
                onClick={() => navigate('/auth?mode=register')}>
                Зарегистрироваться бесплатно
              </button>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--text2)' }}
                onClick={() => navigate('/auth')}>
                Уже есть аккаунт? Войти
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input className="input" placeholder={guestBlocked ? 'Зарегистрируйтесь для продолжения' : 'Спросите про блюда...'}
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
          disabled={loading || guestBlocked} />
        <button className="chat-send-btn" disabled={!input.trim() || loading || guestBlocked} onClick={() => send()}>
          {loading ? <span className="loader" style={{ width: 18, height: 18, borderTopColor: '#fff' }} /> : '↑'}
        </button>
      </div>
    </div>
  )
}
