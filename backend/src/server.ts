import { OMSSServer, SourceService } from '@omss/framework';
import 'dotenv/config';

const PROVIDER_PRIORITY: Record<string, number> = {
    fsharetv: 1,
    fshare: 1,
    cinesu: 2,
    vidlink: 3,
    vidnest: 4
};

// Per-provider timeout in ms — CineSu needs more time for search+discovery
const PROVIDER_TIMEOUTS: Record<string, number> = {
    cinesu: 25000,
    vidlink: 20000,
    vidnest: 20000,
    fsharetv: 15000,
    fshare: 15000
};
const DEFAULT_PROVIDER_TIMEOUT = 20000;

function sortSourcesByPriority(sources: any[]): any[] {
    return [...sources].sort((a, b) => {
        const pA = PROVIDER_PRIORITY[a.provider?.id?.toLowerCase()] ?? 99;
        const pB = PROVIDER_PRIORITY[b.provider?.id?.toLowerCase()] ?? 99;
        return pA - pB;
    });
}

if (SourceService && SourceService.prototype) {
    (SourceService.prototype as any).validateSourceUrl = async function (proxyData: any, timeoutMs = 4000) {
        if (!proxyData || !proxyData.url) return true;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const reqHeaders: Record<string, string> = { ...(proxyData.headers ?? {}) };
            reqHeaders['Range'] = 'bytes=0-0';
            const res = await fetch(proxyData.url, {
                method: 'GET',
                headers: reqHeaders,
                signal: controller.signal
            });
            if (res.ok || res.status === 206 || res.status === 429) {
                return true;
            }
            return false;
        } catch {
            return false;
        } finally {
            clearTimeout(timeout);
        }
    };

    // Patch fetchFromProviders to add per-provider timeouts
    const originalFetchFromProviders = (SourceService.prototype as any).fetchFromProviders;
    (SourceService.prototype as any).fetchFromProviders = async function (type: string, media: any) {
        const providers = this.registry.getProviders();
        if (providers.length === 0) {
            console.warn('[SourceService] No providers registered');
            return [];
        }
        let supportedProviders = providers
            .filter((p: any) => p.capabilities.supportedContentTypes.includes(type === 'movie' ? 'movies' : 'tv'))
            .filter((p: any) => p.enabled);

        const targetProvider = (media?.providerId || media?.provider || media?.server || '').toString().toLowerCase().trim();
        if (targetProvider && targetProvider !== 'auto' && targetProvider !== 'all') {
            const filtered = supportedProviders.filter((p: any) => {
                const pid = (p.id || '').toLowerCase();
                const pname = (p.name || '').toLowerCase();
                return pid === targetProvider || pname.includes(targetProvider) || targetProvider.includes(pid);
            });
            if (filtered.length > 0) {
                supportedProviders = filtered;
            }
        }

        console.log(`[SourceService] Fetching from ${supportedProviders.length} provider(s) (${providers.length - supportedProviders.length} filtered out)`);

        const promises = supportedProviders.map(async (provider: any) => {
            const providerId = (provider.id || '').toLowerCase();
            const timeoutMs = PROVIDER_TIMEOUTS[providerId] ?? DEFAULT_PROVIDER_TIMEOUT;
            const startTime = Date.now();

            try {
                const providerPromise = type === 'movie'
                    ? provider.getMovieSources(media)
                    : provider.getTVSources(media);

                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Provider '${provider.name}' timed out after ${timeoutMs}ms`)), timeoutMs)
                );

                let result: any = await Promise.race([providerPromise, timeoutPromise]);

                // Validate sources (lightweight parallel validation)
                if (process.env.NODE_ENV?.toLowerCase() !== 'test') {
                    const { ProxyService } = await import('@omss/framework').catch(() => ({ ProxyService: null })) as any;
                    if (ProxyService) {
                        const validatedSources = await Promise.allSettled(
                            result.sources.map(async (source: any) => {
                                try {
                                    const urlObj = new URL(source.url);
                                    const data = urlObj.searchParams.get('data');
                                    if (!data) return null;
                                    const proxyData = ProxyService.decodeProxyData(data);
                                    const isValid = await this.validateSourceUrl(proxyData);
                                    return isValid ? source : null;
                                } catch {
                                    return null;
                                }
                            })
                        );
                        result.sources = validatedSources
                            .filter((r: any) => r.status === 'fulfilled')
                            .map((r: any) => r.value)
                            .filter(Boolean);
                    }
                }

                const duration = Date.now() - startTime;
                console.log(`[SourceService] Provider '${provider.name}' returned ${result.sources.length} source(s) in ${duration}ms`);
                return result;
            } catch (error) {
                const duration = Date.now() - startTime;
                const msg = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[SourceService] Provider '${provider.name}' failed in ${duration}ms:`, msg);
                return { sources: [], subtitles: [], diagnostics: [{ code: 'PROVIDER_ERROR', message: msg, field: '', severity: 'error' }] };
            }
        });

        const results = await Promise.allSettled(promises);
        return results.filter((r: any) => r.status === 'fulfilled').map((r: any) => r.value);
    };

    const originalGetMovieSources = SourceService.prototype.getMovieSources;
    SourceService.prototype.getMovieSources = async function (...args: any[]) {
        const start = Date.now();
        try {
            const res = await (originalGetMovieSources as any).apply(this, args);
            const duration = Date.now() - start;
            let sources = res?.sources || [];
            sources = sortSourcesByPriority(sources);
            if (res) res.sources = sources;

            const providerCounts: Record<string, number> = {};
            sources.forEach((s: any) => {
                const id = s.provider?.id || s.provider?.name || 'Unknown';
                providerCounts[id] = (providerCounts[id] || 0) + 1;
            });
            const succeededCount = Object.keys(providerCounts).length;
            const selfAny = this as any;
            const totalProviders = selfAny.registry?.getEnabledProviders()?.length ?? 4;
            let bestProvider = 'None';
            let maxCount = 0;
            for (const [pname, count] of Object.entries(providerCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    bestProvider = pname;
                }
            }
            console.log(`[SourceService] Summary: ${succeededCount}/${totalProviders} providers succeeded, ${sources.length} sources total, best provider: ${bestProvider} (${duration}ms)`);
            return res;
        } catch (err) {
            const duration = Date.now() - start;
            console.log(`[SourceService] Summary: 0 providers succeeded, 0 sources total (${duration}ms)`);
            throw err;
        }
    };

    const originalGetTVSources = SourceService.prototype.getTVSources;
    SourceService.prototype.getTVSources = async function (...args: any[]) {
        const start = Date.now();
        try {
            const res = await (originalGetTVSources as any).apply(this, args);
            const duration = Date.now() - start;
            let sources = res?.sources || [];
            sources = sortSourcesByPriority(sources);
            if (res) res.sources = sources;

            const providerCounts: Record<string, number> = {};
            sources.forEach((s: any) => {
                const id = s.provider?.id || s.provider?.name || 'Unknown';
                providerCounts[id] = (providerCounts[id] || 0) + 1;
            });
            const succeededCount = Object.keys(providerCounts).length;
            const selfAny = this as any;
            const totalProviders = selfAny.registry?.getEnabledProviders()?.length ?? 4;
            let bestProvider = 'None';
            let maxCount = 0;
            for (const [pname, count] of Object.entries(providerCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    bestProvider = pname;
                }
            }
            console.log(`[SourceService] Summary: ${succeededCount}/${totalProviders} providers succeeded, ${sources.length} sources total, best provider: ${bestProvider} (${duration}ms)`);
            return res;
        } catch (err) {
            const duration = Date.now() - start;
            console.log(`[SourceService] Summary: 0 providers succeeded, 0 sources total (${duration}ms)`);
            throw err;
        }
    };
}

const BYPASS_PROXY_DOMAINS = [
    'vsembed.ru',
    'vidsrc.to',
    'vidsrc.me',
    'vidsrc.dev',
    'videasy.net',
    'vixsrc.to',
    'multiembed.mov',
    'cine.su',
    'glendale-plumbing.com',
    'netrocdn.site',
    'vidlink.pro',
    'hakunaymatata.com'
];

// Intercept and proxy TMDB API requests if TMDB_BASE_URL is configured
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: any, init?: any) {
    let url = '';
    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof URL) {
        url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as any).url;
    }

    const tmdbBaseUrl = process.env.TMDB_BASE_URL;
    if (tmdbBaseUrl && url && (url.includes('api.themoviedb.org') || url.includes('themoviedb.org'))) {
        const baseUrlClean = tmdbBaseUrl.endsWith('/') ? tmdbBaseUrl.slice(0, -1) : tmdbBaseUrl;
        const targetBase = baseUrlClean.endsWith('/3') ? baseUrlClean : `${baseUrlClean}/3`;
        const newUrl = url.replace(/https?:\/\/api\.themoviedb\.org(\/3)?/, targetBase);
        if (typeof input === 'string') {
            input = newUrl;
        } else if (input instanceof URL) {
            input = new URL(newUrl);
        } else if (input && typeof input === 'object' && 'url' in input) {
            const reqInit: any = {
                method: input.method,
                headers: input.headers,
                body: input.body,
                credentials: input.credentials,
                mode: input.mode
            };
            input = new Request(newUrl, reqInit);
        }
    }

    return originalFetch.call(this, input, init);
};
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { Readable, pipeline } from 'node:stream';
import { knownThirdPartyProxies } from './thirdPartyProxies.js';
import { streamPatterns } from './streamPatterns.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const streamSessionCache = new Map<string, { baseUrl: string; headers: Record<string, string>; timestamp: number }>();
let lastActiveStreamBaseUrl = '';
let lastActiveStreamHeaders: Record<string, string> = {};

function rewriteM3u8Manifest(manifestText: string, targetUrl: string, headers: Record<string, string>, proxyBaseUrl: string): string {
    const origin = new URL(targetUrl).origin;
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

    const makeAbsolute = (uri: string) => {
        if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
        if (uri.startsWith('/')) return new URL(uri, origin).toString();
        return new URL(uri, baseUrl).toString();
    };

    return manifestText
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return line;

            if (trimmed.startsWith('#EXT')) {
                return trimmed.replace(/URI="([^"]+)"/g, (_, uri) => {
                    const absoluteUri = makeAbsolute(uri);
                    const proxyData = encodeURIComponent(JSON.stringify({ url: absoluteUri, headers }));
                    return `URI="${proxyBaseUrl}/v1/proxy?data=${proxyData}"`;
                });
            }

            if (trimmed.startsWith('#')) {
                return line;
            }

            const absoluteUrl = makeAbsolute(trimmed);
            const proxyData = encodeURIComponent(JSON.stringify({ url: absoluteUrl, headers }));
            return `${proxyBaseUrl}/v1/proxy?data=${proxyData}`;
        })
        .join('\n');
}

async function handleSegmentFetch(segName: string, rangeHeader: string | undefined, reply: any): Promise<boolean> {
    const session = streamSessionCache.get(segName) || (lastActiveStreamBaseUrl ? { baseUrl: lastActiveStreamBaseUrl, headers: lastActiveStreamHeaders, timestamp: Date.now() } : null);
    if (!session) return false;

    try {
        const targetUrl = new URL(segName, session.baseUrl).toString();
        const cleanHeaders: Record<string, string> = { ...session.headers };
        if (rangeHeader) {
            cleanHeaders['range'] = rangeHeader;
        }

        let segmentRes = await fetch(targetUrl, { headers: cleanHeaders });
        if (segmentRes.status === 403 && (cleanHeaders.Referer || cleanHeaders.referer || cleanHeaders.Origin || cleanHeaders.origin)) {
            const noRefHeaders = { ...cleanHeaders };
            delete noRefHeaders.Referer;
            delete noRefHeaders.referer;
            delete noRefHeaders.Origin;
            delete noRefHeaders.origin;
            const retryRes = await fetch(targetUrl, { headers: noRefHeaders });
            if (retryRes.ok) {
                segmentRes = retryRes;
            }
        }
        const contentType = segmentRes.headers.get('content-type') || 'video/MP2T';
        const contentRange = segmentRes.headers.get('content-range');
        const acceptRanges = segmentRes.headers.get('accept-ranges');
        const contentLength = segmentRes.headers.get('content-length');

        const respHeaders: Record<string, string> = {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*'
        };
        if (contentRange) respHeaders['Content-Range'] = contentRange;
        if (acceptRanges) respHeaders['Accept-Ranges'] = acceptRanges;
        if (contentLength) respHeaders['Content-Length'] = contentLength;

        reply.hijack();
        reply.raw.writeHead(segmentRes.status, respHeaders);

        if (segmentRes.body) {
            const stream = Readable.fromWeb(segmentRes.body as any);
            pipeline(stream, reply.raw, () => { });
            return true;
        }

        const arrayBuf = await segmentRes.arrayBuffer();
        reply.raw.end(Buffer.from(arrayBuf));
        return true;
    } catch {
        return false;
    }
}

async function main() {
    const configuredPublicUrl = process.env.VITE_OMSS_API_URL?.replace(/\/+$/, '');
    const server = new OMSSServer({
        name: 'CinePro',
        version: '1.0.0',

        // Network
        host: process.env.HOST ?? (process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'),
        port: Number(process.env.PORT ?? 3000),
        publicUrl: configuredPublicUrl ?? (process.env.NODE_ENV === 'production' || process.env.RENDER ? 'https://pri-flix-backend.onrender.com' : undefined),

        // Cache (memory for dev, Redis for prod)
        cache: {
            type: (process.env.CACHE_TYPE as 'memory' | 'redis') ?? 'memory',
            ttl: {
                sources: 60 * 60,
                subtitles: 60 * 60 * 24
            },
            redis: {
                host: process.env.REDIS_HOST ?? 'localhost',
                port: Number(process.env.REDIS_PORT ?? 6379),
                password: process.env.REDIS_PASSWORD
            }
        },

        // TMDB
        tmdb: {
            apiKey: process.env.TMDB_API_KEY!,
            cacheTTL: 24 * 60 * 60 // 24h
        },

        // Third Party Proxy removal
        proxyConfig: {
            knownThirdPartyProxies: knownThirdPartyProxies,
            streamPatterns
        },

        cors: {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Requested-With'],
            exposedHeaders: ['Content-Range', 'Accept-Ranges', 'ETag'],
            credentials: true,
            preflightContinue: false,
            optionsSuccessStatus: 204
        },

        stremio: {
            enableNativeAddon: process.env.STREMIO_ADDON === 'true',
            stremioAddons: []
        },

        mcp: {
            enabled: process.env.MCP_ENABLED === 'true'
        }
    });

    const app = server.getInstance();

    // Hook onto Fastify /v1/proxy requests to 302 redirect if encoded headers are empty,
    // or rewrite HLS .m3u8 manifests and stream protected .ts/.m4s segments
    app.addHook('onRequest', async (request, reply) => {
        if (request.url.startsWith('/v1/proxy')) {
            const queryUrl = new URL(request.url, 'http://localhost');
            const dataParam = queryUrl.searchParams.get('data');
            if (dataParam) {
                try {
                    const decoded = JSON.parse(decodeURIComponent(dataParam));
                    const headers = decoded.headers || {};
                    const targetUrl = decoded.url;

                    reply.hijack();

                    const cleanHeaders: Record<string, string> = { ...headers };
                    delete cleanHeaders.host;
                    delete cleanHeaders.connection;

                    if (request.headers.range) {
                        cleanHeaders['range'] = request.headers.range;
                    }

                    const isM3u8 = targetUrl.includes('.m3u8') || targetUrl.includes('playlist') || targetUrl.includes('getm3u8');

                    if (Object.keys(headers).length === 0 && !isM3u8) {
                        const isVidLinkMp4 = targetUrl.includes('hakunaymatata.com') || targetUrl.includes('vidlink');
                        if (!isVidLinkMp4) {
                            reply.raw.writeHead(302, {
                                Location: targetUrl,
                                'Access-Control-Allow-Origin': '*'
                            });
                            reply.raw.end();
                            return;
                        }
                    }

                    if (isM3u8) {
                        lastActiveStreamBaseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
                        lastActiveStreamHeaders = cleanHeaders;

                        const manifestRes = await fetch(targetUrl, { headers: cleanHeaders });
                        if (manifestRes.ok) {
                            const rawText = await manifestRes.text();
                            const hostHeader = request.headers.host || 'localhost:3000';
                            const protocol = request.protocol || 'http';
                            const proxyBaseUrl = `${protocol}://${hostHeader}`;

                            // Index all segments into streamSessionCache
                            const lines = rawText.split('\n');
                            for (const line of lines) {
                                const trimmed = line.trim();
                                if (trimmed && !trimmed.startsWith('#')) {
                                    const segName = trimmed.split('?')[0].split('/').pop() || trimmed;
                                    streamSessionCache.set(segName, {
                                        baseUrl: lastActiveStreamBaseUrl,
                                        headers: cleanHeaders,
                                        timestamp: Date.now()
                                    });
                                }
                            }

                            const rewritten = rewriteM3u8Manifest(rawText, targetUrl, headers, proxyBaseUrl);

                            reply.raw.writeHead(200, {
                                'Content-Type': 'application/vnd.apple.mpegurl',
                                'Cache-Control': 'no-cache, no-store, must-revalidate',
                                Pragma: 'no-cache',
                                Expires: '0',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                                'Access-Control-Allow-Headers': '*'
                            });
                            reply.raw.end(rewritten);
                            return;
                        }
                    }

                    // For video segments (.ts, .m4s, .mp4, page-*.html) with custom session cookies/headers:
                    let segmentRes = await fetch(targetUrl, { headers: cleanHeaders });
                    if (segmentRes.status === 403 && (cleanHeaders.Referer || cleanHeaders.referer || cleanHeaders.Origin || cleanHeaders.origin)) {
                        const noRefHeaders = { ...cleanHeaders };
                        delete noRefHeaders.Referer;
                        delete noRefHeaders.referer;
                        delete noRefHeaders.Origin;
                        delete noRefHeaders.origin;
                        const retryRes = await fetch(targetUrl, { headers: noRefHeaders });
                        if (retryRes.ok) {
                            segmentRes = retryRes;
                        }
                    }
                    const contentType = segmentRes.headers.get('content-type') || 'video/MP2T';
                    const contentRange = segmentRes.headers.get('content-range');
                    const acceptRanges = segmentRes.headers.get('accept-ranges');
                    const contentLength = segmentRes.headers.get('content-length');

                    const respHeaders: Record<string, string> = {
                        'Content-Type': contentType,
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, OPTIONS',
                        'Access-Control-Allow-Headers': '*'
                    };
                    if (contentRange) respHeaders['Content-Range'] = contentRange;
                    if (acceptRanges) respHeaders['Accept-Ranges'] = acceptRanges;
                    if (contentLength) respHeaders['Content-Length'] = contentLength;

                    reply.raw.writeHead(segmentRes.status, respHeaders);

                    if (segmentRes.body) {
                        const stream = Readable.fromWeb(segmentRes.body as any);
                        pipeline(stream, reply.raw, () => { });
                        return;
                    }

                    const arrayBuf = await segmentRes.arrayBuffer();
                    reply.raw.end(Buffer.from(arrayBuf));
                    return;
                } catch {
                    // ignore
                }
            }
        } else if (request.url.startsWith('/m/v1/')) {
            reply.hijack();
            try {
                const targetUrl = `https://glendale-plumbing.com${request.url}`;
                const cleanHeaders: Record<string, string> = {
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    Referer: 'https://cine.su/',
                    Origin: 'https://cine.su'
                };
                if (request.headers.range) {
                    cleanHeaders['range'] = request.headers.range;
                }

                const segRes = await fetch(targetUrl, { headers: cleanHeaders });
                const contentType = segRes.headers.get('content-type') || 'video/mp4';
                const contentRange = segRes.headers.get('content-range');
                const acceptRanges = segRes.headers.get('accept-ranges');
                const contentLength = segRes.headers.get('content-length');

                const respHeaders: Record<string, string> = {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': '*'
                };
                if (contentRange) respHeaders['Content-Range'] = contentRange;
                if (acceptRanges) respHeaders['Accept-Ranges'] = acceptRanges;
                if (contentLength) respHeaders['Content-Length'] = contentLength;

                reply.raw.writeHead(segRes.status, respHeaders);
                if (segRes.body) {
                    const stream = Readable.fromWeb(segRes.body as any);
                    pipeline(stream, reply.raw, () => { });
                    return;
                }
                const arrayBuf = await segRes.arrayBuffer();
                reply.raw.end(Buffer.from(arrayBuf));
            } catch {
                reply.raw.writeHead(500);
                reply.raw.end('Glendale segment fetch failed');
            }
            return;
        } else if (request.url.startsWith('/subtitles/')) {
            reply.hijack();
            try {
                const targetUrl = `https://glendale-plumbing.com${request.url}`;
                const subRes = await fetch(targetUrl, {
                    headers: {
                        'User-Agent':
                            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                        Referer: 'https://cine.su/',
                        Origin: 'https://cine.su'
                    }
                });

                const contentType = subRes.headers.get('content-type') || 'text/vtt';
                reply.raw.writeHead(subRes.status, {
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=14400'
                });
                const arrayBuf = await subRes.arrayBuffer();
                reply.raw.end(Buffer.from(arrayBuf));
            } catch {
                reply.raw.writeHead(500);
                reply.raw.end('Subtitle fetch failed');
            }
            return;
        } else if (
            request.url.startsWith('/v1/') &&
            !request.url.startsWith('/v1/movies') &&
            !request.url.startsWith('/v1/tv') &&
            !request.url.startsWith('/v1/cache') &&
            !request.url.startsWith('/v1/health')
        ) {
            const rawPath = request.url.replace('/v1/', '').split('?')[0];
            const segName = rawPath.split('/').pop() || rawPath;
            if (
                segName.endsWith('.ts') ||
                segName.endsWith('.m4s') ||
                segName.endsWith('.mp4') ||
                segName.endsWith('.key')
            ) {
                const handled = await handleSegmentFetch(segName, request.headers.range, reply);
                if (handled) return;
            }
        }
    });

    // Register Cache Clear endpoints (Issue 3)
    const cacheInstance = (server as any).cache;
    app.get('/v1/cache/clear', async (request, reply) => {
        try {
            if (cacheInstance && typeof cacheInstance.clear === 'function') {
                await cacheInstance.clear();
                return reply.send({ success: true, message: 'Entire memory cache cleared' });
            }
            return reply.status(500).send({ success: false, error: 'Cache service clear method not available' });
        } catch (error) {
            return reply.status(500).send({ success: false, error: (error as Error).message });
        }
    });

    app.get('/v1/cache/clear/:type/:id', async (request, reply) => {
        const { type, id } = request.params as { type: string; id: string };
        const key = `${type}:${id}`;
        try {
            if (cacheInstance && typeof cacheInstance.delete === 'function') {
                await cacheInstance.delete(key);
                return reply.send({ success: true, message: `Cache key '${key}' cleared` });
            }
            return reply.status(500).send({ success: false, error: 'Cache service delete method not available' });
        } catch (error) {
            return reply.status(500).send({ success: false, error: (error as Error).message });
        }
    });

    // Register providers
    const registry = server.getRegistry();
    await registry.discoverProviders(path.join(__dirname, './providers/'));

    await server.start();

    const publicUrl =
        configuredPublicUrl ??
        `http://${process.env.HOST ?? 'localhost'}:${process.env.PORT ?? 3000}`;

    const uiUrl = `https://ui.cinepro.cc/?omssurl=${encodeURIComponent(publicUrl)}`;

    const title = '🚀 CinePro/ui is in public testing';
    const contrib =
        '🤝 We are looking for contributors to improve and develop!';
    const repo = 'Contribute: https://github.com/cinepro-org/ui';
    const tryIt = `🌐 Try it out: ${uiUrl} !`;
    const note =
        'You will need to give the website "access to local applications" that it works.';

    const lines = [title, '', repo, '', contrib, '', tryIt, '', note];

    // compute box width based on longest line
    const width = Math.max(...lines.map((l) => l.length)) + 2;

    const borderTop = '╭' + '─'.repeat(width) + '╮';
    const borderBottom = '╰' + '─'.repeat(width) + '╯';

    const pad = (line: string) => '│ ' + line.padEnd(width - 2, ' ') + ' │';

    console.log(`
================== CINEPRO BETA ANNOUNCEMENT ==================

${borderTop}
${lines.map(pad).join('\n')}
${borderBottom}
`);
}

main().catch(() => {
    process.exit(1);
});
