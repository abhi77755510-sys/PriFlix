import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { NetflixBillboard } from "@/components/media/HeroCarousel/NetflixBillboard"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface NetflixViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
}

export function NetflixView({ tmdb, mediaType }: NetflixViewProps) {
    // ── 1. Top 10 Series in Netflix Today ──────────────────────────────────────
    const fetchTop10Series = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 2. Top 10 Movies in Netflix Today ──────────────────────────────────────
    const fetchTop10Movies = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 3. Only on Netflix (Netflix Network Originals) ─────────────────────────
    const fetchOnlyOnNetflix = useCallback(
        () => tmdb.discover.tv({ with_networks: "213", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 4. TV Thrillers & Mysteries ────────────────────────────────────────────
    const fetchTvThrillers = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", with_genres: "9648,80", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 5. Binge-worthy US TV Action & Adventure ───────────────────────────────
    const fetchBingeAction = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", with_genres: "10759", with_origin_country: "US", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 6. New on Netflix (Recent Releases) ────────────────────────────────────
    const fetchNewOnNetflix = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 7. Series set in India (Netflix India Originals) ───────────────────────
    const fetchIndiaSeries = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", with_origin_country: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 8. Japanese TV Shows based on Manga / Anime ────────────────────────────
    const fetchAnimeManga = useCallback(
        () => tmdb.discover.tv({ with_genres: "16", with_origin_country: "JP", with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 9. Award-Winning Bingeworthy Crime TV Shows ────────────────────────────
    const fetchAwardCrime = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", with_genres: "80", sort_by: "vote_average.desc", "vote_count.gte": 100 }),
        [tmdb]
    )

    // ── 10. For the Love of Goth / Dark Fantasy ────────────────────────────────
    const fetchGothFantasy = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", with_genres: "10765,18", sort_by: "popularity.desc" }),
        [tmdb]
    )

    // ── 11. US Movies Dubbed in Hindi / Multilingual ───────────────────────────
    const fetchHindiDubbed = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "8", watch_region: "IN", with_origin_country: "US", sort_by: "popularity.desc" }),
        [tmdb]
    )

    return (
        <div className="space-y-8 animate-in duration-700 fade-in bg-black">
            {/* Netflix Hero Billboard */}
            <NetflixBillboard tmdb={tmdb} />

            <div className="space-y-10 px-4 sm:px-8 -mt-16 sm:-mt-24 relative z-20">
                {/* 1. Top 10 Series in Netflix Today */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <Top10Rail
                        title="Top 10 Series in Netflix Today"
                        fetcher={fetchTop10Series}
                        type="tv"
                        themeStyle="netflix"
                    />
                )}

                {/* 2. Top 10 Movies in Netflix Today */}
                {(mediaType === "all" || mediaType === "movie") && (
                    <Top10Rail
                        title="Top 10 Movies in Netflix Today"
                        fetcher={fetchTop10Movies}
                        type="movie"
                        themeStyle="netflix"
                    />
                )}

                {/* 3. TV Thrillers & Mysteries */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="TV Thrillers & Mysteries"
                        fetcher={fetchTvThrillers}
                        type="tv"
                        badgeType="Recently added"
                    />
                )}

                {/* 4. Only on Netflix */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Only on Netflix"
                        fetcher={fetchOnlyOnNetflix}
                        type="tv"
                        badgeType="New Season"
                    />
                )}

                {/* 5. Binge-worthy US TV Action & Adventure */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Binge-worthy US TV Action & Adventure"
                        fetcher={fetchBingeAction}
                        type="tv"
                        badgeType="New Episode"
                    />
                )}

                {/* 6. New on Netflix */}
                {(mediaType === "all" || mediaType === "movie") && (
                    <NetflixLandscapeRail
                        title="New on Netflix"
                        fetcher={fetchNewOnNetflix}
                        type="movie"
                        badgeType="Recently added"
                    />
                )}

                {/* 7. Series set in India */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Series set in India"
                        fetcher={fetchIndiaSeries}
                        type="tv"
                        badgeType="Recently added"
                    />
                )}

                {/* 8. Japanese TV Shows based on Manga */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Japanese TV Shows based on Manga"
                        fetcher={fetchAnimeManga}
                        type="tv"
                        badgeType="Recently added"
                    />
                )}

                {/* 9. Award-Winning Bingeworthy Crime TV Shows */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Award-Winning Bingeworthy Crime TV Shows"
                        fetcher={fetchAwardCrime}
                        type="tv"
                    />
                )}

                {/* 10. For the Love of Goth */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="For the Love of Goth"
                        fetcher={fetchGothFantasy}
                        type="tv"
                    />
                )}

                {/* 11. US Movies Dubbed in Hindi */}
                {(mediaType === "all" || mediaType === "movie") && (
                    <NetflixLandscapeRail
                        title="US Movies Dubbed in Hindi"
                        fetcher={fetchHindiDubbed}
                        type="movie"
                        badgeType="Recently added"
                    />
                )}
            </div>
        </div>
    )
}
