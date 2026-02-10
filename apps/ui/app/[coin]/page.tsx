import { CandleChart } from '../components/CandleChart'

interface PageProps {
  params: {
    coin: string
  }
}

export default async function CoinPage({ params }: PageProps) {
  const { coin } = await params 
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', height: '100%' }}>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="1m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="5m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="15m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="30m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="1h" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="4h" />
      </li>
    </ul>
  )
}