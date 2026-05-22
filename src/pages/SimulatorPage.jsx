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
      backgroundColor: 'rgba(0,0,0,0)',
      gridColor: 'rgba(255,255,255,0.03)',
      width: '100%', height: '100%',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      save_image: false,
      studies: ['STD;RSI', 'STD;MACD'],
    })
    ref.current.appendChild(s)
  }, [symbol])
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

// Entry line overlay with P&L label
function EntryLines({ positions, price, decimals }) {
  if (positions.length === 0) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {positions.map((pos, i) => {
        const pnl = ((price - pos.entry) / pos.entry) * pos.size * (pos.direction === 'long' ? 1 : -1) * 1000
        const profit = pnl >= 0
        const color = profit ? '#00ff88' : '#ff4466'
        // Spread positions vertically so they don't overlap
        const topPct = 20 + i * 12

        return (
          <div key={pos.id} style={{ position: 'absolute', top: `${topPct}%`, left: 0, right: 0 }}>
            {/* Dashed line */}
            <div style={{
              position: 'absolute', left: 0, right: 0,
              height: '1px',
              background: `repeating-linear-gradient(90deg, ${color} 0px, ${color} 8px, transparent 8px, transparent 14px)`,
              opacity: 0.7,
            }} />
            {/* Entry price label - left */}
            <div style={{
              position: 'absolute', left: '12px',
              transform: 'translateY(-50%)',
              background: color, color: '#000',
              fontSize: '10px', fontWeight: '800',
              padding: '2px 7px', borderRadius: '3px',
              fontFamily: 'monospace', letterSpacing: '0.5px',
              whiteSpace: 'nowrap',
            }}>
              {pos.direction.toUpperCase()} @ {pos.entry.toFixed(decimals)}
            </div>
            {/* P&L label - right side, follows */}
            <motion.div
              key={pnl.toFixed(1)}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              style={{
                position: 'absolute', right: '60px',
                transform: 'translateY(-50%)',
                background: profit ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)',
                border: `1px solid ${color}`,
                color: color,
                fontSize: '12px', fontWeight: '900',
                padding: '3px 10px', borderRadius: '4px',
                fontFamily: 'monospace', letterSpacing: '0.5px',
                whiteSpace: 'nowrap',
                boxShadow: `0 0 10px ${color}40`,
              }}>
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
  const [showPanel, setShowPanel] = useState(true)
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

  const handleSelectBalance = (b) => { setStartingBalance(b); setBalance(b) }

  const handleExecute = () => {
    if (!size || parseFloat(size) <= 0) return
    setPositions(prev => [...prev, {
      id: Date.now(), asset, direction,
      entry: price, size: parseFloat(size),
      sl: sl ? parseFloat(sl) : null,
      tp: tp ? parseFloat(tp) : null,
      openedAt: new Date(),
    }])
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
    await supabase.from('sessions').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      outcome, pnl: parseFloat(trade.pnl.toFixed(2)),
      analysis: `Demo trade — ${trade.asset.label} ${trade.direction.toUpperCase()} from ${trade.entry.toFixed(decimals)} to ${trade.closePrice?.toFixed(decimals)}`,
      emotions: 'Demo', bias: trade.direction === 'long' ? 'Bullish' : 'Bearish',
    })
    await supabase.rpc('increment_xp', { user_id_input: user.id, xp_amount: outcome === 'win' ? 100 : 50 })
    setLoggedIds(s => new Set([...s, trade.id]))
  }

  // ── BALANCE PICKER ─────────────────────────────────────────────
  if (!startingBalance) {
    return (
      <div style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: '520px', padding: '0 24px' }}>
          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#00ff88', margin: '0 auto 24px', boxShadow: '0 0 12px #00ff88' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', letterSpacing: '-1px', marginBottom: '8px' }}>Paper Trading Simulator</h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', marginBottom: '40px', lineHeight: 1.6 }}>
            Choose your starting balance. Practice with real market data, zero real risk.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
            {BALANCE_OPTIONS.map(b => (
              <motion.button key={b} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleSelectBalance(b)}
                style={{ padding: '28px', borderRadius: '14px', border: '1px solid rgba(232,200,74,0.2)', background: 'rgba(232,200,74,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8c84a'; e.currentTarget.style.background = 'rgba(232,200,74,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(232,200,74,0.2)'; e.currentTarget.style.background = 'rgba(232,200,74,0.04)' }}
              >
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

  // ── MAIN SIMULATOR ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)', overflow: 'hidden', background: '#080808' }}>

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none', background: flash === 'profit' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)' }} />
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div style={{ height: '40px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', flexShrink: 0, background: '#0c0c0c' }}>
        {/* Balance selector */}
        <div style={{ display: 'flex', alignItems: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
          {BALANCE_OPTIONS.map(b => (
            <button key={b} onClick={() => { setStartingBalance(b); setBalance(b); setPositions([]); setHistory([]) }}
              style={{ padding: '0 14px', height: '100%', background: startingBalance === b ? 'rgba(232,200,74,0.1)' : 'transparent', border: 'none', borderBottom: startingBalance === b ? '2px solid #e8c84a' : '2px solid transparent', color: startingBalance === b ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', letterSpacing: '0.5px', transition: 'all 0.15s' }}>
              ${(b / 1000).toFixed(0)}K
            </button>
          ))}
        </div>

        {/* Stats */}
        {[
          { label: 'BALANCE', value: `$${balance.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#e8c84a' },
          { label: 'OPEN P&L', value: `${openPnl >= 0 ? '+' : ''}$${openPnl.toFixed(2)}`, color: openPnl >= 0 ? '#00ff88' : '#ff4466' },
          { label: 'EQUITY', value: `$${(balance + openPnl).toFixed(2)}`, color: '#e0e0e0' },
          { label: 'POSITIONS', value: positions.length, color: positions.length > 0 ? '#e8c84a' : 'rgba(255,255,255,0.2)' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 18px', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>{s.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: s.color }}>{s.value}</span>
          </div>
        ))}

        {/* Live price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 18px', borderRight: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{asset.label}</span>
          <motion.span key={price}
            animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e0e0e0' }}
            transition={{ duration: 0.2 }}
            style={{ fontSize: '14px', fontWeight: '800' }}>
            {price.toFixed(decimals)}
          </motion.span>
          {priceDir === 'up' ? <TrendingUp size={11} color="#00ff88" /> : priceDir === 'down' ? <TrendingDown size={11} color="#ff4466" /> : null}
        </div>

        {/* History toggle */}
        <button onClick={() => setShowHistory(!showHistory)}
          style={{ marginLeft: 'auto', padding: '0 16px', height: '100%', background: showHistory ? 'rgba(232,200,74,0.08)' : 'transparent', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.05)', color: showHistory ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>
          HISTORY {history.length > 0 && `(${history.length})`}
        </button>

        <div style={{ padding: '0 14px', fontSize: '8px', color: 'rgba(255,255,255,0.1)', letterSpacing: '1px', borderLeft: '1px solid rgba(255,255,255,0.05)', height: '100%', display: 'flex', alignItems: 'center' }}>
          PAPER TRADING ONLY
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `140px 1fr ${showPanel ? '220px' : '0px'}`, overflow: 'hidden', minHeight: 0, transition: 'grid-template-columns 0.2s' }}>

        {/* ── LEFT: Asset list ── */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
            {Object.keys(ASSETS).map(cat => (
              <button key={cat} onClick={() => { setCategory(cat); setAsset(ASSETS[cat][0]) }}
                style={{ flex: 1, padding: '7px 0', background: 'transparent', border: 'none', borderBottom: category === cat ? '2px solid #e8c84a' : '2px solid transparent', color: category === cat ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '8px', fontWeight: '700', letterSpacing: '0.5px', cursor: 'pointer', textTransform: 'uppercase' }}>
                {cat === 'stocks' ? 'EQ' : cat === 'forex' ? 'FX' : 'CR'}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {ASSETS[category].map(a => (
              <button key={a.symbol} onClick={() => setAsset(a)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 10px', background: asset.symbol === a.symbol ? 'rgba(232,200,74,0.07)' : 'transparent', border: 'none', borderLeft: asset.symbol === a.symbol ? '2px solid #e8c84a' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.1s' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: asset.symbol === a.symbol ? '#e8c84a' : '#b0b0b0' }}>{a.label}</span>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                  {(BASE_PRICES[a.symbol] || 0).toFixed(a.pip < 0.001 ? 4 : 2)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: Chart + entry line overlay ── */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <TradingViewChart symbol={asset.symbol} />
          <EntryLines positions={positions} price={price} decimals={decimals} />

          {/* Floating toggle for order panel */}
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowPanel(!showPanel)}
            style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 20, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(232,200,74,0.3)', borderRadius: '8px', padding: '6px 12px', color: '#e8c84a', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', backdropFilter: 'blur(8px)' }}>
            {showPanel ? '✕ HIDE' : '+ ORDER'}
          </motion.button>
        </div>

        {/* ── RIGHT: Order panel ── */}
        {showPanel && (
          <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0c0c0c' }}>

            <div style={{ flex: 1, padding: '14px 12px', overflowY: 'auto' }}>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '12px' }}>ORDER ENTRY — {asset.label}</div>

              {/* Direction */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                {['long', 'short'].map(d => (
                  <motion.button key={d} whileTap={{ scale: 0.96 }} onClick={() => setDirection(d)}
                    style={{ padding: '11px 0', borderRadius: '7px', border: `1px solid ${direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.07)'}`, background: direction === d ? (d === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)') : 'rgba(255,255,255,0.02)', color: direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    {d === 'long' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {d.toUpperCase()}
                  </motion.button>
                ))}
              </div>

              {/* Size */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', display: 'block', marginBottom: '5px' }}>POSITION SIZE ($)</label>
                <input type="number" value={size} onChange={e => setSize(e.target.value)}
                  style={{ width: '100%', padding: '9px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', color: '#e0e0e0', fontSize: '13px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>

              {/* SL / TP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '8px', color: '#ff6680', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>STOP LOSS</label>
                  <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="—"
                    style={{ width: '100%', padding: '7px 8px', background: 'rgba(255,68,102,0.04)', border: '1px solid rgba(255,68,102,0.12)', borderRadius: '6px', color: '#ff6680', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ fontSize: '8px', color: '#00cc6a', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>TAKE PROFIT</label>
                  <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="—"
                    style={{ width: '100%', padding: '7px 8px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.12)', borderRadius: '6px', color: '#00cc6a', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
              </div>

              {/* Market price */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>MARKET PRICE</span>
                <motion.span key={price}
                  animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e8c84a' }}
                  style={{ fontSize: '15px', fontWeight: '800' }}>
                  {price.toFixed(decimals)}
                </motion.span>
              </div>

              {/* Execute */}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleExecute}
                style={{ width: '100%', padding: '13px', borderRadius: '8px', border: 'none', background: direction === 'long' ? 'linear-gradient(135deg, #009944, #00ff88)' : 'linear-gradient(135deg, #aa1133, #ff4466)', color: '#000', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '16px' }}>
                <Zap size={13} />
                {direction === 'long' ? 'BUY LONG' : 'SELL SHORT'}
              </motion.button>

              {/* Open positions */}
              {positions.length > 0 && (
                <>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '8px' }}>
                    OPEN ({positions.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <AnimatePresence>
                      {positions.map(pos => {
                        const diff = pos.direction === 'long' ? price - pos.entry : pos.entry - price
                        const pnl = (diff / pos.entry) * pos.size * 1000
                        const profit = pnl >= 0
                        const color = profit ? '#00ff88' : '#ff4466'
                        return (
                          <motion.div key={pos.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ background: profit ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,102,0.04)', border: `1px solid ${profit ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,102,0.1)'}`, borderRadius: '7px', padding: '8px 10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                <span style={{ fontSize: '8px', fontWeight: '800', padding: '1px 5px', borderRadius: '3px', background: pos.direction === 'long' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)', color: pos.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px' }}>
                                  {pos.direction.toUpperCase()}
                                </span>
                                <span style={{ fontSize: '11px', fontWeight: '700', color: '#c0c0c0' }}>{pos.asset.label}</span>
                              </div>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleClose(pos.id)}
                                style={{ background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.2)', borderRadius: '4px', padding: '2px 8px', color: '#ff4466', fontSize: '9px', fontWeight: '700', cursor: 'pointer' }}>
                                CLOSE
                              </motion.button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', marginBottom: '1px' }}>ENTRY</div>
                                <div style={{ fontSize: '10px', fontWeight: '700', color: '#a0a0a0' }}>{pos.entry.toFixed(decimals)}</div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', marginBottom: '1px' }}>P&L</div>
                                <motion.div style={{ fontSize: '13px', fontWeight: '900', color }}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</motion.div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM: Trade history (collapsible) ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '160px', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: '#0c0c0c', flexShrink: 0, overflow: 'hidden' }}>
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
                      <tr>
                        {['ASSET', 'DIRECTION', 'ENTRY', 'EXIT', 'P&L', 'TIME', ''].map(h => (
                          <th key={h} style={{ padding: '4px 14px', textAlign: 'left', fontSize: '8px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px', fontWeight: '700', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((t, i) => (
                        <tr key={i}>
                          <td style={{ padding: '5px 14px', color: '#c0c0c0', fontWeight: '700' }}>{t.asset.label}</td>
                          <td style={{ padding: '5px 14px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', padding: '1px 6px', borderRadius: '3px', background: t.direction === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)', color: t.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px' }}>
                              {t.direction.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '5px 14px', color: 'rgba(255,255,255,0.35)' }}>{t.entry.toFixed(t.asset.pip < 0.001 ? 5 : t.asset.pip < 0.1 ? 4 : 2)}</td>
                          <td style={{ padding: '5px 14px', color: 'rgba(255,255,255,0.35)' }}>{t.closePrice?.toFixed(t.asset.pip < 0.001 ? 5 : t.asset.pip < 0.1 ? 4 : 2)}</td>
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