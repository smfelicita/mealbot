import { useState } from 'react'
import { api } from '../../api'
import SectionTitle from '../ui/SectionTitle'
import Button from '../ui/Button'

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function CommentItem({ comment, isOwner, isDishOwner, onDelete, onPin }) {
  return (
    <div className={[
      'rounded-sm p-3.5 border',
      comment.isPinned
        ? 'bg-accent/6 border-accent'
        : 'bg-bg-2 border-border',
    ].join(' ')}>
      <div className="flex items-center gap-2 mb-1.5">
        {comment.isPinned && (
          <span className="text-xs text-accent font-bold">Закреплено</span>
        )}
        <span className="font-bold text-sm">{comment.user?.name || 'Участник'}</span>
        <span className="text-[11px] text-text-3 ml-auto">{formatDate(comment.createdAt)}</span>
      </div>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      {(isDishOwner || isOwner) && (
        <div className="flex gap-2 mt-2">
          {isDishOwner && (
            <button
              type="button"
              onClick={() => onPin(comment.id)}
              className={[
                'text-[11px] font-bold px-2 py-0.5 rounded focus:outline-none',
                comment.isPinned ? 'text-accent' : 'text-text-2',
              ].join(' ')}
            >
              {comment.isPinned ? 'Открепить' : 'Закрепить'}
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              className="text-[11px] font-bold text-red-400 px-2 py-0.5 rounded focus:outline-none"
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommentsSection({ comments, setComments, dishId, currentUser, dishAuthorId }) {
  const [text, setText]       = useState('')
  const [sending, setSending] = useState(false)

  async function handleAdd() {
    if (!text.trim()) return
    setSending(true)
    try {
      const created = await api.addComment(dishId, text.trim())
      setComments(prev => [...prev, created])
      setText('')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id) {
    await api.deleteComment(id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  async function handlePin(id) {
    const updated = await api.pinComment(id)
    setComments(prev => {
      const next = prev.map(c => c.id === id ? updated : c)
      return [...next].sort((a, b) => {
        if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    })
  }

  return (
    <div className="mb-6">
      <SectionTitle>Комментарии</SectionTitle>

      {comments.length === 0 && (
        <p className="text-sm text-text-2 mb-3">Пока нет комментариев. Будьте первым!</p>
      )}

      <div className="flex flex-col gap-2.5 mb-4">
        {comments.map(c => (
          <CommentItem
            key={c.id}
            comment={c}
            isOwner={c.userId === currentUser?.id}
            isDishOwner={dishAuthorId === currentUser?.id}
            onDelete={handleDelete}
            onPin={handlePin}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          className="w-full bg-bg-3 border border-border rounded-sm text-text text-[15px]
            px-3.5 py-2.5 outline-none transition-colors resize-y
            placeholder:text-text-3 focus:border-accent focus:ring-2 focus:ring-accent/20"
          rows={3}
          placeholder="Напишите комментарий..."
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <Button
          size="sm"
          onClick={handleAdd}
          loading={sending}
          disabled={!text.trim()}
          className="self-start"
        >
          Отправить
        </Button>
      </div>
    </div>
  )
}
