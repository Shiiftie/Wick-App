import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { TrendingUp, TrendingDown, Zap, X } from 'lucide-react'

const ASSETS = {
  forex: [
    { symbol: 'FX:EURUSD', label: 'EUR/USD', pip: 0.0001 },
    { symbol: 'FX:GBPUSD', label: 'GBP/USD', pip: 0.0001 },
    { symbol: 'FX:USDJPY', label: 'USD/JPY', pip: 0.01 },
    { symbol: 'FX:AUDUSD', label: 'AUD/USD', pip: 0.0001 },
    { symbol: 'FX:USDCAD', label: 'USD/CAD', pip: 0.0001 },
    { symbol: 'FX:USDCHF', label: 'USD/CHF', pip: 0.0001 },
  ],
  stocks: [
    { symbol: 'NASDAQ:AAPL',   label: 'AAPL', pip: 0.01 },
    { symbol: 'NASDAQ:TSLA',   label: 'TSLA', pip: 0.01 },
    { symbol: 'NASDAQ:NVDA',   label: 'NVDA', pip: 0.01 },
    { symbol: 'CME_MINI:ES1!', label: 'ES',   pip: 0.25 },
    { symbol: 'CME_MINI:NQ1!', label: 'NQ',   pip: 0.25 },
    { symbol: 'AMEX:SPY',      label: 'SPY',  pip: 0.01 },
  ],
  crypto: [
    { symbol: 'BINANCE:BTCUSDT', label: 'BTC/USD', pip: 1 },
    { symbol: 'BINANCE:ETHUSDT', label: 'ETH/USD', pip: 0.01 },
    { symbol: 'BINANCE:SOLUSDT', label: 'SOL/USD', pip: 0.01 },
    { symbol: 'BINANCE:XRPUSDT', label: 'XRP/USD', pip: 0.0001 },
  ],
}

const BASE_PRICES = {
  'FX:EURUSD': 1.0842, 'FX:GBPUSD': 1.2734, 'FX:USDJPY': 149.82,
  'FX:AUDUSD': 0.6521, 'FX:USDCAD': 1.3612, 'FX:USDCHF': 0.9034,
  'NASDAQ:AAPL': 213.45, 'NASDAQ:TSLA': 248.10, 'NASDAQ:NVDA': 131.20,
  'CME_MINI:ES1!': 5428.50, 'CME_MINI:NQ1!': 19234.25, 'AMEX:SPY': 542.80,
  'BINANCE:BTCUSDT': 68420, 'BINANCE:ETHUSDT': 3520,
  'BINANCE:SOLUSDT': 172.40, 'BINANCE:XRPUSDT': 0.5821,
}

const BALANCE_OPTIONS = [10000, 25000, 50000, 100000]

function useLivePrice(symbol) {
  const [price, setPrice] = useState(BASE_PRICES[symbol] || 100)
  const ref = useRef(BASE_PRICES[symbol] || 100)
  useEffect(() => {
    const base = BASE_PRICES[symbol] || 100
    ref.current = base
    setPrice(base)
    const vol = base > 10000 ? 0.0003 : base > 100 ? 0.0002 : base > 1 ? 0.0001 : 0.00006
    const iv = setInterval(() => {
      ref.current = Math.max(ref.current + ref.current * vol * (Math.random() - 0.499), 0.0001)
      const d = base > 1000 ? 2 : base > 10 ? 2 : base > 1 ? 4 : 5
      setPrice(parseFloat(ref.current.toFixed(d)))
    }, 600)
    return () => clearInterval(iv)
  }, [symbol])
  return price
}

function TradingViewChart({ symbol }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const s = document.createElement('script')
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    s.async = true
    s.innerHTML = JSON.stringify({
      symbol, interval: '5', timezone: 'Etc/UTC',
      theme: 'dark', style: '1', locale: 'en',
      backgroundColor: '#080808',
      gridColor: 'rgba(255,255,255,0.03)',
      width: '100%', height: '100%',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: true,
      save_image: false,
      studies: ['STD;RSI', 'STD;MACD'],
    })
    ref.current.appendChild(s)
  }, [symbol])
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

function PnlOverlay({ positions, price, decimals, chartHeight }) {
  const priceHistory = useRef([price])
  const [minPrice, setMinPrice] = useState(price * 0.998)
  const [maxPrice, setMaxPrice] = useState(price * 1.002)

  useEffect(() => {
    priceHistory.current.push(price)
    if (priceHistory.current.length > 300) priceHistory.current.shift()
    const h = priceHistory.current
    setMinPrice(Math.min(...h) * 0.9995)
    setMaxPrice(Math.max(...h) * 1.0005)
  }, [price])

  if (positions.length === 0) return null

  const visibleH = chartHeight * 0.62
  const range = maxPrice - minPrice
  const toY = (p) => range === 0 ? visibleH / 2 : visibleH - ((p - minPrice) / range) * visibleH
  const clamp = (y) => Math.max(20, Math.min(visibleH - 20, y))
  const currentY = clamp(toY(price))

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
      {positions.map((pos) => {
        const diff = pos.direction === 'long' ? price - pos.entry : pos.entry - price
        const pnl = (diff / pos.entry) * pos.size * 1000
        const profit = pnl >= 0
        const color = profit ? '#00ff88' : '#ff4466'
        const entryY = clamp(toY(pos.entry))

        return (
          <div key={pos.id}>
            {/* Entry dashed line */}
            <div style={{ position: 'absolute', top: `${entryY}px`, left: 0, right: 0, height: '1px', background: `repeating-linear-gradient(90deg, rgba(232,200,74,0.6) 0px, rgba(232,200,74,0.6) 6px, transparent 6px, transparent 12px)` }} />
            <div style={{ position: 'absolute', top: `${entryY - 11}px`, left: '10px', background: 'rgba(232,200,74,0.9)', color: '#000', fontSize: '9px', fontWeight: '800', padding: '2px 7px', borderRadius: '3px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
              {pos.direction.toUpperCase()} @ {pos.entry.toFixed(decimals)}
            </div>

            {/* Current price tracking line */}
            <motion.div
              animate={{ top: `${currentY}px` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 8px, transparent 8px, transparent 14px)`, boxShadow: `0 0 8px ${color}50` }}
            />

            {/* P&L label tracking with price */}
            <motion.div
              animate={{ top: `${currentY - 16}px` }}
              transition={{ type: 'spring', stiffness: 100, damping: 18 }}
              style={{ position: 'absolute', right: '72px', background: profit ? 'rgba(0,15,8,0.95)' : 'rgba(15,0,5,0.95)', border: `1px solid ${color}`, color, fontSize: '14px', fontWeight: '900', padding: '3px 14px', borderRadius: '5px', fontFamily: 'monospace', whiteSpace: 'nowrap', boxShadow: `0 0 14px ${color}35`, letterSpacing: '0.5px' }}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export default function SimulatorPage({ user }) {
  const [startingBalance, setStartingBalance] = useState(null)
  const [balance, setBalance] = useState(10000)
  const [category, setCategory] = useState('stocks')
  const [asset, setAsset] = useState(ASSETS.stocks[0])
  const [direction, setDirection] = useState('long')
  const [size, setSize] = useState('1000')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [positions, setPositions] = useState([])
  const [history, setHistory] = useState([])
  const [loggedIds, setLoggedIds] = useState(new Set())
  const [flash, setFlash] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const chartRef = useRef(null)
  const [chartHeight, setChartHeight] = useState(600)

  const price = useLivePrice(asset.symbol)
  const prevPrice = useRef(price)
  const [priceDir, setPriceDir] = useState(null)

  useEffect(() => {
    if (price > prevPrice.current) setPriceDir('up')
    else if (price < prevPrice.current) setPriceDir('down')
    prevPrice.current = price
  }, [price])

  useEffect(() => {
    if (!chartRef.current) return
    const ro = new ResizeObserver(entries => {
      for (let e of entries) setChartHeight(e.contentRect.height)
    })
    ro.observe(chartRef.current)
    return () => ro.disconnect()
  }, [])

  const decimals = asset.pip < 0.001 ? 5 : asset.pip < 0.1 ? 4 : 2
  const openPnl = positions.reduce((sum, p) => {
    const diff = p.direction === 'long' ? price - p.entry : p.entry - price
    return sum + (diff / p.entry) * p.size * 1000
  }, 0)

  const handleExecute = () => {
    if (!size || parseFloat(size) <= 0) return
    setPositions(prev => [...prev, { id: Date.now(), asset, direction, entry: price, size: parseFloat(size), sl: sl ? parseFloat(sl) : null, tp: tp ? parseFloat(tp) : null, openedAt: new Date() }])
    setSl(''); setTp('')
  }

  const handleClose = useCallback((id) => {
    const pos = positions.find(p => p.id === id)
    if (!pos) return
    const diff = pos.direction === 'long' ? price - pos.entry : pos.entry - price
    const pnl = (diff / pos.entry) * pos.size * 1000
    setFlash(pnl >= 0 ? 'profit' : 'loss')
    setTimeout(() => setFlash(null), 500)
    setBalance(b => b + pnl)
    setHistory(h => [{ ...pos, closePrice: price, pnl, closedAt: new Date() }, ...h])
    setPositions(p => p.filter(x => x.id !== id))
  }, [positions, price])

  const handleLog = async (trade) => {
    if (loggedIds.has(trade.id)) return
    const outcome = trade.pnl >= 0 ? 'win' : 'loss'
    await supabase.from('sessions').insert({ user_id: user.id, date: new Date().toISOString().split('T')[0], outcome, pnl: parseFloat(trade.pnl.toFixed(2)), analysis: `Demo — ${trade.asset.label} ${trade.direction.toUpperCase()} ${trade.entry.toFixed(decimals)} → ${trade.closePrice?.toFixed(decimals)}`, emotions: 'Demo', bias: trade.direction === 'long' ? 'Bullish' : 'Bearish' })
    await supabase.rpc('increment_xp', { user_id_input: user.id, xp_amount: trade.pnl >= 0 ? 100 : 50 })
    setLoggedIds(s => new Set([...s, trade.id]))
  }

  const inputStyle = { padding: '6px 10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#e0e0e0', fontSize: '13px', fontWeight: '700', outline: 'none', fontFamily: 'monospace', width: '90px' }

  // ── BALANCE PICKER ─────────────────────────────────────────────
  if (!startingBalance) {
    return (
      <div style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: '520px', padding: '0 24px' }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', margin: '0 auto 24px', boxShadow: '0 0 12px #00ff88' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '8px' }}>Paper Trading Simulator</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px', lineHeight: 1.6 }}>Choose your starting balance. Practice with real market data, zero real risk.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {BALANCE_OPTIONS.map(b => (
              <motion.button key={b} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setStartingBalance(b); setBalance(b) }}
                style={{ padding: '28px', borderRadius: '14px', border: '1px solid rgba(232,200,74,0.2)', background: 'rgba(232,200,74,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8c84a'; e.currentTarget.style.background = 'rgba(232,200,74,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(232,200,74,0.2)'; e.currentTarget.style.background = 'rgba(232,200,74,0.04)' }}>
                <span style={{ fontSize: '28px', fontWeight: '900', color: '#e8c84a', letterSpacing: '-1px' }}>${(b / 1000).toFixed(0)}K</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px' }}>STARTING BALANCE</span>
              </motion.button>
            ))}
          </div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.5px' }}>PAPER TRADING ONLY — NOT FINANCIAL ADVICE</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)', overflow: 'hidden', background: '#080808' }}>

      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none', background: flash === 'profit' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)' }} />
        )}
      </AnimatePresence>

      {/* ── ROW 1: Balance + Stats bar ── */}
      <div style={{ height: '40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', flexShrink: 0, background: '#0d0d0d' }}>
        <div style={{ display: 'flex', height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {BALANCE_OPTIONS.map(b => (
            <button key={b} onClick={() => { setStartingBalance(b); setBalance(b); setPositions([]); setHistory([]) }}
              style={{ padding: '0 16px', height: '100%', background: startingBalance === b ? 'rgba(232,200,74,0.1)' : 'transparent', border: 'none', borderBottom: startingBalance === b ? '2px solid #e8c84a' : '2px solid transparent', color: startingBalance === b ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
              ${(b / 1000).toFixed(0)}K
            </button>
          ))}
        </div>
        {[
          { label: 'BALANCE', value: `$${balance.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#e8c84a' },
          { label: 'OPEN P&L', value: `${openPnl >= 0 ? '+' : ''}$${openPnl.toFixed(2)}`, color: openPnl >= 0 ? '#00ff88' : '#ff4466' },
          { label: 'EQUITY', value: `$${(balance + openPnl).toFixed(2)}`, color: '#e0e0e0' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 18px', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>{s.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: s.color }}>{s.value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 18px', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{asset.label}</span>
          <motion.span key={price} animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e0e0e0' }} transition={{ duration: 0.2 }} style={{ fontSize: '14px', fontWeight: '800' }}>{price.toFixed(decimals)}</motion.span>
          {priceDir === 'up' ? <TrendingUp size={11} color="#00ff88" /> : priceDir === 'down' ? <TrendingDown size={11} color="#ff4466" /> : null}
        </div>
        <button onClick={() => setShowHistory(!showHistory)} style={{ marginLeft: 'auto', padding: '0 16px', height: '100%', background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', color: showHistory ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>
          HISTORY {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* ── ROW 2: Asset selector + Order bar (horizontal, full width) ── */}
      <div style={{ height: '48px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0', flexShrink: 0, background: '#0a0a0a', overflowX: 'auto' }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {Object.keys(ASSETS).map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setAsset(ASSETS[cat][0]) }}
              style={{ padding: '0 14px', height: '100%', background: 'transparent', border: 'none', borderBottom: category === cat ? '2px solid #e8c84a' : '2px solid transparent', color: category === cat ? '#e8c84a' : 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}>
              {cat === 'stocks' ? 'Equities' : cat === 'forex' ? 'Forex' : 'Crypto'}
            </button>
          ))}
        </div>

        {/* Asset pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%', flexShrink: 0 }}>
          {ASSETS[category].map(a => (
            <button key={a.symbol} onClick={() => setAsset(a)}
              style={{ padding: '5px 12px', borderRadius: '6px', border: `1px solid ${asset.symbol === a.symbol ? '#e8c84a' : 'rgba(255,255,255,0.08)'}`, background: asset.symbol === a.symbol ? 'rgba(232,200,74,0.12)' : 'transparent', color: asset.symbol === a.symbol ? '#e8c84a' : 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {a.label}
            </button>
          ))}
        </div>

        {/* Order controls — horizontal */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 14px', flex: 1 }}>
          {/* Long / Short */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['long', 'short'].map(d => (
              <motion.button key={d} whileTap={{ scale: 0.96 }} onClick={() => setDirection(d)}
                style={{ padding: '6px 14px', borderRadius: '6px', border: `1px solid ${direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.08)'}`, background: direction === d ? (d === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)') : 'transparent', color: direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {d === 'long' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {d.toUpperCase()}
              </motion.button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.06)' }} />

          {/* Size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', whiteSpace: 'nowrap' }}>SIZE $</span>
            <input type="number" value={size} onChange={e => setSize(e.target.value)} style={inputStyle} />
          </div>

          {/* SL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '8px', color: '#ff6680', letterSpacing: '1px' }}>SL</span>
            <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="—" style={{ ...inputStyle, border: '1px solid rgba(255,68,102,0.2)', color: '#ff6680', background: 'rgba(255,68,102,0.04)', width: '80px' }} />
          </div>

          {/* TP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '8px', color: '#00cc6a', letterSpacing: '1px' }}>TP</span>
            <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="—" style={{ ...inputStyle, border: '1px solid rgba(0,255,136,0.2)', color: '#00cc6a', background: 'rgba(0,255,136,0.04)', width: '80px' }} />
          </div>

          {/* Execute */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleExecute}
            style={{ padding: '7px 20px', borderRadius: '7px', border: 'none', background: direction === 'long' ? 'linear-gradient(135deg, #009944, #00ff88)' : 'linear-gradient(135deg, #aa1133, #ff4466)', color: '#000', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
            <Zap size={12} />{direction === 'long' ? 'BUY LONG' : 'SELL SHORT'}
          </motion.button>

          {/* Open positions inline */}
          {positions.length > 0 && (
            <>
              <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>OPEN</span>
                {positions.map(pos => {
                  const diff = pos.direction === 'long' ? price - pos.entry : pos.entry - price
                  const pnl = (diff / pos.entry) * pos.size * 1000
                  const profit = pnl >= 0
                  return (
                    <motion.div key={pos.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: profit ? 'rgba(0,255,136,0.06)' : 'rgba(255,68,102,0.06)', border: `1px solid ${profit ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)'}` }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: profit ? '#00ff88' : '#ff4466' }}>{pos.asset.label}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{pos.direction}</span>
                      <span style={{ fontSize: '11px', fontWeight: '800', color: profit ? '#00ff88' : '#ff4466' }}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleClose(pos.id)}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,68,102,0.6)', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}>
                        <X size={11} />
                      </motion.button>
                    </motion.div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── ROW 3: Full width chart ── */}
      <div ref={chartRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        <TradingViewChart symbol={asset.symbol} />
        <PnlOverlay positions={positions} price={price} decimals={decimals} chartHeight={chartHeight} />
      </div>

      {/* ── ROW 4: History (collapsible) ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: '150px', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '5px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <span style={{ fontSize: '8px', fontWeight: '700', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>TRADE HISTORY</span>
                {history.length > 0 && (
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                    Net: <span style={{ color: history.reduce((s, t) => s + t.pnl, 0) >= 0 ? '#00ff88' : '#ff4466', fontWeight: '700' }}>
                      {history.reduce((s, t) => s + t.pnl, 0) >= 0 ? '+' : ''}${history.reduce((s, t) => s + t.pnl, 0).toFixed(2)}
                    </span>
                  </span>
                )}
              </div>
              {history.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '11px' }}>No closed trades yet.</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr>{['ASSET','DIR','ENTRY','EXIT','P&L','TIME',''].map(h => <th key={h} style={{ padding: '4px 14px', textAlign: 'left', fontSize: '8px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px', fontWeight: '700', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {history.map((t, i) => (
                        <tr key={i}>
                          <td style={{ padding: '5px 14px', color: '#c0c0c0', fontWeight: '700' }}>{t.asset.label}</td>
                          <td style={{ padding: '5px 14px' }}><span style={{ fontSize: '9px', fontWeight: '800', padding: '1px 6px', borderRadius: '3px', background: t.direction === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)', color: t.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px' }}>{t.direction.toUpperCase()}</span></td>
                          <td style={{ padding: '5px 14px', color: 'rgba(255,255,255,0.3)' }}>{t.entry.toFixed(t.asset.pip < 0.001 ? 5 : 2)}</td>
                          <td style={{ padding: '5px 14px', color: 'rgba(255,255,255,0.3)' }}>{t.closePrice?.toFixed(t.asset.pip < 0.001 ? 5 : 2)}</td>
                          <td style={{ padding: '5px 14px', fontWeight: '800', color: t.pnl >= 0 ? '#00ff88' : '#ff4466' }}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</td>
                          <td style={{ padding: '5px 14px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{t.closedAt?.toLocaleTimeString()}</td>
                          <td style={{ padding: '5px 14px' }}>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleLog(t)} disabled={loggedIds.has(t.id)}
                              style={{ padding: '2px 10px', borderRadius: '4px', background: loggedIds.has(t.id) ? 'rgba(0,255,136,0.08)' : 'rgba(232,200,74,0.08)', border: `1px solid ${loggedIds.has(t.id) ? 'rgba(0,255,136,0.2)' : 'rgba(232,200,74,0.2)'}`, color: loggedIds.has(t.id) ? '#00ff88' : '#e8c84a', fontSize: '9px', fontWeight: '700', cursor: loggedIds.has(t.id) ? 'default' : 'pointer', letterSpacing: '1px' }}>
                              {loggedIds.has(t.id) ? '✓ LOGGED' : 'LOG'}
                            </motion.button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}