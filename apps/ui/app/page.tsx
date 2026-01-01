import { Dashboard } from './components/Dashboard'
import Signal from './components/Signal'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl mr-4">
              🚀
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">
                Omnium Trading System
              </h1>
              <p className="text-gray-400">
                Real-time order flow analysis & signal generation
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Live System
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Hyperliquid Connected
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              Multi-Factor Analysis
            </span>
          </div>
        </div>

        {/* Main Dashboard */}
        <Dashboard />
        
        {/* Signal Component */}
        <div className="mt-8">
          <Signal />
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-gray-500">
          <p className="text-sm">
            © 2024 Omnium Trading System • Built with Next.js & TypeScript
          </p>
        </div>
      </div>
    </div>
  )
}
