export default function SearchInput({ value, onChange, placeholder = 'Поиск...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base pointer-events-none">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-bg-3 border border-border rounded-sm text-text text-[15px]
          pl-10 pr-3.5 py-2.5 outline-none transition-colors duration-150
          placeholder:text-text-3 focus:border-accent
          focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  )
}
