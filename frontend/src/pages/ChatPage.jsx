import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useStore } from '../store'
import { Button, Card } from '../components/ui'

const SUGGESTIONS = [
  'Что приготовить на завтрак?',
  'Хочу что-то лёгкое на обед',
  'Быстрый ужин за 15 минут',
  'Вегетарианский вариант',
  'Что можно из яиц и молока?',
]

const GUEST_LIMIT  = 2
const STORAGE_KEY  = 'mealbot_guest_chat'

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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function cleanAndFormat(text) {
  return escapeHtml(text.replace(/\[DISH:[a-z0-9]+\]/gi, ''))
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

// ─── Inline dish card in chat ────────────────────────────────────────────────
function InlineDishCard({ dish, onClick }) {
  const img = dish.images?.[0] || dish.imageUrl
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 bg-bg-3 border border-border rounded-sm px-2.5 py-2 w-full text-left hover:border-accent/50 transition-colors"
    >
      <div className="w-8 h-8 rounded-sm overflow-hidden bg-bg-2 flex items-center justify-center text-base shrink-0">
        {img
          ? <img src={img} alt="" className="w-full h-full object-cover" />
          : '🍽'}
      </div>
      <span className="flex-1 text-[13px] font-semibold truncate">{dish.nameRu || dish.name}</span>
      <span className="text-text-3 text-xs shrink-0">→</span>
    </button>
  )
}

// ─── Typing indicator ────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex gap-1 items-center py-1 px-1">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-2 h-2 bg-text-3 rounded-full inline-block animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { chatMessages, addChatMessage, clearChatMessages, token } = useStore()
  const [searchParams] = useSearchParams()
  const [input, setInput]   = useState(() => searchParams.get('prompt') || '')
  const [loading, setLoading] = useState(false)
  const [guestLeft, setGuestLeft] = useState(() => GUEST_LIMIT - getGuestState().count)
  const bottomRef = useRef(null)
  const navigate  = useNavigate()

  const isGuest     = !token
  const guestBlocked = isGuest && guestLeft <= 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading || guestBlocked) return

    setInput('')
    addChatMessage({ role: 'user', content: msg, id: Date.now() })
    setLoading(true)
    try {
      const res = await api.sendMessage(msg)
      addChatMessage({
        role: 'assistant', content: res.message,
        dishes: res.dishes || [], id: Date.now() + 1,
      })
      if (isGuest && res.guestMessagesLeft !== undefined) {
        setGuestLeft(res.guestMessagesLeft)
        const s = getGuestState()
        saveGuestState({ count: GUEST_LIMIT - res.guestMessagesLeft, date: s.date })
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
    /* Full-height flex column between header (52px) and tab bar (48px) */
    <div className="fixed inset-x-0 top-[52px] bottom-[48px] flex flex-col max-w-app mx-auto bg-bg">

      {/* ── Mini top bar ── */}
      <div className="shrink-0 flex items-center px-3 h-11 border-b border-border gap-2">
        <span className="font-serif font-bold text-[15px] flex-1">✨ ИИ-помощник</span>
        {isGuest && !guestBlocked && (
          <span className="text-xs text-text-2">
            {guestLeft} из {GUEST_LIMIT} бесплатных
          </span>
        )}
        {!isGuest && chatMessages.length > 0 && (
          <Button variant="ghost" size="sm" className="text-text-3" onClick={clearChatMessages}>
            Очистить
          </Button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">

        {/* Welcome + suggestions */}
        {chatMessages.length === 0 && !guestBlocked && (
          <div className="fade-up flex flex-col gap-3">
            <div className="text-center py-5">
              <div className="text-[40px] mb-2">✨</div>
              <h2 className="font-serif text-xl font-bold mb-2">ИИ-помощник</h2>
              <p className="text-[13px] text-text-2 leading-relaxed max-w-xs mx-auto">
                {isGuest
                  ? `Расскажите что хотите съесть — подберу варианты из базы. Гостям доступно ${GUEST_LIMIT} сообщений в день.`
                  : 'Расскажите что хотите съесть, и я подберу варианты с учётом вашего холодильника'}
              </p>
            </div>
            {SUGGESTIONS.map(s => (
              <Card key={s} onClick={() => send(s)} className="px-4 py-3 text-sm text-text-2 text-left">
                {s} →
              </Card>
            ))}
          </div>
        )}

        {/* Message bubbles */}
        {chatMessages.map(msg => (
          <div
            key={msg.id}
            className={[
              'max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'self-end bg-accent text-white rounded-br-sm'
                : 'self-start bg-bg-2 border border-border text-text rounded-bl-sm',
            ].join(' ')}
          >
            {msg.role === 'assistant' ? (
              <>
                <span dangerouslySetInnerHTML={{ __html: cleanAndFormat(msg.content) }} />
                {msg.dishes?.length > 0 && (
                  <div className="mt-2.5 flex flex-col gap-1.5">
                    {msg.dishes.map(d => (
                      <InlineDishCard key={d.id} dish={d} onClick={() => navigate(`/dishes/${d.id}`)} />
                    ))}
                  </div>
                )}
              </>
            ) : msg.content}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="self-start bg-bg-2 border border-border rounded-[14px] rounded-bl-sm px-3.5 py-2.5 fade-in">
            <TypingDots />
          </div>
        )}

        {/* Guest limit reached */}
        {guestBlocked && (
          <div className="fade-up py-4">
            <div className="bg-bg-2 border border-border rounded-DEFAULT p-6 text-center">
              <div className="text-[36px] mb-3">✨</div>
              <h3 className="font-extrabold text-lg mb-2">Лимит исчерпан</h3>
              <p className="text-[13px] text-text-2 leading-relaxed mb-5">
                Вы использовали все {GUEST_LIMIT} бесплатных сообщений на сегодня.
                Зарегистрируйтесь — и получите безлимитный доступ к ИИ-помощнику с контекстом холодильника.
              </p>
              <Button className="w-full mb-2" onClick={() => navigate('/auth?mode=register')}>
                Зарегистрироваться бесплатно
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-text-2"
                onClick={() => navigate('/auth')}>
                Уже есть аккаунт? Войти
              </Button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="shrink-0 flex items-end gap-2 px-3 py-2.5 border-t border-border bg-bg">
        <input
          className="flex-1 bg-bg-3 border border-border rounded-sm text-text text-[15px]
            px-3.5 py-2.5 outline-none transition-colors resize-none
            placeholder:text-text-3 focus:border-accent focus:ring-2 focus:ring-accent/20
            disabled:opacity-50"
          placeholder={guestBlocked ? 'Зарегистрируйтесь для продолжения' : 'Спросите про блюда...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          disabled={loading || guestBlocked}
        />
        <button
          type="button"
          disabled={!input.trim() || loading || guestBlocked}
          onClick={() => send()}
          className={[
            'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg',
            'shrink-0 transition-all',
            (!input.trim() || loading || guestBlocked)
              ? 'bg-border cursor-not-allowed'
              : 'bg-accent hover:bg-accent/90 cursor-pointer',
          ].join(' ')}
        >
          {loading
            ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : '↑'}
        </button>
      </div>
    </div>
  )
}
