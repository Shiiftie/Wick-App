import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export default function NewsPage() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: false,
      width: '100%',
      height: '100%',
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: 'us,eu,gb,jp,au,ca,ch,cn,nz'
    })

    const widget = document.createElement('div')
    widget.className = 'tradingview-widget-container__widget'
    widget.style.height = '100%'
    widget.style.width = '100%'

    containerRef.current.appendChild(widget)
    containerRef.current.appendChild(script)
  }, [])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '2px' }}>Economic Calendar</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Major news events that move the market. Know before you trade.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {[
            { color: '#ff4466', label: 'High Impact' },
            { color: '#ff8c00', label: 'Medium Impact' },
            { color: '#e8c84a', label: 'Low Impact' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        flex: 1,
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#131722'
      }}>
        <div ref={containerRef} className="tradingview-widget-container" style={{ height: '100%', width: '100%' }} />
      </div>

      <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px', marginTop: '8px' }}>
        Calendar powered by <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', textDecoration: 'none' }}>TradingView</a>
      </p>
    </motion.div>
  )
}