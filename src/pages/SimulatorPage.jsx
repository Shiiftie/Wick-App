import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import { TrendingUp, TrendingDown, Zap, X, BarChart2, Layers, Shield, Radio } from 'lucide-react'

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

const FEATURES = [
  {
    icon: BarChart2,
    title: 'Charting & Analysis',
    desc: 'Integrated TradingView charts for advanced technical analysis, drawing tools, and market indicators.',
    color: '#e8c84a',
  },
  {
    icon: Layers,
    title: 'Execution Tools',
    desc: 'Precise DOM (Depth of Market), order cards, and Drag-and-Drop Brackets for quickly managing stop-losses and profit targets.',
    color: '#00ff88',
  },
  {
    icon: Shield,
    title: 'Built-in Risk Management',
    desc: 'Automated tools that help you strictly adhere to trading rules, such as maximum loss limits, daily limits, and drawdown locks.',
    color: '#7c9eff',
  },
  {
    icon: Radio,
    title: 'Data Feed',
    desc: 'A direct, low-latency 50ms CME (Chicago Mercantile Exchange) data feed for real-time price action.',
    color: '#ff9f44',
  },
]

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

  const price = useLivePrice(asset.symbol)
  const prevPrice = useRef(price)
  const [priceDir, setPriceDir] = useState(null)

  useEffect(() => {
    if (price > prevPrice.current) setPriceDir('up')
    else if (price < prevPrice.current) setPriceDir('down')
    prevPrice.current = price
  }, [price])

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

  // ── BALANCE PICKER ─────────────────────────────────────────────
  if (!startingBalance) {
    return (
      <div style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '860px', padding: '0 24px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '16px' }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#00ff88', letterSpacing: '2px', fontFamily: 'monospace' }}>SIMULATOR LIVE</span>
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '10px' }}>Paper Trading Simulator</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: 1.6 }}>Practice with real market data. Build discipline. Zero real risk.</p>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '18px 16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${f.color}15`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#e0e0e0', marginBottom: '6px', letterSpacing: '-0.2px' }}>{f.title}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Balance selection */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: '16px', fontFamily: 'monospace' }}>SELECT YOUR STARTING BALANCE</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {BALANCE_OPTIONS.map(b => (
                <motion.button key={b} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setStartingBalance(b); setBalance(b) }}
                  style={{ padding: '20px', borderRadius: '12px', border: '1px solid rgba(232,200,74,0.2)', background: 'rgba(232,200,74,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontFamily: 'monospace' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8c84a'; e.currentTarget.style.background = 'rgba(232,200,74,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(232,200,74,0.2)'; e.currentTarget.style.background = 'rgba(232,200,74,0.04)' }}>
                  <span style={{ fontSize: '24px', fontWeight: '900', color: '#e8c84a', letterSpacing: '-1px' }}>${(b / 1000).toFixed(0)}K</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '1px' }}>PAPER BALANCE</span>
                </motion.button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.5px', fontFamily: 'monospace' }}>PAPER TRADING ONLY — NOT FINANCIAL ADVICE</p>
        </motion.div>
      </div>
    )
  }

  // ── MAIN SIMULATOR ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)', overflow: 'hidden', background: '#080808' }}>

      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none', background: flash === 'profit' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)' }} />
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
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
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{asset.label}</span>
          <motion.span key={price} animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e0e0e0' }} transition={{ duration: 0.2 }} style={{ fontSize: '14px', fontWeight: '800' }}>{price.toFixed(decimals)}</motion.span>
          {priceDir === 'up' ? <TrendingUp size={11} color="#00ff88" /> : priceDir === 'down' ? <TrendingDown size={11} color="#ff4466" /> : null}
        </div>

        {/* Feature badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', marginLeft: 'auto' }}>
          {[
            { icon: Radio, label: '50ms CME Feed', color: '#ff9f44' },
            { icon: Shield, label: 'Risk Mgmt', color: '#7c9eff' },
            { icon: Layers, label: 'DOM', color: '#00ff88' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '5px', background: `${color}10`, border: `1px solid ${color}25` }}>
              <Icon size={10} color={color} />
              <span style={{ fontSize: '9px', color, fontWeight: '600', letterSpacing: '0.5px' }}>{label}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setShowHistory(!showHistory)}
          style={{ padding: '0 16px', height: '100%', background: 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.06)', color: showHistory ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>
          HISTORY {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* ── ASSET SELECTOR BAR ── */}
      <div style={{ height: '44px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', flexShrink: 0, background: '#0a0a0a', overflowX: 'auto' }}>
        <div style={{ display: 'flex', height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {Object.keys(ASSETS).map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setAsset(ASSETS[cat][0]) }}
              style={{ padding: '0 16px', height: '100%', background: 'transparent', border: 'none', borderBottom: category === cat ? '2px solid #e8c84a' : '2px solid transparent', color: category === cat ? '#e8c84a' : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}>
              {cat === 'stocks' ? 'Equities' : cat === 'forex' ? 'Forex' : 'Crypto'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px' }}>
          {ASSETS[category].map(a => (
            <button key={a.symbol} onClick={() => setAsset(a)}
              style={{ padding: '5px 14px', borderRadius: '6px', border: `1px solid ${asset.symbol === a.symbol ? '#e8c84a' : 'rgba(255,255,255,0.08)'}`, background: asset.symbol === a.symbol ? 'rgba(232,200,74,0.12)' : 'transparent', color: asset.symbol === a.symbol ? '#e8c84a' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CHART + RIGHT SIDEBAR ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 200px', overflow: 'hidden', minHeight: 0 }}>

        {/* Full width chart — no overlay */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <TradingViewChart symbol={asset.symbol} />
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Order Entry */}
          <div style={{ padding: '14px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '10px' }}>ORDER ENTRY</p>

            {/* Long / Short */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              {['long', 'short'].map(d => (
                <motion.button key={d} whileTap={{ scale: 0.96 }} onClick={() => setDirection(d)}
                  style={{ padding: '10px 0', borderRadius: '8px', border: `1px solid ${direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.08)'}`, background: direction === d ? (d === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)') : 'rgba(255,255,255,0.02)', color: direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }}>
                  {d === 'long' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {d.toUpperCase()}
                </motion.button>
              ))}
            </div>

            {/* Size */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', display: 'block', marginBottom: '5px' }}>POSITION SIZE ($)</label>
              <input type="number" value={size} onChange={e => setSize(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e0e0e0', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>

            {/* SL / TP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '8px', color: '#ff6680', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>STOP LOSS</label>
                <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="—"
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(255,68,102,0.04)', border: '1px solid rgba(255,68,102,0.15)', borderRadius: '6px', color: '#ff6680', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '8px', color: '#00cc6a', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>TAKE PROFIT</label>
                <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="—"
                  style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '6px', color: '#00cc6a', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
            </div>

            {/* Market price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>MARKET</span>
              <motion.span key={price} animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e8c84a' }} style={{ fontSize: '14px', fontWeight: '800' }}>
                {price.toFixed(decimals)}
              </motion.span>
            </div>

            {/* Execute */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleExecute}
              style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: direction === 'long' ? 'linear-gradient(135deg, #009944, #00ff88)' : 'linear-gradient(135deg, #aa1133, #ff4466)', color: '#000', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Zap size={13} />
              {direction === 'long' ? 'BUY LONG' : 'SELL SHORT'}
            </motion.button>
          </div>

          {/* Open Positions */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            <p style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '10px' }}>
              OPEN POSITIONS {positions.length > 0 && <span style={{ color: '#e8c84a' }}>({positions.length})</span>}
            </p>

            {positions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.12)', fontSize: '11px', lineHeight: 1.7 }}>
                No open positions.<br />Execute a trade above.
              </div>
            ) : (
              <AnimatePresence>
                {positions.map(pos => {
                  const diff = pos.direction === 'long' ? price - pos.entry : pos.entry - price
                  const pnl = (diff / pos.entry) * pos.size * 1000
                  const profit = pnl >= 0
                  const color = profit ? '#00ff88' : '#ff4466'
                  return (
                    <motion.div key={pos.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }}
                      style={{ background: profit ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,102,0.04)', border: `1px solid ${profit ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)'}`, borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', background: pos.direction === 'long' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)', color: pos.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px' }}>
                            {pos.direction.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#d0d0d0' }}>{pos.asset.label}</span>
                        </div>
                        <motion.div animate={{ color }} style={{ fontSize: '13px', fontWeight: '900' }}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </motion.div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>ENTRY</div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#909090' }}>{pos.entry.toFixed(decimals)}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', marginBottom: '2px' }}>SIZE</div>
                          <div style={{ fontSize: '11px', fontWeight: '700', color: '#909090' }}>${pos.size.toLocaleString()}</div>
                        </div>
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleClose(pos.id)}
                        style={{ width: '100%', padding: '9px', borderRadius: '7px', border: '1px solid rgba(255,68,102,0.35)', background: 'rgba(255,68,102,0.1)', color: '#ff4466', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.2)'; e.currentTarget.style.borderColor = '#ff4466' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.35)' }}>
                        <X size={12} /> EXIT TRADE
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Feature pills at bottom */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <f.icon size={10} color={f.color} />
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.3 }}>{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HISTORY ── */}
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