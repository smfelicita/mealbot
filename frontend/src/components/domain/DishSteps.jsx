import SectionTitle from '../ui/SectionTitle'
import Card from '../ui/Card'

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

export default function DishSteps({ recipe }) {
  if (!recipe) return null

  return (
    <div className="mb-0">
      <SectionTitle>Приготовление</SectionTitle>
      <Card>
        <div
          className="p-4 recipe-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(recipe) }}
        />
      </Card>
    </div>
  )
}
