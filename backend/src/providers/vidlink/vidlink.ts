import { BaseProvider } from '@omss/framework';
import type {
    ProviderCapabilities,
    ProviderMediaObject,
    ProviderResult,
    Source,
    Subtitle
} from '@omss/framework';
import sodium from 'libsodium-wrappers';

export class VidLinkProvider extends BaseProvider {
    readonly id = 'vidlink';
    readonly name = 'VidLink (Decrypted)';
    readonly enabled = true;
    readonly BASE_URL = 'https://vidlink.pro';

    readonly HEADERS = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://vidlink.pro/',
        Origin: 'https://vidlink.pro'
    };

    readonly capabilities: ProviderCapabilities = {
        supportedContentTypes: ['movies', 'tv']
    };

    private wasmReady: Promise<void> | null = null;

    private async initWasm(): Promise<void> {
        if ((globalThis as any).getAdv) return;
        if (this.wasmReady) return this.wasmReady;

        this.wasmReady = (async () => {
            if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
                const { webcrypto } = await import('node:crypto');
                if (!globalThis.crypto) {
                    (globalThis as any).crypto = webcrypto as any;
                } else if (!globalThis.crypto.getRandomValues) {
                    (globalThis as any).crypto.getRandomValues = webcrypto.getRandomValues.bind(webcrypto);
                }
            }

            await sodium.ready;
            (globalThis as any).window = globalThis;
            (globalThis as any).sodium = sodium;
            (globalThis as any).document = {
                createElement: () => ({ appendChild: () => {} }),
                body: { appendChild: () => {} }
            };

            const scriptRes = await fetch(`${this.BASE_URL}/script.js`, {
                headers: this.HEADERS
            });
            const scriptCode = await scriptRes.text();

            const wasmRes = await fetch(`${this.BASE_URL}/fu.wasm`, {
                headers: this.HEADERS
            });
            const wasmBuf = await wasmRes.arrayBuffer();

            const runScript = new Function(scriptCode);
            runScript();

            const DmClass = (globalThis as any).Dm || (globalThis as any).Go;
            const dm = new DmClass();
            const webAssembly = (globalThis as any).WebAssembly;
            const { instance } = await webAssembly.instantiate(wasmBuf, dm.importObject);
            dm.run(instance);
        })().catch((err) => {
            this.wasmReady = null;
            throw err;
        });

        return this.wasmReady;
    }

    async getMovieSources(media: ProviderMediaObject): Promise<ProviderResult> {
        try {
            await this.initWasm();
            const tmdbId = String(media.tmdbId);
            const token = (globalThis as any).getAdv?.(tmdbId);
            if (!token) return this.emptyResult('Failed to generate VidLink token');

            const candidateUrls = [
                `${this.BASE_URL}/api/b/movie/${token}?multiLang=1`,
                `${this.BASE_URL}/api/b/movie/${token}`,
                `${this.BASE_URL}/api/b/movie/${tmdbId}?multiLang=1`,
                `${this.BASE_URL}/api/b/movie/${tmdbId}`
            ];

            let lastError = 'No data returned from VidLink';
            for (const apiUrl of candidateUrls) {
                try {
                    const apiRes = await fetch(apiUrl, {
                        headers: {
                            ...this.HEADERS,
                            Referer: `${this.BASE_URL}/movie/${tmdbId}`,
                            'X-Playback-Environment': 'hls'
                        }
                    });

                    if (apiRes.ok) {
                        const data = (await apiRes.json()) as any;
                        const result = this.parseStreamData(data);
                        if (result.sources.length > 0) {
                            return result;
                        }
                    }
                } catch (err: any) {
                    lastError = err?.message || lastError;
                }
            }

            return this.emptyResult(lastError);
        } catch (error) {
            return this.emptyResult(error instanceof Error ? error.message : 'VidLink Movie Error');
        }
    }

    async getTVSources(media: ProviderMediaObject): Promise<ProviderResult> {
        try {
            await this.initWasm();
            const tmdbId = String(media.tmdbId);
            const token = (globalThis as any).getAdv?.(tmdbId);
            if (!token) return this.emptyResult('Failed to generate VidLink token');

            const s = media.s ?? (media as any).seasonNumber ?? (media as any).season ?? 1;
            const e = media.e ?? (media as any).episodeNumber ?? (media as any).episode ?? 1;

            const candidateUrls = [
                `${this.BASE_URL}/api/b/tv/${token}/${s}/${e}?multiLang=1`,
                `${this.BASE_URL}/api/b/tv/${token}/${s}/${e}`,
                `${this.BASE_URL}/api/b/tv/${tmdbId}/${s}/${e}?multiLang=1`,
                `${this.BASE_URL}/api/b/tv/${tmdbId}/${s}/${e}`
            ];

            let lastError = 'No data returned from VidLink TV';
            for (const apiUrl of candidateUrls) {
                try {
                    const apiRes = await fetch(apiUrl, {
                        headers: {
                            ...this.HEADERS,
                            Referer: `${this.BASE_URL}/tv/${tmdbId}/${s}/${e}`,
                            'X-Playback-Environment': 'hls'
                        }
                    });

                    if (apiRes.ok) {
                        const data = (await apiRes.json()) as any;
                        const result = this.parseStreamData(data);
                        if (result.sources.length > 0) {
                            return result;
                        }
                    }
                } catch (err: any) {
                    lastError = err?.message || lastError;
                }
            }

            return this.emptyResult(lastError);
        } catch (error) {
            return this.emptyResult(error instanceof Error ? error.message : 'VidLink TV Error');
        }
    }

    private parseStreamData(data: any): ProviderResult {
        const stream = data?.stream;
        if (!stream) return this.emptyResult('No stream object in VidLink response');

        const sources: Source[] = [];
        const subtitles: Subtitle[] = [];

        const streamHeaders: Record<string, string> = {
            ...this.HEADERS,
            ...(stream.playlistHeaders || {}),
            ...(stream.headers || {})
        };

        // 1. Parse HLS playlist if available
        if (stream.playlist) {
            const resLabel = stream.playbackMetadata?.resolutions?.[0]
                ? `${stream.playbackMetadata.resolutions[0]}p`
                : '1080p';

            sources.push({
                url: this.createProxyUrl(stream.playlist, streamHeaders),
                quality: resLabel,
                type: 'hls',
                audioTracks: [
                    { label: 'Original / Multi-Audio', language: 'und' },
                    { label: 'English', language: 'eng' }
                ],
                provider: { id: this.id, name: this.name }
            });
        }

        // 2. Parse direct MP4 qualities (e.g. 1080p, 720p, 480p, 360p)
        if (stream.qualities && typeof stream.qualities === 'object') {
            const entries = Object.entries(stream.qualities as Record<string, any>);
            
            // Prefer h264 streams to avoid black screen / unsupported HEVC codec errors on desktop browsers
            const h264Entries = entries.filter(([_, q]) => q?.codecName?.toLowerCase() === 'h264');
            const targetEntries = h264Entries.length > 0 ? h264Entries : entries;

            // Sort qualities descending (1080 -> 720 -> 480 -> 360)
            targetEntries.sort((a, b) => {
                const numA = parseInt(a[0]) || 0;
                const numB = parseInt(b[0]) || 0;
                return numB - numA;
            });

            for (const [qualityKey, qData] of targetEntries) {
                if (qData?.url) {
                    const formattedQuality = qualityKey.toLowerCase().endsWith('p')
                        ? qualityKey
                        : `${qualityKey}p`;

                    const codecLabel = qData.codecName ? ` (${qData.codecName.toUpperCase()})` : '';

                    sources.push({
                        url: qData.url,
                        quality: `${formattedQuality}${codecLabel}`,
                        type: 'mp4',
                        audioTracks: [
                            { label: 'Original', language: 'und' },
                            { label: 'English', language: 'eng' }
                        ],
                        provider: { id: this.id, name: this.name }
                    });
                }
            }
        }

        // 3. Parse captions / subtitles
        if (Array.isArray(stream.captions)) {
            for (const cap of stream.captions) {
                if (cap.url && cap.language) {
                    subtitles.push({
                        url: this.createProxyUrl(cap.url),
                        label: cap.language,
                        format: cap.type === 'vtt' ? 'vtt' : 'srt'
                    });
                }
            }
        }

        if (sources.length === 0) {
            return this.emptyResult('No playable sources found in VidLink stream data');
        }

        return { sources, subtitles, diagnostics: [] };
    }

    private emptyResult(message: string): ProviderResult {
        return {
            sources: [],
            subtitles: [],
            diagnostics: [{ code: 'PROVIDER_ERROR', message, field: '', severity: 'error' }]
        };
    }
}

export default VidLinkProvider;
