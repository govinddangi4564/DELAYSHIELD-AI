import React, { useState, useEffect, useRef } from 'react'
import { Loader2, MapPin, Navigation, Sparkles, ArrowRight } from 'lucide-react'

const LocationAutocomplete = ({ value, onChange, placeholder, icon: Icon, iconColor, disabled }) => {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Only search if user typed at least 3 characters
    if (value.length < 3) {
      setSuggestions([])
      return
    }

    // Don't search if the value perfectly matches one of the suggestions (meaning they just clicked it)
    if (suggestions.includes(value)) {
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&featuretype=city`, {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'DelayShield-AI-App'
          }
        })
        const data = await res.json()

        // Extract and clean city names (City, State, Country)
        const uniquePlaces = data.map(item => {
          const parts = item.display_name.split(',')
          return parts.slice(0, 3).map(p => p.trim()).join(', ')
        })

        const filteredSuggestions = [...new Set(uniquePlaces)].filter(Boolean)
        setSuggestions(filteredSuggestions)

        if (filteredSuggestions.length > 0) {
          setShowDropdown(true)
        }
      } catch (err) {
        console.error("Autocomplete error:", err)
      } finally {
        setLoading(false)
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="flex-1 relative group" ref={wrapperRef}>
      <Icon size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-transform group-focus-within:scale-110 ${iconColor}`} />
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          if (e.target.value.length >= 3) setShowDropdown(true)
        }}
        onFocus={() => {
          if (suggestions.length > 0) setShowDropdown(true)
        }}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full pl-10 pr-10 py-3 bg-white border-2 border-blue-100 rounded-xl text-sm font-semibold text-blue-900 placeholder:text-blue-300 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 size={16} className="animate-spin text-blue-400" />
        </div>
      )}

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-slate-100 shadow-xl rounded-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, idx) => (
            <div
              key={idx}
              onClick={() => {
                onChange(suggestion)
                setShowDropdown(false)
              }}
              className="px-4 py-3 text-sm font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 cursor-pointer transition-colors border-b border-slate-50 last:border-none"
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const QuickAnalysisForm = ({ onAnalyze, isLoading }) => {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) return
    onAnalyze(origin.trim(), destination.trim())
  }

  return (
    <div className="glass-panel p-6 mb-8 border-2 border-blue-200/60 relative">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-violet-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-gradient-to-tr from-emerald-400/10 to-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

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
          {/* Origin Autocomplete */}
          <LocationAutocomplete
            value={origin}
            onChange={setOrigin}
            placeholder="Starting Location (e.g. Mumbai, MH)"
            icon={MapPin}
            iconColor="text-emerald-500"
            disabled={isLoading}
          />

          {/* Arrow indicator */}
          <div className="hidden md:flex items-center justify-center px-1">
            <ArrowRight size={20} className="text-blue-300" />
          </div>

          {/* Destination Autocomplete */}
          <LocationAutocomplete
            value={destination}
            onChange={setDestination}
            placeholder="Destination (e.g. Delhi, DL)"
            icon={Navigation}
            iconColor="text-red-500"
            disabled={isLoading}
          />

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
