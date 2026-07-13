'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  markets: { name: string }[]
}

export default function MarketTypeahead({ markets }: Readonly<Props>) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!query) return []
    return markets
      .filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20)
  }, [query, markets])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!inputRef.current?.parentElement?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = ({ name }: { name: string }) => {
    setQuery('')
    setIsOpen(false)
    router.push(`/${name}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filtered.length) return
    if (e.key === 'ArrowDown')
      setHighlightIndex((p) => (p + 1 >= filtered.length ? 0 : p + 1))
    if (e.key === 'ArrowUp')
      setHighlightIndex((p) => (p - 1 < 0 ? filtered.length - 1 : p - 1))
    if (e.key === 'Enter') handleSelect(filtered[highlightIndex])
  }

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-teal-500 text-sm select-none">
          /
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search market\u2026"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setHighlightIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="
            w-full rounded-lg border border-zinc-800 bg-zinc-900
            pl-8 pr-4 py-3 font-mono text-sm text-white placeholder-zinc-600
            outline-none transition-all duration-200
            focus:border-teal-500 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.15)]
          "
        />
      </div>

      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl">
          {filtered.map((market, index) => (
            <li
              key={market.name}
              onMouseDown={() => handleSelect(market)}
              className={`flex items-center gap-3 cursor-pointer px-4 py-2.5 font-mono text-sm transition-colors ${
                index === highlightIndex
                  ? 'bg-teal-500/10 text-teal-400'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  index === highlightIndex ? 'bg-teal-400' : 'bg-zinc-700'
                }`}
              />
              {market.name}
            </li>
          ))}
        </ul>
      )}

      {isOpen && query && filtered.length === 0 && (
        <div className="absolute mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-600">
          No markets found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
