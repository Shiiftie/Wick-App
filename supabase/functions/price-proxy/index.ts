// Supabase Edge Function: price-proxy
// Deploy with: supabase functions deploy price-proxy

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const YAHOO_MAP: Record<string, string> = {
  'FX:EURUSD': 'EURUSD=X', 'FX:GBPUSD': 'GBPUSD=X',
  'FX:USDJPY': 'JPY=X',    'FX:AUDUSD': 'AUDUSD=X',
  'FX:USDCAD': 'CAD=X',    'FX:USDCHF': 'CHF=X',
  'NASDAQ:AAPL': 'AAPL',   'NASDAQ:TSLA': 'TSLA',
  'NASDAQ:NVDA': 'NVDA',   'CME_MINI:ES1!': 'ES=F',
  'CME_MINI:NQ1!': 'NQ=F', 'AMEX:SPY': 'SPY',
}

const BINANCE_MAP: Record<string, string> = {
  'BINANCE:BTCUSDT': 'BTCUSDT',
  'BINANCE:ETHUSDT': 'ETHUSDT',
  'BINANCE:SOLUSDT': 'SOLUSDT',
  'BINANCE:XRPUSDT': 'XRPUSDT',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const url = new URL(req.url)
  const symbol = url.searchParams.get('symbol')
  if (!symbol) return new Response(JSON.stringify({ error: 'missing symbol' }), { status: 400, headers: CORS })

  try {
    // Crypto via Binance
    const binanceTicker = BINANCE_MAP[symbol]
    if (binanceTicker) {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceTicker}`)
      const data = await res.json()
      const price = parseFloat(data.price)
      return new Response(JSON.stringify({ price, symbol }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    // Stocks & Forex via Yahoo Finance
    const yticker = YAHOO_MAP[symbol]
    if (yticker) {
      const res = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yticker}?interval=1m&range=1d`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      )
      const data = await res.json()
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (!price) throw new Error('no price')
      return new Response(JSON.stringify({ price, symbol }), {
        headers: { ...CORS, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'unknown symbol' }), { status: 404, headers: CORS })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS })
  }
})