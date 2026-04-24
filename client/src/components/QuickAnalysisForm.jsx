import React, { useState } from 'react'
import { Loader2, MapPin, Navigation, Sparkles, ArrowRight } from 'lucide-react'

const QuickAnalysisForm = ({ onAnalyze, isLoading }) => {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) return
    onAnalyze(origin.trim(), destination.trim())
  }

  return (
    <div className="glass-panel p-6 mb-8 border-2 border-blue-200/60 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-violet-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-blue-950 tracking-tight">
              AI Shipment Analysis
            </h2>
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">
              Powered by Gemini AI — Enter origin & destination
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-stretch gap-3">
          {/* Origin */}
          <div className="flex-1 relative group">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500 z-10 transition-transform group-focus-within:scale-110" />
            <input
              id="origin-input"
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Starting Location (e.g. Mumbai, MH)"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-100 rounded-xl text-sm font-semibold text-blue-900 placeholder:text-blue-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Arrow indicator */}
          <div className="hidden md:flex items-center justify-center px-1">
            <ArrowRight size={20} className="text-blue-300" />
          </div>

          {/* Destination */}
          <div className="flex-1 relative group">
            <Navigation size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 z-10 transition-transform group-focus-within:scale-110" />
            <input
              id="destination-input"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destination (e.g. Delhi, DL)"
              disabled={isLoading}
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-blue-100 rounded-xl text-sm font-semibold text-blue-900 placeholder:text-blue-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Submit */}
          <button
            id="analyze-shipment-btn"
            type="submit"
            disabled={isLoading || !origin.trim() || !destination.trim()}
            className="px-7 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-black text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[180px]"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Analyze Shipment</span>
              </>
            )}
          </button>
        </form>

        {/* Loading progress bar */}
        {isLoading && (
          <div className="mt-4">
            <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-blue-500 rounded-full animate-pulse" style={{ width: '100%', animation: 'loading-bar 2s ease-in-out infinite' }} />
            </div>
            <p className="text-[11px] font-bold text-blue-400 mt-2 text-center uppercase tracking-widest animate-pulse">
              🧠 Gemini AI is computing route analysis, risk factors, and recommendations...
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

export default QuickAnalysisForm
