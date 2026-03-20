import { useState, useRef, useEffect } from 'react'
import { api } from '../api'
import { useStore } from '../store'

const SUGGESTIONS = [
  'Что приготовить на завтрак?',
  'Хочу что-то лёгкое на обед',
  'Быстрый ужин за 15 минут',
  'Вегетарианский вариант',
  'Что можно из яиц и молока?',
]

export default function ChatPage() {
  const { chatMessages, addChatMessage, clearChatMessages } = useStore()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, loading])

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')
    addChatMessage({ role: 'user', content: msg, id: Date.now() })
    setLoading(true)
    try {
      const res = await api.sendMessage(msg)
      addChatMessage({ role: 'assistant', content: res.message, id: Date.now()+1 })
    } catch (e) {
      addChatMessage({ role: 'assistant', content: '⚠️ Ошибка: ' + e.message, id: Date.now()+1 })
    } finally { setLoading(false) }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className="chat-container">
      <div className="top-bar" style={{position:'relative',top:'auto'}}>
        <span className="top-bar-logo">✨ ИИ-помощник</span>
        <div style={{flex:1}}/>
        {chatMessages.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{color:'var(--text3)'}} onClick={clearChatMessages}>
            Очистить
          </button>
        )}
      </div>

      <div className="chat-messages">
        {chatMessages.length === 0 && (
          <div className="fade-up">
            <div style={{textAlign:'center',padding:'24px 0 20px'}}>
              <div style={{fontSize:40,marginBottom:10}}>✨</div>
              <h2 style={{fontFamily:'var(--font-serif)',fontSize:20,fontWeight:700,marginBottom:6}}>ИИ-помощник</h2>
              <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.6}}>
                Расскажите что хотите съесть, и я подберу лучшие варианты из базы блюд с учётом вашего холодильника
              </p>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {SUGGESTIONS.map(s => (
                <button key={s} className="card card-hover" style={{padding:'12px 16px',textAlign:'left',fontSize:14,color:'var(--text2)',cursor:'pointer'}}
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
              ? <span dangerouslySetInnerHTML={{__html: msg.content.replace(/\n/g,'<br/>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')}}/>
              : msg.content
            }
          </div>
        ))}

        {loading && (
          <div className="chat-bubble assistant fade-in">
            <div style={{display:'flex',gap:5,alignItems:'center',padding:'2px 0'}}>
              <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      <div className="chat-input-bar">
        <input ref={inputRef} className="input" placeholder="Спросите про блюда..."
          value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
          disabled={loading}/>
        <button className="chat-send-btn" disabled={!input.trim() || loading} onClick={() => send()}>
          {loading ? <span className="loader" style={{width:18,height:18,borderTopColor:'#fff'}}/> : '↑'}
        </button>
      </div>
    </div>
  )
}
