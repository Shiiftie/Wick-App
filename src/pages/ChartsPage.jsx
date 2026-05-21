import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const SYMBOLS = [
  { label: 'Gold', value: 'OANDA:XAUUSD' },
  { label: 'EUR/USD', value: 'FX:EURUSD' },
  { label: 'GBP/USD', value: 'FX:GBPUSD' },
  { label: 'NAS100', value: 'NASDAQ:NDX' },
  { label: 'S&P 500', value: 'SP:SPX' },
  { label: 'BTC/USD', value: 'BINANCE:BTCUSDT' },
  { label: 'Oil', value: 'TVC:USOIL' },
  { label: 'DXY', value: 'TVC:DXY' },
]

const INTERVALS = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
]

export default function ChartsPage() {
  const [symbol, setSymbol] = useState('OANDA:XAUUSD')
  const [interval, setInterval] = useState('60')
  const containerRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Clear previous widget
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'America/New_York',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(8, 8, 10, 1)',
      gridColor: 'rgba(255, 209, 102, 0.03)',
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      hide_volume: false,
      support_host: 'https://www.tradingview.com',
      container_id: 'tradingview_widget',
      studies: ['MASimple@tv-basicstudies'],
    })

    const container = document.createElement('div')
    container.className = 'tradingview-widget-container__widget'
    container.style.height = '100%'
    container.style.width = '100%'

    containerRef.current.appendChild(container)
    containerRef.current.appendChild(script)

    widgetRef.current = script
  }, [symbol, interval])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '2px' }}>Live Charts</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Powered by TradingView</p>
        </div>

        {/* Symbol Selector */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {SYMBOLS.map((s) => (
            <motion.button key={s.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setSymbol(s.value)}
              style={{ padding: '6px 14px', borderRadius: '8px', border: symbol === s.value ? '1px solid var(--gold)' : '1px solid var(--border)', background: symbol === s.value ? 'rgba(232,200,74,0.12)' : 'rgba(13,13,13,0.8)', color: symbol === s.value ? 'var(--gold)' : 'var(--text-dim)', fontSize: '13px', fontWeight: symbol === s.value ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s' }}>
              {s.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Interval Selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {INTERVALS.map((i) => (
          <motion.button key={i.value} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setInterval(i.value)}
            style={{ padding: '5px 12px', borderRadius: '6px', border: interval === i.value ? '1px solid var(--gold)' : '1px solid var(--border)', background: interval === i.value ? 'rgba(232,200,74,0.12)' : 'rgba(13,13,13,0.8)', color: interval === i.value ? 'var(--gold)' : 'var(--text-dim)', fontSize: '12px', fontWeight: interval === i.value ? '700' : '400', cursor: 'pointer', transition: 'all 0.15s' }}>
            {i.label}
          </motion.button>
        ))}
      </div>

      {/* Chart */}
      <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div
          ref={containerRef}
          className="tradingview-widget-container"
          style={{ height: '100%', width: '100%' }}
        />
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', marginTop: '8px' }}>
        Charts powered by <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>TradingView</a>
      </p>
    </motion.div>
  )
}