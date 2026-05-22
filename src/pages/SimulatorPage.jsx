import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import {
  TrendingUp, TrendingDown, X, Plus, Activity,
  DollarSign, Target, Shield, Zap, Clock, ChevronDown
} from 'lucide-react'

// ─── ASSET CATALOGUE ───────────────────────────────────────────────
const ASSETS = {
  forex: [
    { symbol: 'FX:EURUSD', label: 'EUR/USD', pip: 0.0001, pipValue: 10 },
    { symbol: 'FX:GBPUSD', label: 'GBP/USD', pip: 0.0001, pipValue: 10 },
    { symbol: 'FX:USDJPY', label: 'USD/JPY', pip: 0.01,   pipValue: 10 },
    { symbol: 'FX:AUDUSD', label: 'AUD/USD', pip: 0.0001, pipValue: 10 },
    { symbol: 'FX:USDCAD', label: 'USD/CAD', pip: 0.0001, pipValue: 10 },
    { symbol: 'FX:USDCHF', label: 'USD/CHF', pip: 0.0001, pipValue: 10 },
  ],
  stocks: [
    { symbol: 'NASDAQ:AAPL',  label: 'AAPL',  pip: 0.01, pipValue: 1 },
    { symbol: 'NASDAQ:TSLA',  label: 'TSLA',  pip: 0.01, pipValue: 1 },
    { symbol: 'NASDAQ:NVDA',  label: 'NVDA',  pip: 0.01, pipValue: 1 },
    { symbol: 'CME_MINI:ES1!',label: 'ES',    pip: 0.25, pipValue: 12.50 },
    { symbol: 'CME_MINI:NQ1!',label: 'NQ',    pip: 0.25, pipValue: 5 },
    { symbol: 'AMEX:SPY',     label: 'SPY',   pip: 0.01, pipValue: 1 },
  ],
  crypto: [
    { symbol: 'BINANCE:BTCUSDT', label: 'BTC/USD', pip: 1,    pipValue: 1 },
    { symbol: 'BINANCE:ETHUSDT', label: 'ETH/USD', pip: 0.01, pipValue: 1 },
    { symbol: 'BINANCE:SOLUSDT', label: 'SOL/USD', pip: 0.01, pipValue: 1 },
    { symbol: 'BINANCE:XRPUSDT', label: 'XRP/USD', pip: 0.0001, pipValue: 1 },
  ],
}

const CATEGORY_LABELS = { forex: 'Forex', stocks: 'Stocks & Indices', crypto: 'Crypto' }

// ─── SIMULATED PRICE ENGINE ────────────────────────────────────────
// Uses TradingView for charts; price simulation uses a random walk
// seeded from a realistic base price per asset
const BASE_PRICES = {
  'FX:EURUSD': 1.0842, 'FX:GBPUSD': 1.2734, 'FX:USDJPY': 149.82,
  'FX:AUDUSD': 0.6521, 'FX:USDCAD': 1.3612, 'FX:USDCHF': 0.9034,
  'NASDAQ:AAPL': 213.45, 'NASDAQ:TSLA': 248.10, 'NASDAQ:NVDA': 131.20,
  'CME_MINI:ES1!': 5428.50, 'CME_MINI:NQ1!': 19234.25, 'AMEX:SPY': 542.80,
  'BINANCE:BTCUSDT': 68420, 'BINANCE:ETHUSDT': 3520, 'BINANCE:SOLUSDT': 172.40, 'BINANCE:XRPUSDT': 0.5821,
}

function useLivePrice(symbol) {
  const [price, setPrice] = useState(BASE_PRICES[symbol] || 100)
  const priceRef = useRef(BASE_PRICES[symbol] || 100)

  useEffect(() => {
    const base = BASE_PRICES[symbol] || 100
    priceRef.current = base
    setPrice(base)

    const volatility = base > 10000 ? 0.0004 : base > 100 ? 0.0003 : base > 1 ? 0.00015 : 0.00008

    const interval = setInterval(() => {
      const change = priceRef.current * volatility * (Math.random() - 0.499)
      priceRef.current = Math.max(priceRef.current + change, 0.0001)
      setPrice(parseFloat(priceRef.current.toFixed(
        base > 1000 ? 2 : base > 10 ? 2 : base > 1 ? 4 : 5
      )))
    }, 800)

    return () => clearInterval(interval)
  }, [symbol])

  return price
}

// ─── TV CHART ──────────────────────────────────────────────────────
function TradingViewChart({ symbol }) {
  const containerRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol,
      interval: '5',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(0,0,0,0)',
      gridColor: 'rgba(232,200,74,0.04)',
      width: '100%',
      height: '100%',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_side_toolbar: false,
      save_image: false,
      withdateranges: true,
      details: false,
      hotlist: false,
      calendar: false,
      studies: ['STD;MACD', 'STD;RSI'],
    })

    containerRef.current.appendChild(script)
  }, [symbol])

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
  )
}

// ─── STAT CELL ─────────────────────────────────────────────────────
function StatCell({ label, value, color, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: '700', color: color || '#e0e0e0', fontFamily: mono !== false ? 'monospace' : 'inherit' }}>{value}</span>
    </div>
  )
}

// ─── POSITION CARD ─────────────────────────────────────────────────
function PositionCard({ pos, currentPrice, onClose }) {
  const rawPnl = pos.direction === 'long'
    ? (currentPrice - pos.entryPrice) * pos.size * (1 / (pos.asset.pip || 0.0001)) * (pos.asset.pipValue || 10) / (1 / (pos.asset.pip || 0.0001))
    : (pos.entryPrice - currentPrice) * pos.size * (1 / (pos.asset.pip || 0.0001)) * (pos.asset.pipValue || 10) / (1 / (pos.asset.pip || 0.0001))

  const pnl = ((currentPrice - pos.entryPrice) / pos.entryPrice) * pos.size * (pos.direction === 'long' ? 1 : -1) * 1000
  const pips = pos.direction === 'long'
    ? (currentPrice - pos.entryPrice) / pos.asset.pip
    : (pos.entryPrice - currentPrice) / pos.asset.pip
  const isProfit = pnl >= 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      style={{
        background: isProfit ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,102,0.04)',
        border: `1px solid ${isProfit ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)'}`,
        borderRadius: '10px', padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ padding: '3px 8px', borderRadius: '4px', background: pos.direction === 'long' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)', fontSize: '10px', fontWeight: '800', color: pos.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px', fontFamily: 'monospace' }}>
            {pos.direction.toUpperCase()}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#e0e0e0', fontFamily: 'monospace' }}>{pos.asset.label}</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => onClose(pos.id, pnl)}
          style={{ background: 'rgba(255,68,102,0.1)', border: '1px solid rgba(255,68,102,0.3)', borderRadius: '6px', padding: '4px 10px', color: '#ff4466', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'monospace' }}>
          CLOSE
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        <StatCell label="Entry" value={pos.entryPrice.toFixed(pos.asset.pip < 0.001 ? 5 : pos.asset.pip < 0.1 ? 4 : 2)} />
        <StatCell label="Current" value={currentPrice.toFixed(pos.asset.pip < 0.001 ? 5 : pos.asset.pip < 0.1 ? 4 : 2)} />
        <StatCell label="Pips" value={pips >= 0 ? `+${pips.toFixed(1)}` : pips.toFixed(1)} color={pips >= 0 ? '#00ff88' : '#ff4466'} />
        <StatCell label="P&L" value={`${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`} color={isProfit ? '#00ff88' : '#ff4466'} />
      </div>
    </motion.div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────
export default function SimulatorPage({ user }) {
  const [category, setCategory] = useState('stocks')
  const [selectedAsset, setSelectedAsset] = useState(ASSETS.stocks[0])
  const [direction, setDirection] = useState('long')
  const [size, setSize] = useState('1000')
  const [sl, setSl] = useState('')
  const [tp, setTp] = useState('')
  const [positions, setPositions] = useState([])
  const [closedTrades, setClosedTrades] = useState([])
  const [balance, setBalance] = useState(10000)
  const [showLog, setShowLog] = useState(false)
  const [logSaved, setLogSaved] = useState(false)
  const [flash, setFlash] = useState(null) // 'profit' | 'loss'

  const currentPrice = useLivePrice(selectedAsset.symbol)
  const prevPrice = useRef(currentPrice)
  const [priceDir, setPriceDir] = useState(null)

  useEffect(() => {
    if (currentPrice > prevPrice.current) setPriceDir('up')
    else if (currentPrice < prevPrice.current) setPriceDir('down')
    prevPrice.current = currentPrice
  }, [currentPrice])

  const totalPnl = positions.reduce((sum, pos) => {
    const pnl = ((currentPrice - pos.entryPrice) / pos.entryPrice) * pos.size * (pos.direction === 'long' ? 1 : -1) * 1000
    return sum + pnl
  }, 0)

  const handleCategoryChange = (cat) => {
    setCategory(cat)
    setSelectedAsset(ASSETS[cat][0])
  }

  const handleOpenPosition = () => {
    if (!size || parseFloat(size) <= 0) return
    const newPos = {
      id: Date.now(),
      asset: selectedAsset,
      direction,
      entryPrice: currentPrice,
      size: parseFloat(size),
      sl: sl ? parseFloat(sl) : null,
      tp: tp ? parseFloat(tp) : null,
      openedAt: new Date(),
    }
    setPositions(prev => [...prev, newPos])
    setSl(''); setTp('')
  }

  const handleClosePosition = useCallback((id, pnl) => {
    const pos = positions.find(p => p.id === id)
    if (!pos) return
    const isProfit = pnl >= 0
    setFlash(isProfit ? 'profit' : 'loss')
    setTimeout(() => setFlash(null), 600)
    setBalance(prev => prev + pnl)
    setClosedTrades(prev => [...prev, { ...pos, closedAt: new Date(), pnl, closePrice: currentPrice }])
    setPositions(prev => prev.filter(p => p.id !== id))
  }, [positions, currentPrice])

  const handleLogSession = async (trade) => {
    const outcome = trade.pnl >= 0 ? 'win' : 'loss'
    await supabase.from('sessions').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      outcome,
      pnl: parseFloat(trade.pnl.toFixed(2)),
      analysis: `Demo trade on ${trade.asset.label}. ${trade.direction.toUpperCase()} from ${trade.entryPrice} to ${trade.closePrice?.toFixed(4)}`,
      lessons: 'Logged from Wick Simulator.',
      emotions: 'Demo',
      bias: trade.direction === 'long' ? 'Bullish' : 'Bearish',
    })
    const xpGain = outcome === 'win' ? 100 : 50
    await supabase.rpc('increment_xp', { user_id_input: user.id, xp_amount: xpGain })
    setLogSaved(true)
    setTimeout(() => setLogSaved(false), 3000)
  }

  const decimals = selectedAsset.pip < 0.001 ? 5 : selectedAsset.pip < 0.1 ? 4 : 2

  return (
    <div style={{ fontFamily: 'monospace', minHeight: '100vh', color: '#e0e0e0', position: 'relative' }}>

      {/* Flash overlay on close */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none', background: flash === 'profit' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)' }}
          />
        )}
      </AnimatePresence>

      {/* ── TOP STATUS BAR ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', borderBottom: '1px solid rgba(232,200,74,0.1)', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', padding: '0 16px', height: '36px', flexWrap: 'wrap' }}>
        {/* Wick sim badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff88' }} />
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#00ff88', letterSpacing: '2px' }}>SIMULATOR LIVE</span>
        </div>

        {/* Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <StatCell label="Balance" value={`$${balance.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="#e8c84a" />
          <StatCell label="Open P&L" value={`${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`} color={totalPnl >= 0 ? '#00ff88' : '#ff4466'} />
          <StatCell label="Equity" value={`$${(balance + totalPnl).toFixed(2)}`} color="#e0e0e0" />
          <StatCell label="Positions" value={positions.length} />
        </div>

        {/* Live price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>{selectedAsset.label}</span>
          <motion.span
            key={currentPrice}
            animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e0e0e0' }}
            transition={{ duration: 0.3 }}
            style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace' }}
          >
            {currentPrice.toFixed(decimals)}
          </motion.span>
          {priceDir === 'up' ? <TrendingUp size={12} color="#00ff88" /> : priceDir === 'down' ? <TrendingDown size={12} color="#ff4466" /> : null}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
          WICK PAPER TRADING — NOT FINANCIAL ADVICE
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr 280px', gap: '0', height: 'calc(100vh - 160px)', minHeight: '600px' }}>

        {/* ── LEFT PANEL: Asset selector + Order entry ── */}
        <div style={{ borderRight: '1px solid rgba(232,200,74,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Category tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {Object.keys(ASSETS).map(cat => (
              <button key={cat} onClick={() => handleCategoryChange(cat)}
                style={{ flex: 1, padding: '8px 4px', background: category === cat ? 'rgba(232,200,74,0.08)' : 'transparent', border: 'none', borderBottom: category === cat ? '2px solid #e8c84a' : '2px solid transparent', color: category === cat ? '#e8c84a' : 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase', transition: 'all 0.15s' }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Asset list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {ASSETS[category].map(asset => (
              <motion.button key={asset.symbol} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAsset(asset)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: selectedAsset.symbol === asset.symbol ? 'rgba(232,200,74,0.06)' : 'transparent', border: 'none', borderLeft: selectedAsset.symbol === asset.symbol ? '2px solid #e8c84a' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: selectedAsset.symbol === asset.symbol ? '#e8c84a' : '#e0e0e0', fontFamily: 'monospace' }}>{asset.label}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                  {(BASE_PRICES[asset.symbol] || 0).toFixed(asset.pip < 0.001 ? 5 : asset.pip < 0.1 ? 4 : 2)}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Order entry */}
          <div style={{ borderTop: '1px solid rgba(232,200,74,0.1)', padding: '14px', background: 'rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', marginBottom: '10px', textTransform: 'uppercase' }}>New Order — {selectedAsset.label}</div>

            {/* Long / Short */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              {['long', 'short'].map(d => (
                <motion.button key={d} whileTap={{ scale: 0.96 }} onClick={() => setDirection(d)}
                  style={{ padding: '10px', borderRadius: '6px', border: `1px solid ${direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.08)'}`, background: direction === d ? (d === 'long' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,102,0.1)') : 'transparent', color: direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontFamily: 'monospace' }}>
                  {d === 'long' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {d.toUpperCase()}
                </motion.button>
              ))}
            </div>

            {/* Size */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>SIZE ($)</label>
              <input type="number" value={size} onChange={e => setSize(e.target.value)} placeholder="1000"
                style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#e0e0e0', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>

            {/* SL / TP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '9px', color: '#ff4466', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>STOP LOSS</label>
                <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="Optional"
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(255,68,102,0.04)', border: '1px solid rgba(255,68,102,0.15)', borderRadius: '6px', color: '#ff4466', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '9px', color: '#00ff88', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>TAKE PROFIT</label>
                <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="Optional"
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '6px', color: '#00ff88', fontSize: '11px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
            </div>

            {/* Execute */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleOpenPosition}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: direction === 'long' ? 'linear-gradient(135deg, #00cc6a, #00ff88)' : 'linear-gradient(135deg, #cc2244, #ff4466)', color: '#000', fontSize: '12px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Zap size={13} />
              EXECUTE {direction.toUpperCase()}
            </motion.button>

            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>MARKET PRICE</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#e8c84a', fontFamily: 'monospace' }}>{currentPrice.toFixed(decimals)}</span>
            </div>
          </div>
        </div>

        {/* ── CENTER: Chart ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <TradingViewChart symbol={selectedAsset.symbol} />
          </div>
        </div>

        {/* ── RIGHT PANEL: Positions + History ── */}
        <div style={{ borderLeft: '1px solid rgba(232,200,74,0.08)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Open positions */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={11} color="#e8c84a" />
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#e8c84a', letterSpacing: '1.5px' }}>OPEN POSITIONS</span>
            {positions.length > 0 && (
              <span style={{ marginLeft: 'auto', padding: '1px 6px', borderRadius: '10px', background: 'rgba(232,200,74,0.15)', color: '#e8c84a', fontSize: '10px', fontWeight: '700' }}>{positions.length}</span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <AnimatePresence>
              {positions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
                  No open positions.<br />Execute a trade to begin.
                </div>
              ) : (
                positions.map(pos => (
                  <PositionCard key={pos.id} pos={pos} currentPrice={currentPrice} onClose={handleClosePosition} />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Closed trades / history */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: '280px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={11} color="rgba(255,255,255,0.3)" />
              <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px' }}>TRADE HISTORY</span>
              {logSaved && <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#00ff88', fontWeight: '700' }}>✓ LOGGED</span>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {closedTrades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>No closed trades yet.</div>
              ) : (
                [...closedTrades].reverse().map((trade, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', marginBottom: '4px', border: `1px solid ${trade.pnl >= 0 ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)'}` }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: trade.direction === 'long' ? '#00ff88' : '#ff4466', fontFamily: 'monospace' }}>{trade.direction.toUpperCase()}</span>
                        <span style={{ fontSize: '11px', color: '#e0e0e0', fontFamily: 'monospace' }}>{trade.asset.label}</span>
                      </div>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{trade.closedAt?.toLocaleTimeString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: trade.pnl >= 0 ? '#00ff88' : '#ff4466', fontFamily: 'monospace' }}>
                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      </span>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleLogSession(trade)}
                        style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(232,200,74,0.1)', border: '1px solid rgba(232,200,74,0.2)', color: '#e8c84a', fontSize: '9px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', fontFamily: 'monospace' }}>
                        LOG
                      </motion.button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}