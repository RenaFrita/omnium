import { Container } from '../components/Container'

interface PageProps {
  params: {
    coin: string
  }
}

export default async function CoinPage({ params }: PageProps) {
  const { coin } = await params
  return <Container coin={coin.toLocaleUpperCase()} />
}
