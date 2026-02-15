'use client'

import { useState } from 'react'
import { useWorker } from '../hooks/useWorker'
import { Chart } from './Chart'
import { Menu, Settings2, LayoutGrid, Rows3, Columns3, X } from 'lucide-react'
import { intervals } from '../constants'

interface Props {
  coin: string
}

type Layout = '1' | '2' | '3'

export const Container = ({ coin }: Props) => {
  useWorker(coin)

  // Estados de UI
  const [isOpen, setIsOpen] = useState(false)
  const [activeIntervals, setActiveIntervals] = useState<readonly string[]>(intervals)
  const [columns, setColumns] = useState<Layout>('2')

  const toggleInterval = (int: string) => {
    setActiveIntervals(prev => 
      prev.includes(int) ? prev.filter(i => i !== int) : [...prev, int]
    )
  }

  // Mapeamento de colunas Tailwind
  const gridConfig = {
    '1': 'grid-cols-1',
    '2': 'grid-cols-1 md:grid-cols-2',
    '3': 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  }

  return (
    // h-screen e flex-col garantem que a section ocupe 100% da altura da janela
    <section className="relative h-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      
      {/* Botão Hamburguer */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 right-4 z-50 p-2 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors shadow-xl"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar de Configurações */}
      <aside className={`
        fixed top-0 right-0 h-full w-72 bg-slate-900 border-l border-slate-800 z-40 p-6 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="mt-12 space-y-8">
          {/* Opções de Layout */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4 text-slate-400">
              <Settings2 size={16} /> LAYOUT
            </h3>
            <div className="flex gap-2">
              {[
                { id: '1', icon: Rows3 },
                { id: '2', icon: LayoutGrid },
                { id: '3', icon: Columns3 }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setColumns(item.id as Layout)}
                  className={`flex-1 p-2 rounded border transition-all ${
                    columns === item.id 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <item.icon size={20} className="mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Timeframes Toggle */}
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4 text-slate-400">
              <LayoutGrid size={16} /> TIMEFRAMES
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {intervals.map((int) => (
                <button
                  key={int}
                  onClick={() => toggleInterval(int)}
                  className={`p-2 text-xs font-bold rounded border transition-all ${
                    activeIntervals.includes(int)
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {int}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Grid de Gráficos Dinâmico */}
      {/* flex-1 e overflow-y-auto permitem que esta área cresça e tenha scroll próprio se necessário */}
      <main className="flex-1 p-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className={`grid gap-4 w-full h-full min-h-0 ${gridConfig[columns]}`}>
          {intervals.map((interval) => (
            <div 
              key={interval} 
              className={`
                bg-slate-900 rounded-lg border border-slate-800 overflow-hidden transition-all duration-300 flex flex-col
                ${activeIntervals.includes(interval) 
                  ? 'opacity-100 scale-100 min-h-[450px]' 
                  : 'hidden'}
              `}
            >
              {/* Header do Card - shrink-0 impede que o header diminua */}
              <div className="bg-slate-800/50 px-3 py-1.5 text-[10px] font-mono text-slate-400 border-b border-slate-800 flex justify-between items-center shrink-0">
                <span className="font-bold tracking-wider">{coin.toUpperCase()} / {interval}</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400">LIVE</span>
                </div>
              </div>

              {/* Área do Gráfico - flex-1 faz com que o gráfico ocupe todo o resto do card */}
              <div className="flex-1 w-full relative bg-slate-900/50">
                <Chart interval={interval} />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Overlay para fechar menu ao clicar fora */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Estilos inline para scrollbar opcional (opcional) */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </section>
  )
}