export const fmtK = (n: number | null | undefined) => {
  if (n == null) return '\u2014'
  const a = Math.abs(n)
  if (a >= 1e6) return (n / 1e6).toFixed(2) + 'M'
  if (a >= 1e3) return (n / 1e3).toFixed(1) + 'K'
  return n.toFixed(0)
}

export const fmt = (n: number | null | undefined, d = 2) =>
  n == null
    ? '\u2014'
    : Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      })

export const Tip = ({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { color?: string; name?: string; value: number }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1526] border border-slate-800 px-2.5 py-1.5 rounded text-[11px] font-mono shadow-lg">
      <div className="text-slate-500 mb-0.5">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#c8d6e8' }}>
          {p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}
