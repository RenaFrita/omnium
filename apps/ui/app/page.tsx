import { PerpMeta } from './types'
import MarketTypeahead from './components/MarketTypeahead'

export default async function Home() {
  const res = await fetch('https://api.hyperliquid.xyz/info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'allPerpMetas',
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error('Failed to fetch Hyperliquid markets')
  }

  const universe = (await res.json()).flatMap(
    ({ universe }: { universe: PerpMeta[] }) => universe
  )

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="mb-10 text-center">
        <p className="mb-2 font-mono text-xs tracking-[0.3em] text-teal-500 uppercase">
          Hyperliquid
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Perpetual Markets
        </h1>
      </div>
      <MarketTypeahead markets={universe} />
    </main>
  )
}
