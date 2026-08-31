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
        Origin: 'https://cine.su',
        Accept: 'application/json, text/plain, */*'
    };

    readonly capabilities: ProviderCapabilities = {
        supportedContentTypes: ['movies', 'tv']
    };

    async getMovieSources(media: ProviderMediaObject): Promise<ProviderResult> {
        return this.resolveStream(media, 'movie');
    }

    async getTVSources(media: ProviderMediaObject): Promise<ProviderResult> {
        return this.resolveStream(media, 'tv');
    }

    private async resolveStream(
        media: ProviderMediaObject,
        type: 'movie' | 'tv'
    ): Promise<ProviderResult> {
        try {
            let searchTitle = media.title || '';
            let originalTitle = '';
            const mediaId = media.tmdbId || media.imdbId;

            // Step 1: Always pre-fetch TMDB metadata to guarantee title, originalTitle, and release year
            if (media.tmdbId) {
                const tmdbKey = process.env.TMDB_API_KEY || '9eb3a7c1ff650a61c2ed464854b58694';
                const endpoint = type === 'tv' ? 'tv' : 'movie';
                const tmdbUrls = [
                    `https://api.tmdb.org/3/${endpoint}/${media.tmdbId}?api_key=${tmdbKey}`,
                    `https://api.themoviedb.org/3/${endpoint}/${media.tmdbId}?api_key=${tmdbKey}`
                ];

                for (const url of tmdbUrls) {
                    try {
                        const tmdbRes = await fetch(url, {
                            headers: {
                                'User-Agent':
                                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                            },
                            signal: AbortSignal.timeout(6000)
                        });
                        if (tmdbRes.ok) {
                            const tmdbData = (await tmdbRes.json()) as any;
                            if (!searchTitle) {
                                searchTitle = tmdbData.title || tmdbData.name || tmdbData.original_title || '';
                            }
                            originalTitle = tmdbData.original_title || tmdbData.original_name || '';
                            if (!(media as any).year) {
                                const dateStr = tmdbData.release_date || tmdbData.first_air_date || '';
                                if (dateStr) (media as any).year = parseInt(dateStr.slice(0, 4)) || undefined;
                            }
                            break;
                        }
                    } catch {
                        // Mirror error — try next
                    }
                }
            }

            let hash = '';

            // Step 2: Search CineSu by title to get 8-char internal hash
            // Try multiple title variants to improve match rate for regional films
            const titlesToTry = [searchTitle, originalTitle].filter(
                (t, idx, arr) => t && arr.indexOf(t) === idx
            );

            for (const titleAttempt of titlesToTry) {
                if (hash) break;
                try {
                    const searchUrl = `${this.BASE_URL}/v1/search/${encodeURIComponent(titleAttempt)}?lang=en`;
                    const sRes = await fetch(searchUrl, {
                        headers: this.HEADERS,
                        signal: AbortSignal.timeout(10000)
                    });
                    if (sRes.ok) {
                        const sData = (await sRes.json()) as any;
                        const results = sData?.results || [];
                        const targetKind = type === 'tv' ? 'series' : 'movie';
                        const match =
                            results.find(
                                (r: any) =>
                                    r.kind === targetKind &&
                                    ((media as any).year
                                        ? Math.abs(Number(r.year) - Number((media as any).year)) <= 1
                                        : true)
                            ) ||
                            results.find((r: any) => r.kind === targetKind) ||
                            results[0];

                        if (match?.id) {
                            hash = match.id;
                        }
                    }
                } catch {
                    // Search endpoint error / timeout — try next title variant
                }
            }

            // Fallback: accept mediaId as hash ONLY if it's NOT a purely numeric string (CineSu hashes are alphanumeric, e.g. 79y3rqre)
            if (!hash && typeof mediaId === 'string' && /^[a-z0-9]{6,10}$/i.test(mediaId) && !/^\d+$/.test(mediaId)) {
                hash = mediaId;
            }

            if (!hash) {
                return this.emptyResult('Could not find content hash on CineSu');
            }

            const season = media.s ?? (media as any).seasonNumber ?? (media as any).season ?? 1;
            const episode = media.e ?? (media as any).episodeNumber ?? (media as any).episode ?? 1;
            const slug = type === 'tv' ? `${hash}.${season}.${episode}` : hash;

            // Step 3: Call Glendale master discovery endpoint (/c/v1/{slug}/master.m3u8?cv=14)
            let masterUrl = '';
            let detectedLangs: string[] = [];
            let verticalQuality = '1080p';

            try {
                const c14Url = `${this.CDN_URL}/c/v1/${slug}/master.m3u8?cv=14`;
                const cRes = await fetch(c14Url, {
                    headers: this.HEADERS,
                    signal: AbortSignal.timeout(8000)
                });
                if (cRes.ok) {
                    const text = await cRes.text();
                    try {
                        const cData = JSON.parse(text);
                        // Pick the first source with a direct URL (state=full preferred)
                        const sources = cData?.sources || [];
                        const mainSource =
                            sources.find((s: any) => s.direct && s.url && s.type === 'hls') ||
                            sources.find((s: any) => s.url) ||
                            sources[0];
                        if (mainSource?.url) {
                            masterUrl = mainSource.url;
                            if (Array.isArray(mainSource.languages)) {
                                detectedLangs = mainSource.languages;
                            }
                            if (mainSource.quality?.vertical_equivalent) {
                                verticalQuality = `${mainSource.quality.vertical_equivalent}p`;
                            }
                        }
                    } catch {
                        if (text.includes('#EXTM3U')) {
                            masterUrl = c14Url;
                        }
                    }
                }
            } catch {
                // Discovery endpoint failed
            }

            // Step 4: Fallback probing if discovery endpoint didn't return masterUrl
            if (!masterUrl) {
                const candidateUrls = [
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?v=3`,
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?v=7`,
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?v=1`,
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?v=2`,
                    `${this.CDN_URL}/m/v1/${slug}/master.m3u8?v=14`,
                    `${this.CDN_URL}/px/${slug}/${slug}/master.m3u8`,
                    `${this.BASE_URL}/v1/stream/master/movie/${slug}.m3u8`
                ];

                const probePromises = candidateUrls.map(async (candidateUrl) => {
                    try {
                        const pRes = await fetch(candidateUrl, {
                            method: 'GET',
                            headers: {
                                ...this.HEADERS,
                                Range: 'bytes=0-0'
                            },
                            signal: AbortSignal.timeout(2000)
                        });
                        if (pRes.status === 200 || pRes.status === 206) {
                            return candidateUrl;
                        }
                    } catch {
                        // Timeout/error
                    }
                    return null;
                });

                // Wait for all and pick first success
                const probeResults = await Promise.allSettled(probePromises);
                masterUrl = probeResults
                    .filter((r): r is PromiseFulfilledResult<string | null> => r.status === 'fulfilled')
                    .map(r => r.value)
                    .find((u): u is string => u !== null) || '';
            }

            if (!masterUrl) {
                return this.emptyResult('Glendale master m3u8 stream resolution failed');
            }

            // Step 5: Build source payload with multi-audio track metadata
            const audioTracks = this.buildAudioTracks(detectedLangs);

            const sources: Source[] = [
                {
                    url: this.createProxyUrl(masterUrl, this.HEADERS),
                    type: 'hls',
                    quality: verticalQuality,
                    audioTracks,
                    provider: { id: this.id, name: this.name }
                }
            ];

            return { sources, subtitles: [], diagnostics: [] };
        } catch (error) {
            return this.emptyResult(
                error instanceof Error ? error.message : 'Unknown CineSu Glendale error'
            );
        }
    }

    private buildAudioTracks(detectedLangs: string[]) {
        const langMap: Record<string, string> = {
            ml: 'Malayalam',
            ta: 'Tamil',
            te: 'Telugu',
            hi: 'Hindi',
            kn: 'Kannada',
            en: 'English',
            it: 'Italian',
            es: 'Spanish',
            fr: 'French'
        };

        const tracks = [{ label: 'Original / Multi-Audio', language: 'und' }];

        for (const lang of detectedLangs) {
            const code = lang.toLowerCase();
            if (code !== 'und' && code !== 'orig') {
                tracks.push({
                    label: langMap[code] || lang.toUpperCase(),
                    language: code
                });
            }
        }

        if (tracks.length === 1) {
            tracks.push(
                { label: 'Malayalam', language: 'ml' },
                { label: 'Tamil', language: 'ta' },
                { label: 'Telugu', language: 'te' },
                { label: 'Hindi', language: 'hin' },
                { label: 'English', language: 'eng' }
            );
        }

        return tracks;
    }

    private emptyResult(message: string): ProviderResult {
        return {
            sources: [],
            subtitles: [],
            diagnostics: [{ code: 'PROVIDER_ERROR', message, field: '', severity: 'error' }]
        };
    }
}
