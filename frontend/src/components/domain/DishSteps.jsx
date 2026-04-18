import SectionTitle from '../ui/SectionTitle'
import Card from '../ui/Card'

function renderInline(text) {
  const parts = text.split(/\*\*(.+?)\*\*/)
  return parts.map((p, i) => i % 2 === 1 ? <strong key={i}>{p}</strong> : p)
}

function parseMarkdown(text) {
  const lines = text.split('\n')
  const nodes = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    const numMatch = line.match(/^(\d+)\.\s+(.+)/)
    if (numMatch) {
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(/^(\d+)\.\s+(.+)/)
        if (!m) break
        items.push({ num: parseInt(m[1], 10), text: m[2] })
        i++
      }
      nodes.push({ type: 'ol', items })
      continue
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)/)
    if (bulletMatch) {
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(/^[-*]\s+(.+)/)
        if (!m) break
        items.push(m[1])
        i++
      }
      nodes.push({ type: 'ul', items })
      continue
    }

    const h2Match = line.match(/^##\s+(.+)/)
    if (h2Match) {
      nodes.push({ type: 'h2', text: h2Match[1] })
      i++
      continue
    }

    if (line.trim() === '') { i++; continue }

    nodes.push({ type: 'p', text: line })
    i++
  }

  return nodes
}

export default function DishSteps({ recipe }) {
  if (!recipe) return null

  const nodes = parseMarkdown(recipe)

  return (
    <div className="mb-0">
      <SectionTitle>Приготовление</SectionTitle>
      <Card>
        <div className="p-4 flex flex-col gap-3">
          {nodes.map((node, idx) => {
            if (node.type === 'ol') {
              return (
                <ol key={idx} className="flex flex-col gap-3">
                  {node.items.map(item => (
                    <li key={item.num} className="flex items-start gap-3">
                      <span className="shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent text-xs font-bold flex items-center justify-center mt-0.5">
                        {item.num}
                      </span>
                      <span className="text-[15px] text-text leading-snug flex-1">
                        {renderInline(item.text)}
                      </span>
                    </li>
                  ))}
                </ol>
              )
            }

            if (node.type === 'ul') {
              return (
                <ul key={idx} className="flex flex-col gap-2">
                  {node.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-[15px] text-text leading-snug">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-text-3 mt-2" />
                      <span>{renderInline(item)}</span>
                    </li>
                  ))}
                </ul>
              )
            }

            if (node.type === 'h2') {
              return (
                <h2 key={idx} className="text-[15px] font-semibold text-text mt-1">
                  {renderInline(node.text)}
                </h2>
              )
            }

            return (
              <p key={idx} className="text-[15px] text-text-2 leading-snug">
                {renderInline(node.text)}
              </p>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
