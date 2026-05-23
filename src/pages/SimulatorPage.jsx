import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../supabase'
import {
  TrendingUp, TrendingDown, Zap, X,
  BarChart2, Layers, Shield, Radio,
  ChevronDown, Info, BookOpen
} from 'lucide-react'

// ─── CONSTANTS ─────────────────────────────────────────────────────

const ASSETS = {
  forex: [
    { symbol: 'FX:EURUSD', label: 'EUR/USD', pip: 0.0001, spread: 0.00012 },
    { symbol: 'FX:GBPUSD', label: 'GBP/USD', pip: 0.0001, spread: 0.00014 },
    { symbol: 'FX:USDJPY', label: 'USD/JPY', pip: 0.01,   spread: 0.012 },
    { symbol: 'FX:AUDUSD', label: 'AUD/USD', pip: 0.0001, spread: 0.00013 },
    { symbol: 'FX:USDCAD', label: 'USD/CAD', pip: 0.0001, spread: 0.00015 },
    { symbol: 'FX:USDCHF', label: 'USD/CHF', pip: 0.0001, spread: 0.00013 },
  ],
  stocks: [
    { symbol: 'NASDAQ:AAPL',   label: 'AAPL', pip: 0.01, spread: 0.02 },
    { symbol: 'NASDAQ:TSLA',   label: 'TSLA', pip: 0.01, spread: 0.05 },
    { symbol: 'NASDAQ:NVDA',   label: 'NVDA', pip: 0.01, spread: 0.03 },
    { symbol: 'CME_MINI:ES1!', label: 'ES',   pip: 0.25, spread: 0.25 },
    { symbol: 'CME_MINI:NQ1!', label: 'NQ',   pip: 0.25, spread: 0.25 },
    { symbol: 'AMEX:SPY',      label: 'SPY',  pip: 0.01, spread: 0.01 },
  ],
  crypto: [
    { symbol: 'BINANCE:BTCUSDT', label: 'BTC/USD', pip: 1,      spread: 5 },
    { symbol: 'BINANCE:ETHUSDT', label: 'ETH/USD', pip: 0.01,   spread: 0.5 },
    { symbol: 'BINANCE:SOLUSDT', label: 'SOL/USD', pip: 0.01,   spread: 0.05 },
    { symbol: 'BINANCE:XRPUSDT', label: 'XRP/USD', pip: 0.0001, spread: 0.0003 },
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

const BALANCE_OPTIONS = [
  { value: 10000,  label: '$10K',  subtitle: 'Starter' },
  { value: 25000,  label: '$25K',  subtitle: 'Intermediate' },
  { value: 50000,  label: '$50K',  subtitle: 'Advanced' },
  { value: 100000, label: '$100K', subtitle: 'Pro' },
]

// Risk management rules per account size
const RISK_RULES = {
  10000:  { maxDailyLoss: 500,   maxDrawdown: 1000,  maxPositionSize: 2000 },
  25000:  { maxDailyLoss: 1250,  maxDrawdown: 2500,  maxPositionSize: 5000 },
  50000:  { maxDailyLoss: 2500,  maxDrawdown: 5000,  maxPositionSize: 10000 },
  100000: { maxDailyLoss: 5000,  maxDrawdown: 10000, maxPositionSize: 20000 },
}

const TOOL_GROUPS = [
  {
    group: 'Trend Lines & Channels',
    color: '#e8c84a',
    tools: [
      { name: 'Trend Line', tip: 'Click two points on the chart to draw a trend line.' },
      { name: 'Horizontal Ray', tip: 'Marks a key support or resistance level across the chart.' },
      { name: 'Parallel Channel', tip: 'Draw two parallel lines to map upward or downward trends.' },
      { name: 'Anchored VWAP', tip: 'Right-click a candle → Add VWAP from here.' },
    ],
  },
  {
    group: 'Fibonacci & Gann',
    color: '#b97fff',
    tools: [
      { name: 'Fibonacci Retracement', tip: 'Drag from swing high to swing low to map pullback zones.' },
      { name: 'Gann Box', tip: 'Geometric tool — drag over a price move to map time/price squares.' },
      { name: 'Gann Fan', tip: 'Projects angled support/resistance lines from a pivot point.' },
      { name: 'Schiff Pitchfork', tip: 'Identify dynamic support and resistance channels.' },
    ],
  },
  {
    group: 'Shapes & Drawing',
    color: '#00c8ff',
    tools: [
      { name: 'Rectangle', tip: 'Highlight consolidation zones, liquidity pools, or key areas.' },
      { name: 'Ellipse', tip: 'Circle areas of interest like rounded tops/bottoms.' },
      { name: 'Brush / Freehand', tip: 'Draw anything — free-form on the chart.' },
      { name: 'Polyline', tip: 'Connect multiple points to map complex paths.' },
    ],
  },
  {
    group: 'Annotations',
    color: '#ff9f44',
    tools: [
      { name: 'Text Label', tip: 'Add a note anywhere on your chart.' },
      { name: 'Anchored Text', tip: 'Pin text to a specific price level.' },
      { name: 'Callout', tip: 'A speech bubble pointing to a specific candle.' },
      { name: 'Arrow', tip: 'Draw attention to a breakout or key level.' },
    ],
  },
  {
    group: 'Prediction & Measurement',
    color: '#00ff88',
    tools: [
      { name: 'Long Position', tip: 'Drops a visual R:R box showing entry, stop, and target.' },
      { name: 'Short Position', tip: 'Same as Long Position but for short setups.' },
      { name: 'Date & Price Range', tip: 'Measure % change, pip count, or time between two points.' },
      { name: 'Ghost Feed / Forecast', tip: 'Project a hypothetical future price path on the chart.' },
    ],
  },
]

// ─── HOOKS ─────────────────────────────────────────────────────────

function useLivePrice(symbol) {
  const [price, setPrice] = useState(BASE_PRICES[symbol] || 100)
  const priceRef = useRef(BASE_PRICES[symbol] || 100)

  useEffect(() => {
    // Reset to base price immediately on symbol change
    const base = BASE_PRICES[symbol] || 100
    priceRef.current = base
    setPrice(base)

    // Map our symbol format to Yahoo Finance ticker
    const YAHOO_MAP = {
      'FX:EURUSD': 'EURUSD=X', 'FX:GBPUSD': 'GBPUSD=X',
      'FX:USDJPY': 'JPY=X', 'FX:AUDUSD': 'AUDUSD=X',
      'FX:USDCAD': 'CAD=X', 'FX:USDCHF': 'CHF=X',
      'NASDAQ:AAPL': 'AAPL', 'NASDAQ:TSLA': 'TSLA',
      'NASDAQ:NVDA': 'NVDA', 'CME_MINI:ES1!': 'ES=F',
      'CME_MINI:NQ1!': 'NQ=F', 'AMEX:SPY': 'SPY',
      'BINANCE:BTCUSDT': 'BTC-USD', 'BINANCE:ETHUSDT': 'ETH-USD',
      'BINANCE:SOLUSDT': 'SOL-USD', 'BINANCE:XRPUSDT': 'XRP-USD',
    }

    const ticker = YAHOO_MAP[symbol]
    if (!ticker) return

    const fetchPrice = async () => {
      try {
        const res = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1m&range=1d`,
          { headers: { 'User-Agent': 'Mozilla/5.0' } }
        )
        if (!res.ok) return
        const data = await res.json()
        const result = data?.chart?.result?.[0]
        const meta = result?.meta
        if (!meta) return
        const livePrice = meta.regularMarketPrice || meta.previousClose
        if (livePrice && livePrice > 0) {
          priceRef.current = livePrice
          setPrice(livePrice)
        }
      } catch (e) {
        // silently keep last known price
      }
    }

    fetchPrice()
    // Refresh every 15 seconds for near-realtime updates
    const iv = setInterval(fetchPrice, 15000)
    return () => clearInterval(iv)
  }, [symbol])

  return price
}

// ─── TRADINGVIEW CHART ─────────────────────────────────────────────
// hide_side_toolbar: FALSE — we WANT the full drawing toolbar visible
function TradingViewChart({ symbol }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const s = document.createElement('script')
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    s.async = true
    s.innerHTML = JSON.stringify({
      symbol,
      interval: '5',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: '#080808',
      gridColor: 'rgba(255,255,255,0.03)',
      width: '100%',
      height: '100%',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,   // ← full drawing toolbar enabled
      save_image: true,
      withdateranges: true,
      studies: ['STD;RSI', 'STD;MACD', 'STD;Volume'],
      show_popup_button: false,
      popup_width: '1000',
      popup_height: '650',
      support_host: 'https://www.tradingview.com',
    })
    ref.current.appendChild(s)
  }, [symbol])
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

// ─── RISK METER ────────────────────────────────────────────────────
function RiskMeter({ balance, startingBalance, dailyPnl, rules }) {
  const drawdownPct = ((startingBalance - balance) / startingBalance) * 100
  const dailyLossPct = Math.abs(Math.min(0, dailyPnl)) / rules.maxDailyLoss * 100
  const drawdownPctCapped = Math.min(100, (Math.abs(Math.min(0, balance - startingBalance)) / rules.maxDrawdown) * 100)

  const getColor = (pct) => pct > 75 ? '#ff4466' : pct > 50 ? '#ff9f44' : '#00ff88'

  return (
    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
        <Shield size={10} color="#7c9eff" />
        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>RISK MANAGEMENT</span>
      </div>
      {[
        { label: 'Daily Loss', pct: dailyLossPct, limit: `$${rules.maxDailyLoss.toLocaleString()}` },
        { label: 'Drawdown', pct: drawdownPctCapped, limit: `$${rules.maxDrawdown.toLocaleString()}` },
      ].map(r => (
        <div key={r.label} style={{ marginBottom: '7px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>{r.label}</span>
            <span style={{ fontSize: '8px', color: getColor(r.pct), fontWeight: '700' }}>{r.pct.toFixed(0)}%</span>
          </div>
          <div style={{ height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${Math.min(100, r.pct)}%` }}
              transition={{ type: 'spring', stiffness: 60 }}
              style={{ height: '100%', borderRadius: '2px', background: getColor(r.pct), boxShadow: `0 0 6px ${getColor(r.pct)}60` }}
            />
          </div>
          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.15)', marginTop: '2px' }}>Limit: {r.limit}</div>
        </div>
      ))}
    </div>
  )
}

// ─── TOOLS GUIDE PANEL ────────────────────────────────────────────
function ToolsGuide({ onClose }) {
  const [activeGroup, setActiveGroup] = useState(0)
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{ position: 'fixed', top: '130px', right: '210px', width: '320px', maxHeight: '70vh', zIndex: 200, background: '#0f0f0f', border: '1px solid rgba(232,200,74,0.2)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={14} color="#e8c84a" />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#e0e0e0', letterSpacing: '-0.2px' }}>Drawing Tools Guide</span>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
          <X size={14} />
        </motion.button>
      </div>
      {/* Group tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', flexShrink: 0 }}>
        {TOOL_GROUPS.map((g, i) => (
          <button key={i} onClick={() => setActiveGroup(i)}
            style={{ padding: '8px 12px', background: 'transparent', border: 'none', borderBottom: activeGroup === i ? `2px solid ${g.color}` : '2px solid transparent', color: activeGroup === i ? g.color : 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', letterSpacing: '0.5px', transition: 'all 0.15s' }}>
            {g.group.split(' ')[0]}
          </button>
        ))}
      </div>
      {/* Tools list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '10px', letterSpacing: '0.5px' }}>
          All tools are available in the TradingView toolbar on the left of the chart.
        </p>
        {TOOL_GROUPS[activeGroup].tools.map((t, i) => (
          <div key={i} style={{ marginBottom: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `2px solid ${TOOL_GROUPS[activeGroup].color}` }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#e0e0e0', marginBottom: '4px' }}>{t.name}</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{t.tip}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(232,200,74,0.04)', flexShrink: 0 }}>
        <p style={{ fontSize: '10px', color: 'rgba(232,200,74,0.6)', lineHeight: 1.5 }}>
          💡 Pro tip: Right-click any drawing on the chart to edit, lock, or delete it.
        </p>
      </div>
    </motion.div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────
export default function SimulatorPage({ user }) {
  const [startingBalance, setStartingBalance] = useState(null)
  const [balance, setBalance] = useState(10000)
  const [dailyPnl, setDailyPnl] = useState(0)
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
  const [showToolsGuide, setShowToolsGuide] = useState(false)
  const [riskWarning, setRiskWarning] = useState(null)

  const price = useLivePrice(asset.symbol)
  const prevPrice = useRef(price)
  const [priceDir, setPriceDir] = useState(null)

  useEffect(() => {
    if (price > prevPrice.current) setPriceDir('up')
    else if (price < prevPrice.current) setPriceDir('down')
    prevPrice.current = price
  }, [price])

  const decimals = asset.pip < 0.001 ? 5 : asset.pip < 0.1 ? 4 : 2
  const rules = RISK_RULES[startingBalance] || RISK_RULES[10000]

  const openPnl = positions.reduce((sum, p) => {
    const diff = p.direction === 'long' ? price - p.entry : p.entry - price
    return sum + (diff / p.entry) * p.size * 1000
  }, 0)

  // Auto-close all positions if daily loss limit hit
  useEffect(() => {
    if (!startingBalance) return
    if (dailyPnl <= -rules.maxDailyLoss) {
      setRiskWarning('Daily loss limit reached. All positions closed.')
      positions.forEach(pos => {
        const diff = pos.direction === 'long' ? price - pos.entry : pos.entry - price
        const pnl = (diff / pos.entry) * pos.size * 1000
        setBalance(b => b + pnl)
        setHistory(h => [{ ...pos, closePrice: price, pnl, closedAt: new Date(), autoClose: true }, ...h])
      })
      setPositions([])
      setTimeout(() => setRiskWarning(null), 5000)
    }
  }, [dailyPnl, rules.maxDailyLoss])

  const handleExecute = () => {
    if (!size || parseFloat(size) <= 0) return
    const posSize = parseFloat(size)
    if (posSize > rules.maxPositionSize) {
      setRiskWarning(`Max position size is $${rules.maxPositionSize.toLocaleString()} for this account.`)
      setTimeout(() => setRiskWarning(null), 3000)
      return
    }
    setPositions(prev => [...prev, {
      id: Date.now(), asset, direction,
      entry: price, size: posSize,
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
    setDailyPnl(d => d + pnl)
    setHistory(h => [{ ...pos, closePrice: price, pnl, closedAt: new Date() }, ...h])
    setPositions(p => p.filter(x => x.id !== id))
  }, [positions, price])

  const handleLog = async (trade) => {
    if (loggedIds.has(trade.id)) return
    const outcome = trade.pnl >= 0 ? 'win' : 'loss'
    await supabase.from('sessions').insert({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      outcome,
      pnl: parseFloat(trade.pnl.toFixed(2)),
      analysis: `Demo — ${trade.asset.label} ${trade.direction.toUpperCase()} ${trade.entry.toFixed(decimals)} → ${trade.closePrice?.toFixed(decimals)}${trade.autoClose ? ' (auto-closed by risk limit)' : ''}`,
      emotions: 'Demo',
      bias: trade.direction === 'long' ? 'Bullish' : 'Bearish',
    })
    await supabase.rpc('increment_xp', { user_id_input: user.id, xp_amount: trade.pnl >= 0 ? 100 : 50 })
    setLoggedIds(s => new Set([...s, trade.id]))
  }

  // ── BALANCE PICKER ─────────────────────────────────────────────
  if (!startingBalance) {
    return (
      <div style={{ minHeight: 'calc(100vh - 90px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '900px' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '14px' }}>
              <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 10px #00ff88' }} />
              <span style={{ fontSize: '10px', fontWeight: '700', color: '#00ff88', letterSpacing: '2.5px', fontFamily: 'monospace' }}>SIMULATOR LIVE</span>
            </div>
            <h1 style={{ fontSize: '38px', fontWeight: '900', color: '#fff', letterSpacing: '-1.5px', marginBottom: '10px' }}>Paper Trading Simulator</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '15px', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto' }}>
              Full-featured paper trading with professional charting tools, real market data, and built-in risk management. Zero real risk.
            </p>
          </div>

          {/* Feature grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '36px' }}>
            {[
              { icon: BarChart2, color: '#e8c84a', title: 'Charting & Analysis', desc: 'Full TradingView suite — trend lines, Fibonacci, Gann, channels, and 100+ drawing tools built right into the chart.' },
              { icon: Layers, color: '#00ff88', title: 'Execution Tools', desc: 'Order cards with precise entry, stop loss, and take profit. Long/Short Position boxes show your R:R before you trade.' },
              { icon: Shield, color: '#7c9eff', title: 'Risk Management', desc: 'Automated daily loss limits, drawdown locks, and max position size rules — so you trade like a funded trader.' },
              { icon: Radio, color: '#ff9f44', title: 'Live Market Data', desc: 'Real-time price feeds across Forex, Equities, and Crypto. Practice on the same data professional traders use.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px 16px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                  <f.icon size={18} color={f.color} />
                </div>
                <p style={{ fontSize: '12px', fontWeight: '800', color: '#e0e0e0', marginBottom: '6px' }}>{f.title}</p>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Tools preview strip */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px 20px', marginBottom: '32px' }}>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '2px', marginBottom: '10px', fontFamily: 'monospace' }}>AVAILABLE DRAWING TOOLS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {TOOL_GROUPS.flatMap(g => g.tools).map((t, i) => (
                <span key={i} style={{ padding: '3px 9px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{t.name}</span>
              ))}
            </div>
          </div>

          {/* Balance selection */}
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '2.5px', marginBottom: '14px', fontFamily: 'monospace' }}>SELECT YOUR STARTING BALANCE</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {BALANCE_OPTIONS.map(b => (
                <motion.button key={b.value} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { setStartingBalance(b.value); setBalance(b.value) }}
                  style={{ padding: '18px', borderRadius: '12px', border: '1px solid rgba(232,200,74,0.18)', background: 'rgba(232,200,74,0.04)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', fontFamily: 'monospace', transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8c84a'; e.currentTarget.style.background = 'rgba(232,200,74,0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(232,200,74,0.18)'; e.currentTarget.style.background = 'rgba(232,200,74,0.04)' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#e8c84a', letterSpacing: '-1px' }}>{b.label}</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px' }}>{b.subtitle}</span>
                  <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>
                    Max loss: ${(RISK_RULES[b.value].maxDailyLoss).toLocaleString()}/day
                  </span>
                </motion.button>
              ))}
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.5px', fontFamily: 'monospace' }}>PAPER TRADING ONLY — NOT FINANCIAL ADVICE</p>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── MAIN SIMULATOR ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)', overflow: 'hidden', background: '#080808' }}>

      {/* Flash */}
      <AnimatePresence>
        {flash && (
          <motion.div initial={{ opacity: 0.35 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 999, pointerEvents: 'none', background: flash === 'profit' ? 'rgba(0,255,136,0.08)' : 'rgba(255,68,102,0.08)' }} />
        )}
      </AnimatePresence>

      {/* Risk warning toast */}
      <AnimatePresence>
        {riskWarning && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 500, background: 'rgba(255,68,102,0.15)', border: '1px solid rgba(255,68,102,0.4)', borderRadius: '10px', padding: '12px 20px', color: '#ff4466', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={14} /> {riskWarning}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tools guide popup */}
      <AnimatePresence>
        {showToolsGuide && <ToolsGuide onClose={() => setShowToolsGuide(false)} />}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div style={{ height: '40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', flexShrink: 0, background: '#0d0d0d' }}>
        {/* Balance tabs */}
        <div style={{ display: 'flex', height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {BALANCE_OPTIONS.map(b => (
            <button key={b.value}
              onClick={() => { setStartingBalance(b.value); setBalance(b.value); setPositions([]); setHistory([]); setDailyPnl(0) }}
              style={{ padding: '0 14px', height: '100%', background: startingBalance === b.value ? 'rgba(232,200,74,0.1)' : 'transparent', border: 'none', borderBottom: startingBalance === b.value ? '2px solid #e8c84a' : '2px solid transparent', color: startingBalance === b.value ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s' }}>
              {b.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        {[
          { label: 'BALANCE', value: `$${balance.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: '#e8c84a' },
          { label: 'OPEN P&L', value: `${openPnl >= 0 ? '+' : ''}$${openPnl.toFixed(2)}`, color: openPnl >= 0 ? '#00ff88' : '#ff4466' },
          { label: 'EQUITY', value: `$${(balance + openPnl).toFixed(2)}`, color: '#e0e0e0' },
          { label: 'DAY P&L', value: `${dailyPnl >= 0 ? '+' : ''}$${dailyPnl.toFixed(2)}`, color: dailyPnl >= 0 ? '#00ff88' : '#ff4466' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>{s.label}</span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: s.color }}>{s.value}</span>
          </div>
        ))}

        {/* Live price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '0 16px', borderRight: '1px solid rgba(255,255,255,0.06)', height: '100%' }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }}
            style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{asset.label}</span>
          <motion.span key={price} animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e0e0e0' }} transition={{ duration: 0.2 }} style={{ fontSize: '14px', fontWeight: '800' }}>
            {price.toFixed(decimals)}
          </motion.span>
          {priceDir === 'up' ? <TrendingUp size={11} color="#00ff88" /> : priceDir === 'down' ? <TrendingDown size={11} color="#ff4466" /> : null}
        </div>

        {/* Tools guide button */}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowToolsGuide(!showToolsGuide)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '0 14px', height: '100%', background: showToolsGuide ? 'rgba(232,200,74,0.08)' : 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)', color: showToolsGuide ? '#e8c84a' : 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px' }}>
          <BookOpen size={11} /> TOOLS GUIDE
        </motion.button>

        <button onClick={() => setShowHistory(!showHistory)}
          style={{ padding: '0 14px', height: '100%', background: 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.06)', color: showHistory ? '#e8c84a' : 'rgba(255,255,255,0.25)', fontSize: '10px', fontWeight: '700', cursor: 'pointer', letterSpacing: '1px', marginLeft: 'auto' }}>
          HISTORY {history.length > 0 && `(${history.length})`}
        </button>
      </div>

      {/* ── ASSET SELECTOR ── */}
      <div style={{ height: '44px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', flexShrink: 0, background: '#0a0a0a', overflowX: 'auto' }}>
        <div style={{ display: 'flex', height: '100%', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          {Object.keys(ASSETS).map(cat => (
            <button key={cat} onClick={() => {
              if (positions.length > 0) {
                setRiskWarning('⚠️ Close all open positions before switching markets.'); setTimeout(() => setRiskWarning(null), 3000)
                return
              }
              setCategory(cat); setAsset(ASSETS[cat][0])
            }}
              style={{ padding: '0 16px', height: '100%', background: 'transparent', border: 'none', borderBottom: category === cat ? '2px solid #e8c84a' : '2px solid transparent', color: category === cat ? '#e8c84a' : 'rgba(255,255,255,0.3)', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', cursor: 'pointer', textTransform: 'uppercase' }}>
              {cat === 'stocks' ? 'Equities' : cat === 'forex' ? 'Forex' : 'Crypto'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px' }}>
          {ASSETS[category].map(a => (
            <button key={a.symbol} onClick={() => {
              if (positions.length > 0) {
                setRiskWarning('⚠️ Close all open positions before switching symbols.'); setTimeout(() => setRiskWarning(null), 3000)
                return
              }
              setAsset(a)
            }}
              style={{ padding: '5px 14px', borderRadius: '6px', border: `1px solid ${asset.symbol === a.symbol ? '#e8c84a' : 'rgba(255,255,255,0.08)'}`, background: asset.symbol === a.symbol ? 'rgba(232,200,74,0.12)' : 'transparent', color: asset.symbol === a.symbol ? '#e8c84a' : 'rgba(255,255,255,0.4)', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
              {a.label}
            </button>
          ))}
        </div>
        {/* Spread indicator */}
        <div style={{ marginLeft: 'auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>SPREAD</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>{asset.spread?.toFixed(asset.pip < 0.001 ? 5 : 2)}</span>
          <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>50ms CME FEED</span>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
            style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00ff88' }} />
        </div>
      </div>

      {/* ── CHART + SIDEBAR ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 280px', overflow: 'hidden', minHeight: 0 }}>

        {/* Chart — full drawing toolbar on left, bleed edges to remove TV internal gaps */}
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '-2px', right: '-2px' }}>
            <TradingViewChart symbol={asset.symbol} />
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: '#0a0a0a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Risk meters */}
          <RiskMeter
            balance={balance}
            startingBalance={startingBalance}
            dailyPnl={dailyPnl}
            rules={rules}
          />

          {/* Order entry */}
          <div style={{ padding: '16px 16px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '12px' }}>ORDER ENTRY</p>

            {/* Long / Short */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {['long', 'short'].map(d => (
                <motion.button key={d} whileTap={{ scale: 0.96 }} onClick={() => setDirection(d)}
                  style={{ padding: '12px 0', borderRadius: '8px', border: `1px solid ${direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.08)'}`, background: direction === d ? (d === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)') : 'rgba(255,255,255,0.02)', color: direction === d ? (d === 'long' ? '#00ff88' : '#ff4466') : 'rgba(255,255,255,0.3)', fontSize: '12px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'all 0.15s' }}>
                  {d === 'long' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {d.toUpperCase()}
                </motion.button>
              ))}
            </div>

            {/* Size */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px' }}>SIZE ($)</label>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.15)' }}>Max ${rules.maxPositionSize.toLocaleString()}</span>
              </div>
              <input type="number" value={size} onChange={e => setSize(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '7px', color: '#e0e0e0', fontSize: '14px', fontWeight: '700', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>

            {/* SL / TP */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '9px', color: '#ff6680', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>STOP LOSS</label>
                <input type="number" value={sl} onChange={e => setSl(e.target.value)} placeholder="—"
                  style={{ width: '100%', padding: '8px 9px', background: 'rgba(255,68,102,0.04)', border: '1px solid rgba(255,68,102,0.15)', borderRadius: '6px', color: '#ff6680', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '9px', color: '#00cc6a', letterSpacing: '1px', display: 'block', marginBottom: '5px' }}>TAKE PROFIT</label>
                <input type="number" value={tp} onChange={e => setTp(e.target.value)} placeholder="—"
                  style={{ width: '100%', padding: '8px 9px', background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.15)', borderRadius: '6px', color: '#00cc6a', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
            </div>

            {/* R:R preview */}
            {sl && tp && (
              <div style={{ padding: '6px 9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>R:R RATIO</span>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#e8c84a', fontFamily: 'monospace' }}>
                  1:{Math.abs((parseFloat(tp) - price) / (price - parseFloat(sl))).toFixed(1)}
                </span>
              </div>
            )}

            {/* Market price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '7px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>MARKET PRICE</span>
              <motion.span key={price} animate={{ color: priceDir === 'up' ? '#00ff88' : priceDir === 'down' ? '#ff4466' : '#e8c84a' }} style={{ fontSize: '16px', fontWeight: '800' }}>
                {price.toFixed(decimals)}
              </motion.span>
            </div>

            {/* Execute */}
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleExecute}
              style={{ width: '100%', padding: '14px', borderRadius: '9px', border: 'none', background: direction === 'long' ? 'linear-gradient(135deg, #009944, #00ff88)' : 'linear-gradient(135deg, #aa1133, #ff4466)', color: '#000', fontSize: '13px', fontWeight: '900', cursor: 'pointer', letterSpacing: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Zap size={12} />
              {direction === 'long' ? 'BUY LONG' : 'SELL SHORT'}
            </motion.button>
          </div>

          {/* Open positions */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginBottom: '10px' }}>
              OPEN POSITIONS {positions.length > 0 && <span style={{ color: '#e8c84a' }}>({positions.length})</span>}
            </p>
            {positions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.1)', fontSize: '11px', lineHeight: 1.7 }}>
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
                      style={{ background: profit ? 'rgba(0,255,136,0.04)' : 'rgba(255,68,102,0.04)', border: `1px solid ${profit ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)'}`, borderRadius: '10px', padding: '10px', marginBottom: '7px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                          <span style={{ fontSize: '8px', fontWeight: '800', padding: '2px 5px', borderRadius: '3px', background: pos.direction === 'long' ? 'rgba(0,255,136,0.15)' : 'rgba(255,68,102,0.15)', color: pos.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px' }}>
                            {pos.direction.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '700', color: '#d0d0d0' }}>{pos.asset.label}</span>
                        </div>
                        <motion.div animate={{ color }} style={{ fontSize: '13px', fontWeight: '900' }}>
                          {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        </motion.div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.18)', marginBottom: '1px' }}>ENTRY</div>
                          <div style={{ fontSize: '10px', fontWeight: '700', color: '#808080' }}>{pos.entry.toFixed(decimals)}</div>
                        </div>
                        {pos.sl && (
                          <div>
                            <div style={{ fontSize: '7px', color: '#ff6680', marginBottom: '1px' }}>SL</div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#ff6680' }}>{pos.sl.toFixed(decimals)}</div>
                          </div>
                        )}
                        {pos.tp && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '7px', color: '#00cc6a', marginBottom: '1px' }}>TP</div>
                            <div style={{ fontSize: '10px', fontWeight: '700', color: '#00cc6a' }}>{pos.tp.toFixed(decimals)}</div>
                          </div>
                        )}
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => handleClose(pos.id)}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,68,102,0.3)', background: 'rgba(255,68,102,0.08)', color: '#ff4466', fontSize: '10px', fontWeight: '800', cursor: 'pointer', letterSpacing: '1.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.18)'; e.currentTarget.style.borderColor = '#ff4466' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,68,102,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,68,102,0.3)' }}>
                        <X size={11} /> EXIT TRADE
                      </motion.button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── HISTORY ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: '160px', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d0d0d', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '5px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <span style={{ fontSize: '8px', fontWeight: '700', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>TRADE HISTORY</span>
                {history.length > 0 && (
                  <>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                      {history.length} trades
                    </span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                      Net: <span style={{ color: history.reduce((s, t) => s + t.pnl, 0) >= 0 ? '#00ff88' : '#ff4466', fontWeight: '700' }}>
                        {history.reduce((s, t) => s + t.pnl, 0) >= 0 ? '+' : ''}${history.reduce((s, t) => s + t.pnl, 0).toFixed(2)}
                      </span>
                    </span>
                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                      Win rate: <span style={{ color: '#e8c84a', fontWeight: '700' }}>
                        {Math.round(history.filter(t => t.pnl >= 0).length / history.length * 100)}%
                      </span>
                    </span>
                  </>
                )}
              </div>
              {history.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.1)', fontSize: '11px' }}>No closed trades yet.</div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr>{['ASSET','DIR','ENTRY','EXIT','P&L','TIME','NOTE',''].map(h => (
                        <th key={h} style={{ padding: '4px 12px', textAlign: 'left', fontSize: '8px', color: 'rgba(255,255,255,0.15)', letterSpacing: '1.5px', fontWeight: '700', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {history.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '5px 12px', color: '#c0c0c0', fontWeight: '700' }}>{t.asset.label}</td>
                          <td style={{ padding: '5px 12px' }}>
                            <span style={{ fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '3px', background: t.direction === 'long' ? 'rgba(0,255,136,0.12)' : 'rgba(255,68,102,0.12)', color: t.direction === 'long' ? '#00ff88' : '#ff4466', letterSpacing: '1px' }}>
                              {t.direction.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '5px 12px', color: 'rgba(255,255,255,0.3)' }}>{t.entry.toFixed(t.asset.pip < 0.001 ? 5 : 2)}</td>
                          <td style={{ padding: '5px 12px', color: 'rgba(255,255,255,0.3)' }}>{t.closePrice?.toFixed(t.asset.pip < 0.001 ? 5 : 2)}</td>
                          <td style={{ padding: '5px 12px', fontWeight: '800', color: t.pnl >= 0 ? '#00ff88' : '#ff4466' }}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</td>
                          <td style={{ padding: '5px 12px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{t.closedAt?.toLocaleTimeString()}</td>
                          <td style={{ padding: '5px 12px', color: 'rgba(255,100,100,0.5)', fontSize: '10px' }}>{t.autoClose ? '⚠ Risk limit' : ''}</td>
                          <td style={{ padding: '5px 12px' }}>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleLog(t)} disabled={loggedIds.has(t.id)}
                              style={{ padding: '2px 9px', borderRadius: '4px', background: loggedIds.has(t.id) ? 'rgba(0,255,136,0.08)' : 'rgba(232,200,74,0.08)', border: `1px solid ${loggedIds.has(t.id) ? 'rgba(0,255,136,0.2)' : 'rgba(232,200,74,0.2)'}`, color: loggedIds.has(t.id) ? '#00ff88' : '#e8c84a', fontSize: '9px', fontWeight: '700', cursor: loggedIds.has(t.id) ? 'default' : 'pointer', letterSpacing: '1px' }}>
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