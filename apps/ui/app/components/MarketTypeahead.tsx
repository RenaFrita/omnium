'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  markets: { name: string }[]
}

export default function MarketTypeahead({ markets }: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  // Filtra markets
  const filtered = useMemo(() => {
    if (!query) return []
    return markets
      .filter(({ name }) => name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 20)
  }, [query, markets])

  // Fecha dropdown se clicar fora
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

    if (e.key === 'ArrowDown') {
      setHighlightIndex((prev) => (prev + 1 >= filtered.length ? 0 : prev + 1))
    }

    if (e.key === 'ArrowUp') {
      setHighlightIndex((prev) =>
        prev - 1 < 0 ? filtered.length - 1 : prev - 1
      )
    }

    if (e.key === 'Enter') {
      handleSelect(filtered[highlightIndex])
    }
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search market..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          setHighlightIndex(0)
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-white outline-none focus:border-blue-500"
      />

      {isOpen && filtered.length > 0 && (
        <ul className="absolute mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 shadow-xl">
          {filtered.map((market, index) => (
            <li
              key={market.name}
              onClick={() => handleSelect(market)}
              className={`cursor-pointer px-4 py-2 text-sm transition ${
                index === highlightIndex
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {market.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
