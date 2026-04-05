export default function Textarea({
  label,
  error,
  required,
  rows = 4,
  className = '',
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-text-2 uppercase tracking-wider">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        {...props}
        className={[
          'w-full bg-bg-3 border border-border rounded-sm text-text text-[15px]',
          'px-3.5 py-2.5 outline-none transition-colors duration-150 resize-y',
          'placeholder:text-text-3 focus:border-accent',
          'focus:outline-none focus:ring-2 focus:ring-accent/20',
          error ? 'border-red-400' : '',
          className,
        ].join(' ')}
      />
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </div>
  )
}
