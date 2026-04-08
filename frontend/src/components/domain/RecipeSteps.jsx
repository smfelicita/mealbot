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

export default function RecipeSteps({ recipe }) {
  if (!recipe) return null

  return (
    <div className="mb-0">
      <h2 className="text-[17px] font-semibold text-text mb-4">Приготовление</h2>
      <div
        className="recipe-content"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(recipe) }}
      />
    </div>
  )
}
