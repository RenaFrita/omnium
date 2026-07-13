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


