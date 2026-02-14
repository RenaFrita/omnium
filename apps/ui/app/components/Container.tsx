'use client'

import { useWorker } from '../hooks/useWorker'
import { Chart } from './Chart'

interface Props {
  coin: string
}

export const Container = ({ coin }: Props) => {
  useWorker(coin)
  return (
    <ul style={{ display: 'flex', flexWrap: 'wrap', height: '100%' }}>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <Chart interval="1m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <Chart interval="5m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <Chart interval="15m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <Chart interval="30m" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <Chart interval="1h" />
      </li>
      <li style={{ flex: '1 1 50%', height: '50%' }}>
        <Chart interval="4h" />
      </li>
    </ul>
  )
}
