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
        })();

        return this.wasmReady;
    }

    async getMovieSources(media: ProviderMediaObject): Promise<ProviderResult> {
        try {
            await this.initWasm();
            const tmdbId = String(media.tmdbId);
            const token = (globalThis as any).getAdv(tmdbId);
            if (!token) return this.emptyResult('Failed to generate VidLink token');

            const apiUrl = `${this.BASE_URL}/api/b/movie/${token}?multiLang=1`;
            const apiRes = await fetch(apiUrl, {
                headers: {
                    ...this.HEADERS,
                    Referer: `${this.BASE_URL}/movie/${tmdbId}`,
                    'X-Playback-Environment': 'hls'
                }
            });

            if (!apiRes.ok) return this.emptyResult(`VidLink API failed with status ${apiRes.status}`);
            const data = (await apiRes.json()) as any;
            return this.parseStreamData(data);
        } catch (error) {
            return this.emptyResult(error instanceof Error ? error.message : 'VidLink Movie Error');
        }
    }

    async getTVSources(media: ProviderMediaObject): Promise<ProviderResult> {
        try {
            await this.initWasm();
            const tmdbId = String(media.tmdbId);
            const token = (globalThis as any).getAdv(tmdbId);
            if (!token) return this.emptyResult('Failed to generate VidLink token');

            const s = media.s ?? (media as any).seasonNumber ?? (media as any).season ?? 1;
            const e = media.e ?? (media as any).episodeNumber ?? (media as any).episode ?? 1;

            const apiUrl = `${this.BASE_URL}/api/b/tv/${token}/${s}/${e}?multiLang=1`;
            const apiRes = await fetch(apiUrl, {
                headers: {
                    ...this.HEADERS,
                    Referer: `${this.BASE_URL}/tv/${tmdbId}/${s}/${e}`,
                    'X-Playback-Environment': 'hls'
                }
            });

            if (!apiRes.ok) return this.emptyResult(`VidLink TV API failed with status ${apiRes.status}`);
            const data = (await apiRes.json()) as any;
            return this.parseStreamData(data);
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

        // Parse HLS playlist if available
        if (stream.playlist) {
            const resLabel = stream.playbackMetadata?.resolutions?.[0]
                ? `${stream.playbackMetadata.resolutions[0]}p`
                : 'Auto';

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

        // Parse direct qualities (e.g. 1080p, 720p, 480p, 360p)
        if (stream.qualities && typeof stream.qualities === 'object') {
            for (const [qualityKey, qData] of Object.entries(stream.qualities as Record<string, any>)) {
                if (qData?.url) {
                    const qHeaders: Record<string, string> = {
                        ...this.HEADERS,
                        ...(qData.headers || {})
                    };

                    sources.push({
                        url: this.createProxyUrl(qData.url, qHeaders),
                        quality: `${qualityKey}p`,
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

        // Parse captions / subtitles
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
