import { CandleChart } from '../components/CandleChart'

interface PageProps {
  params: {
    coin: string
  }
}

// Exemplo de fetch para Hyperliquid /info endpoint
async function fetchHyperliquidSymbols() {
  const url = 'https://api.hyperliquid.xyz/info';
  
  const body = {
    type: 'meta', // retorna os ativos e mercados disponíveis
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Todos os mercados/perps disponíveis
    console.log('Hyperliquid symbols:', data);


  } catch (err) {
    console.error('Erro ao buscar Hyperliquid symbols:', err);
  }
}

// Executa

export default async function CoinPage({ params }: PageProps) {
  const { coin } = await params 
  fetchHyperliquidSymbols();

  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', height: '100%' }}>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <CandleChart coin={coin.toUpperCase()} interval="1m" />
      </li>
      {/* <li style={{ flex: '1 1 50%', height: '50%' }}>
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
      </li> */}
    </ul>
  )
}