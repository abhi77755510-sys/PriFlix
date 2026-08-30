import { BaseProvider } from '@omss/framework';
import type {
    ProviderCapabilities,
    ProviderMediaObject,
    ProviderResult,
    Source
} from '@omss/framework';

export class CineSuProvider extends BaseProvider {
    readonly id = 'cinesu';
    readonly name = 'CineSu Native (Glendale)';
    readonly enabled = true;
    readonly BASE_URL = 'https://cine.su';
    readonly CDN_URL = 'https://glendale-plumbing.com';

    readonly HEADERS = {
        'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://cine.su/',
        Origin: 'https://cine.su'
    };

    readonly capabilities: ProviderCapabilities = {
        supportedContentTypes: ['movies', 'tv']
    };

    async getMovieSources(media: ProviderMediaObject): Promise<ProviderResult> {
        return this.resolveStream(media);
    }

    async getTVSources(media: ProviderMediaObject): Promise<ProviderResult> {
        return this.resolveStream(media);
    }

    private async resolveStream(media: ProviderMediaObject): Promise<ProviderResult> {
        try {
            const mediaId = media.tmdbId || media.imdbId;
            const searchTitle = media.title || '';

            let internalId = '';

            // Query CineSu search endpoint if title is present
            if (searchTitle) {
                try {
                    const searchUrl = `${this.BASE_URL}/v1/search/${encodeURIComponent(searchTitle)}?lang=en`;
                    const sRes = await fetch(searchUrl, { headers: this.HEADERS });
                    if (sRes.ok) {
                        const sData = (await sRes.json()) as any;
                        const results = sData?.results || [];
                        const targetKind = media.type === 'tv' ? 'series' : 'movie';
                        const match = results.find(
                            (r: any) =>
                                r.kind === targetKind &&
                                ((media as any).year ? Math.abs(Number(r.year) - Number((media as any).year)) <= 1 : true)
                        ) || results[0];

                        if (match?.id) {
                            internalId = match.id;
                        }
                    }
                } catch {
                    // search fallback
                }
            }

            const candidateSlugs = [
                internalId,
                media.type === 'tv' ? `${mediaId}.${media.s}.${media.e}` : `${mediaId}`,
                media.imdbId
            ].filter(Boolean) as string[];

            const candidateUrls: string[] = [];
            for (const slug of candidateSlugs) {
                candidateUrls.push(
                    `${this.CDN_URL}/px/${slug}/${slug}/master.m3u8`,
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?cv=14`,
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?v=3`,
                    `${this.BASE_URL}/v1/stream/master/movie/${slug}.m3u8`
                );
            }

            const testPromises = candidateUrls.map(async (url) => {
                const ok = await this.testUrl(url);
                return ok ? url : null;
            });

            const results = await Promise.all(testPromises);
            const validUrl = results.find((u): u is string => u !== null);

            if (validUrl) {
                return this.buildSourcePayload(validUrl);
            }

            return this.emptyResult('Stream not found on CineSu / Glendale CDN');
        } catch (error) {
            return this.emptyResult(error instanceof Error ? error.message : 'Unknown CineSu Glendale error');
        }
    }

    private async testUrl(url: string): Promise<boolean> {
        try {
            const res = await fetch(url, {
                method: 'GET',
                headers: {
                    ...this.HEADERS,
                    Range: 'bytes=0-0'
                },
                signal: AbortSignal.timeout(1500)
            });
            return res.status === 200 || res.status === 206;
        } catch {
            return false;
        }
    }

    private buildSourcePayload(streamUrl: string): ProviderResult {
        const sources: Source[] = [
            {
                url: this.createProxyUrl(streamUrl, this.HEADERS),
                type: 'hls',
                quality: 'Auto',
                audioTracks: [
                    { label: 'Original / Multi-Audio', language: 'und' },
                    { label: 'Malayalam', language: 'ml' },
                    { label: 'Tamil', language: 'ta' },
                    { label: 'Telugu', language: 'te' },
                    { label: 'Hindi', language: 'hin' },
                    { label: 'English', language: 'eng' }
                ],
                provider: { id: this.id, name: this.name }
            }
        ];

        return { sources, subtitles: [], diagnostics: [] };
    }

    private emptyResult(message: string): ProviderResult {
        return {
            sources: [],
            subtitles: [],
            diagnostics: [{ code: 'PROVIDER_ERROR', message, field: '', severity: 'error' }]
        };
    }
}
