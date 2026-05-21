import { useEffect, useRef } from 'react'

export default function CandleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

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

    let candles = generateCandles(100)
    let offset = 0
    let animId

    function draw() {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#08080A'
      ctx.fillRect(0, 0, W, H)

      ctx.strokeStyle = 'rgba(255,209,102,0.03)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        ctx.beginPath()
        ctx.moveTo(0, H / 10 * i)
        ctx.lineTo(W, H / 10 * i)
        ctx.stroke()
      }

      const visible = candles.slice(Math.floor(offset), Math.floor(offset) + 60)
      const cw = W / 60
      const pad = cw * 0.28
      const prices = visible.flatMap(c => [c.high, c.low])
      const minP = Math.min(...prices)
      const maxP = Math.max(...prices)
      const range = maxP - minP || 1
      const py = p => H * 0.06 + (1 - (p - minP) / range) * H * 0.88

      visible.forEach((c, i) => {
        const x = i * cw + cw / 2
        const isGreen = c.close >= c.open
        const alpha = 0.09 + (i / visible.length) * 0.07
        const bTop = py(Math.max(c.open, c.close))
        const bBot = py(Math.min(c.open, c.close))
        const bH = Math.max(bBot - bTop, 1.5)

        ctx.strokeStyle = isGreen ? `rgba(6,214,160,${alpha + 0.05})` : `rgba(239,71,111,${alpha + 0.05})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, py(c.high))
        ctx.lineTo(x, py(c.low))
        ctx.stroke()

        ctx.fillStyle = isGreen ? `rgba(6,214,160,${alpha})` : `rgba(239,71,111,${alpha})`
        ctx.fillRect(x - cw / 2 + pad, bTop, cw - pad * 2, bH)
      })

      const grad = ctx.createLinearGradient(0, H * 0.5, 0, H)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(1, 'rgba(255,209,102,0.025)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, H)
    }

    function animate() {
      offset += 0.006
      if (offset + 60 >= candles.length) {
        const last = candles[candles.length - 1]
        const body = (Math.random() - 0.49) * 18
        const open = last.close
        const close = open + body
        candles.push({
          open, close,
          high: Math.max(open, close) + Math.random() * 12,
          low: Math.min(open, close) - Math.random() * 12
        })
        if (candles.length > 250) { candles.shift(); offset-- }
      }
      draw()
      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
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
        pointerEvents: 'none'
      }}
    />
  )
}