import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../api'

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul])/gm, '')
}

const DIFF = { easy:'Просто', medium:'Средне', hard:'Сложно' }
const DIFF_CLS = { easy:'diff-easy', medium:'diff-medium', hard:'diff-hard' }
const CAT_EMOJI = { BREAKFAST:'🌅',LUNCH:'☀️',DINNER:'🌙',SOUP:'🍲',SALAD:'🥗',SNACK:'🍎',DESSERT:'🍰' }

export default function DishDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dish, setDish] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDish(id).then(setDish).catch(()=>navigate('/dishes')).finally(()=>setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60dvh'}}>
      <div className="loader"/>
    </div>
  )
  if (!dish) return null

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--border)',padding:'14px 16px 16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
          <button className="btn btn-icon" onClick={() => navigate(-1)}>←</button>
          <span style={{fontSize:13,color:'var(--text2)'}}>Назад</span>
        </div>
        <div style={{display:'flex',gap:14,alignItems:'flex-start'}}>
          <div style={{width:60,height:60,background:'var(--bg3)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,flexShrink:0}}>
            {CAT_EMOJI[dish.category] || '🍳'}
          </div>
          <div style={{flex:1}}>
            <h1 style={{fontSize:22,fontWeight:800,fontFamily:'var(--font-serif)',lineHeight:1.2,marginBottom:6}}>
              {dish.name}
            </h1>
            <p style={{fontSize:14,color:'var(--text2)',lineHeight:1.5}}>{dish.description}</p>
          </div>
        </div>

        <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:14}}>
          {dish.cookTime && (
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 14px',textAlign:'center'}}>
              <div style={{fontSize:18}}>⏱</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{dish.cookTime} мин</div>
            </div>
          )}
          {dish.calories && (
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 14px',textAlign:'center'}}>
              <div style={{fontSize:18}}>🔥</div>
              <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{dish.calories} ккал</div>
            </div>
          )}
          {dish.difficulty && (
            <div style={{background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'8px 14px',textAlign:'center'}}>
              <div style={{fontSize:18}}>👨‍🍳</div>
              <div className={`${DIFF_CLS[dish.difficulty]}`} style={{fontSize:12,marginTop:2,fontWeight:700}}>
                {DIFF[dish.difficulty]}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="page" style={{paddingTop:20}}>
        {/* Tags */}
        <div className="dish-tags" style={{marginBottom:20}}>
          {dish.tags.map(t => <span key={t} className="tag" style={{cursor:'default'}}>{t}</span>)}
        </div>

        {/* Ingredients */}
        <h2 className="section-title" style={{fontSize:18}}>🛒 Ингредиенты</h2>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:24}}>
          {dish.ingredients.map(ing => (
            <div key={ing.id} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',background:'var(--bg3)',border:'1px solid var(--border)',borderRadius:20,fontSize:13,fontWeight:600}}>
              {ing.emoji && <span>{ing.emoji}</span>}
              {ing.name}
              {ing.amount && <span style={{color:'var(--text2)',fontWeight:400}}> — {ing.amount}</span>}
              {ing.optional && <span style={{color:'var(--text3)',fontSize:11}}> (опц.)</span>}
            </div>
          ))}
        </div>

        {/* Recipe */}
        {dish.recipe && (
          <>
            <h2 className="section-title" style={{fontSize:18}}>📋 Рецепт</h2>
            <div className="card" style={{padding:16}}>
              <div className="recipe-content"
                dangerouslySetInnerHTML={{__html: renderMarkdown(dish.recipe)}}/>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
