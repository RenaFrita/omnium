import MarketTypeahead from './components/MarketTypeahead'

export default async function Home() {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'meta',
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch Hyperliquid markets')
  }

  const { universe } = await res.json()

  return (
    <main style={{ padding: '2rem' }}>
      <h1>Hyperliquid Perpetual Markets</h1>
      <MarketTypeahead markets={universe} />
    </main>
  )
}
