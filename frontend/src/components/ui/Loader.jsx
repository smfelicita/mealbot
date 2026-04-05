export default function Loader({ fullPage = false }) {
  const spinner = (
    <span className="w-6 h-6 border-[2.5px] border-border border-t-accent rounded-full animate-spin" />
  )

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        {spinner}
      </div>
    )
  }

  return spinner
}
