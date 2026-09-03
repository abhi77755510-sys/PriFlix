const RENDER_ORIGIN = 'https://pri-flix-backend.onrender.com'
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': 'Content-Length,Content-Range,Accept-Ranges,Content-Type'
}

type ProxyData = {
  url?: string
  headers?: Record<string, string>
}

function withCors(headers: HeadersInit = {}) {
  const result = new Headers(headers)
  for (const [key, value] of Object.entries(CORS_HEADERS)) result.set(key, value)
  return result
}

function isManifest(url: string) {
  const lower = url.toLowerCase()
  return lower.includes('.m3u8') || lower.includes('playlist') || lower.includes('getm3u8')
}

function decodeProxyData(value: string): ProxyData {
  try {
    return JSON.parse(value)
  } catch {
    return JSON.parse(decodeURIComponent(value))
  }
}

function makeProxyUrl(workerOrigin: string, url: string, headers: Record<string, string>) {
  const data = encodeURIComponent(JSON.stringify({ url, headers }))
  return `${workerOrigin}/v1/proxy?data=${data}`
}

function rewriteManifest(text: string, targetUrl: string, headers: Record<string, string>, workerOrigin: string) {
  const target = new URL(targetUrl)
  const baseUrl = targetUrl.slice(0, targetUrl.lastIndexOf('/') + 1)
  const absoluteUrl = (value: string) => {
    if (/^https?:\/\//i.test(value)) return value
    if (value.startsWith('/')) return new URL(value, target.origin).toString()
    return new URL(value, baseUrl).toString()
  }

  return text.split('\n').map((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#EXT-X-VERSION')) return line
    if (trimmed.startsWith('#')) {
      return line.replace(/URI="([^"]+)"/g, (_, uri) =>
        `URI="${makeProxyUrl(workerOrigin, absoluteUrl(uri), headers)}"`)
    }
    return makeProxyUrl(workerOrigin, absoluteUrl(trimmed), headers)
  }).join('\n')
}

async function proxyStream(request: Request, workerOrigin: string) {
  const dataParam = new URL(request.url).searchParams.get('data')
  if (!dataParam) return new Response('Missing proxy data', { status: 400, headers: withCors() })

  let data: ProxyData
  try {
    data = decodeProxyData(dataParam)
  } catch {
    return new Response('Invalid proxy data', { status: 400, headers: withCors() })
  }

  if (!data.url) return new Response('Missing target URL', { status: 400, headers: withCors() })

  const targetHeaders = new Headers(data.headers || {})
  targetHeaders.delete('host')
  targetHeaders.delete('connection')
  if (request.headers.has('range')) targetHeaders.set('range', request.headers.get('range')!)

  const targetResponse = await fetch(data.url, {
    method: request.method,
    headers: targetHeaders,
    redirect: 'follow'
  })

  if (isManifest(data.url) && targetResponse.ok) {
    const manifest = rewriteManifest(await targetResponse.text(), data.url, Object.fromEntries(targetHeaders), workerOrigin)
    return new Response(manifest, {
      status: 200,
      headers: withCors({
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store'
      })
    })
  }

  const responseHeaders = withCors(targetResponse.headers)
  responseHeaders.delete('set-cookie')
  return new Response(targetResponse.body, {
    status: targetResponse.status,
    statusText: targetResponse.statusText,
    headers: responseHeaders
  })
}

async function proxyApi(request: Request, workerOrigin: string) {
  const incoming = new URL(request.url)
  const pathname = `/${incoming.pathname.replace(/^\/+/, '')}`
  const upstream = new URL(`${pathname}${incoming.search}`, RENDER_ORIGIN)
  const response = await fetch(upstream, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body
  })

  if (!response.headers.get('content-type')?.includes('application/json')) {
    return new Response(response.body, { status: response.status, headers: withCors(response.headers) })
  }

  const text = await response.text()
  const rewritten = text.replaceAll(RENDER_ORIGIN, workerOrigin).replaceAll('https://priflix-backend.onrender.com', workerOrigin)
  return new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers: withCors({ 'Content-Type': 'application/json' })
  })
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const pathname = `/${url.pathname.replace(/^\/+/, '')}`
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: withCors() })

    try {
      if (pathname === '/v1/proxy') return await proxyStream(request, url.origin)
      return await proxyApi(request, url.origin)
    } catch (error) {
      console.error(error)
      return new Response('Upstream request failed', { status: 502, headers: withCors() })
    }
  }
}
