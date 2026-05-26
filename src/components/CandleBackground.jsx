import { useEffect, useRef } from 'react'

export default function CandleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: false })

    // ── CONFIG ──────────────────────────────────────────────
    const VISIBLE_CANDLES = 60            // candles shown at once
    const MAX_CANDLES = 250               // ring buffer size
    const SCROLL_SPEED = 0.96             // candles per second

    // ── DPI HANDLING ────────────────────────────────────────
    // Cap at 2x — on 3x retina laptops drawing 9x more pixels destroys
    // framerate for no visible quality gain on a faint background.
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let cssW = 0, cssH = 0

    const resize = () => {
      // Fallback to documentElement if window.innerWidth returns 0 on mount
      cssW = window.innerWidth || document.documentElement.clientWidth
      cssH = window.innerHeight || document.documentElement.clientHeight
      // Bail if we still got 0 — try again next frame
      if (cssW === 0 || cssH === 0) return
      canvas.width = cssW * dpr
      canvas.height = cssH * dpr
      canvas.style.width = cssW + 'px'
      canvas.style.height = cssH + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    // Force a second resize after first paint cycle in case the first
    // ran before the DOM was fully laid out (fixes the intermittent
    // "background doesn't show on refresh" bug)
    requestAnimationFrame(resize)
    window.addEventListener('resize', resize)

    // ── CANDLE DATA ─────────────────────────────────────────
    function generateCandles(count) {
      const candles = []
      let price = 4480
      let trend = 0
      for (let i = 0; i < count; i++) {
        if (Math.random() < 0.05) trend = (Math.random() - 0.5) * 2
        const body = (Math.random() - 0.48 + trend * 0.08) * 20
        const open = price
        const close = price + body
        const high = Math.max(open, close) + Math.random() * 14
        const low = Math.min(open, close) - Math.random() * 14
        candles.push({ open, high, low, close })
        price = close
      }
      return candles
    }

    const candles = generateCandles(100)
    let offset = 0
    let lastFrame = performance.now()
    let animId = 0

    // ── CACHED PRICE RANGE ──────────────────────────────────
    let cachedRangeStart = -1
    let cachedMin = 0
    let cachedMax = 0

    function updateRange(startIdx) {
      if (startIdx === cachedRangeStart) return
      let lo = Infinity, hi = -Infinity
      const end = Math.min(startIdx + VISIBLE_CANDLES, candles.length)
      for (let i = startIdx; i < end; i++) {
        const c = candles[i]
        if (c.high > hi) hi = c.high
        if (c.low  < lo) lo = c.low
      }
      cachedMin = lo
      cachedMax = hi
      cachedRangeStart = startIdx
    }

    // ── DRAW ────────────────────────────────────────────────
    function draw() {
      // Skip rendering if canvas isn't sized yet
      if (cssW === 0 || cssH === 0) return

      const W = cssW
      const H = cssH

      ctx.fillStyle = '#08080A'
      ctx.fillRect(0, 0, W, H)

      // Grid lines — batched into a single path
      ctx.strokeStyle = 'rgba(255,209,102,0.03)'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let i = 0; i <= 10; i++) {
        const y = (H / 10) * i + 0.5
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()

      const startIdx = Math.floor(offset)
      updateRange(startIdx)

      const cw = W / VISIBLE_CANDLES
      const pad = cw * 0.28
      const range = cachedMax - cachedMin || 1
      const topMargin = H * 0.06
      const drawableH = H * 0.88
      const py = p => topMargin + (1 - (p - cachedMin) / range) * drawableH

      const frac = offset - startIdx
      const slideX = -frac * cw

      const end = Math.min(startIdx + VISIBLE_CANDLES, candles.length)
      for (let i = startIdx; i < end; i++) {
        const c = candles[i]
        const localI = i - startIdx
        const x = localI * cw + cw / 2 + slideX
        const isGreen = c.close >= c.open
        const alpha = 0.09 + (localI / VISIBLE_CANDLES) * 0.07

        const openY = py(c.open)
        const closeY = py(c.close)
        const bTop = openY < closeY ? openY : closeY
        const bBot = openY < closeY ? closeY : openY
        const bH = bBot - bTop < 1.5 ? 1.5 : bBot - bTop

        ctx.strokeStyle = isGreen
          ? `rgba(6,214,160,${alpha + 0.05})`
          : `rgba(239,71,111,${alpha + 0.05})`
        ctx.beginPath()
        ctx.moveTo(x, py(c.high))
        ctx.lineTo(x, py(c.low))
        ctx.stroke()

        ctx.fillStyle = isGreen
          ? `rgba(6,214,160,${alpha})`
          : `rgba(239,71,111,${alpha})`
        ctx.fillRect(x - cw / 2 + pad, bTop, cw - pad * 2, bH)
      }

      // Bottom gold gradient
      const grad = ctx.createLinearGradient(0, H * 0.5, 0, H)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, 'rgba(255,209,102,0.025)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    // ── ANIMATION LOOP (framerate-independent) ──────────────
    function animate(now) {
      const dtSec = Math.min((now - lastFrame) / 1000, 0.05)
      lastFrame = now

      offset += SCROLL_SPEED * dtSec
      cachedRangeStart = -1

      if (offset + VISIBLE_CANDLES >= candles.length - 1) {
        const last = candles[candles.length - 1]
        const body = (Math.random() - 0.49) * 18
        const open = last.close
        const close = open + body
        candles.push({
          open,
          close,
          high: Math.max(open, close) + Math.random() * 12,
          low: Math.min(open, close) - Math.random() * 12,
        })
        if (candles.length > MAX_CANDLES) {
          candles.shift()
          offset -= 1
        }
      }

      draw()
      animId = requestAnimationFrame(animate)
    }

    const onVisibility = () => {
      if (!document.hidden) lastFrame = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    animId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}