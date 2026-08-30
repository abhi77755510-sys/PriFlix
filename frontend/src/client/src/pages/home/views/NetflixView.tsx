import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { NetflixBillboard } from "@/components/media/HeroCarousel/NetflixBillboard"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface NetflixViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
    selectedLang?: string
}

export function NetflixView({ tmdb, mediaType, selectedLang = "all" }: NetflixViewProps) {
    // ── 1. Top 10 Series in Netflix Today ──────────────────────────────────────
    const fetchTop10Series = useCallback(() => {
        const params: any = { with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    // ── 2. Top 10 Movies in Netflix Today ──────────────────────────────────────
    const fetchTop10Movies = useCallback(() => {
        const params: any = { with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie(params)
    }, [tmdb, selectedLang])

    // ── 3. Only on Netflix (Netflix Network Originals) ─────────────────────────
    const fetchOnlyOnNetflix = useCallback(() => {
        const params: any = { with_networks: "213", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    // ── 4. TV Thrillers & Mysteries ────────────────────────────────────────────
    const fetchTvThrillers = useCallback(() => {
        const params: any = { with_watch_providers: "8", watch_region: "IN", with_genres: "9648,80", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    // ── 5. Binge-worthy US TV Action & Adventure ───────────────────────────────
    const fetchBingeAction = useCallback(() => {
        const params: any = { with_watch_providers: "8", watch_region: "IN", with_genres: "10759", with_origin_country: "US", sort_by: "popularity.desc" }
        return tmdb.discover.tv(params)
    }, [tmdb])

    // ── 6. New on Netflix (Latest Additions) ───────────────────────────────────
    const fetchNewOnNetflix = useCallback(() => {
        const params: any = { with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie(params)
    }, [tmdb, selectedLang])

    // ── 7. Series set in India (Netflix India Originals) ───────────────────────
    const fetchIndiaSeries = useCallback(() => {
        const params: any = { with_watch_providers: "8", watch_region: "IN", with_origin_country: "IN", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    // ── 8. Regional South Cinema (Tamil & Malayalam & Telugu) ──────────────────
    const fetchTamilCinema = useCallback(() => {
        return tmdb.discover.movie({ with_watch_providers: "8", watch_region: "IN", with_original_language: "ta", sort_by: "popularity.desc" })
    }, [tmdb])

    const fetchMalayalamCinema = useCallback(() => {
        return tmdb.discover.movie({ with_watch_providers: "8", watch_region: "IN", with_original_language: "ml", sort_by: "popularity.desc" })
    }, [tmdb])

    const fetchTeluguCinema = useCallback(() => {
        return tmdb.discover.movie({ with_watch_providers: "8", watch_region: "IN", with_original_language: "te", sort_by: "popularity.desc" })
    }, [tmdb])

    // ── 9. Japanese TV Shows based on Manga / Anime ────────────────────────────
    const fetchAnimeManga = useCallback(() => {
        return tmdb.discover.tv({ with_genres: "16", with_origin_country: "JP", with_watch_providers: "8", watch_region: "IN", sort_by: "popularity.desc" })
    }, [tmdb])

    // ── 10. Award-Winning Bingeworthy Crime TV Shows ───────────────────────────
    const fetchAwardCrime = useCallback(() => {
        return tmdb.discover.tv({ with_watch_providers: "8", watch_region: "IN", with_genres: "80", sort_by: "vote_average.desc", "vote_count.gte": 100 })
    }, [tmdb])

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

                {/* 3. New on Netflix */}
                {(mediaType === "all" || mediaType === "movie") && (
                    <NetflixLandscapeRail
                        title="New on Netflix"
                        fetcher={fetchNewOnNetflix}
                        type="movie"
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

                {/* 5. TV Thrillers & Mysteries */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="TV Thrillers & Mysteries"
                        fetcher={fetchTvThrillers}
                        type="tv"
                        badgeType="Recently added"
                    />
                )}

                {/* 6. Binge-worthy US TV Action & Adventure */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Binge-worthy US TV Action & Adventure"
                        fetcher={fetchBingeAction}
                        type="tv"
                        badgeType="New Episode"
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

                {/* 8. Regional South Cinema: Malayalam, Tamil, Telugu */}
                {selectedLang === "all" && (
                    <>
                        <NetflixLandscapeRail
                            title="Top Malayalam Cinema on Netflix"
                            fetcher={fetchMalayalamCinema}
                            type="movie"
                            badgeType="Recently added"
                        />
                        <NetflixLandscapeRail
                            title="Top Tamil Blockbusters on Netflix"
                            fetcher={fetchTamilCinema}
                            type="movie"
                            badgeType="Recently added"
                        />
                        <NetflixLandscapeRail
                            title="Top Telugu Hits on Netflix"
                            fetcher={fetchTeluguCinema}
                            type="movie"
                            badgeType="Recently added"
                        />
                    </>
                )}

                {/* 9. Japanese TV Shows based on Manga */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Japanese TV Shows based on Manga"
                        fetcher={fetchAnimeManga}
                        type="tv"
                        badgeType="Recently added"
                    />
                )}

                {/* 10. Award-Winning Bingeworthy Crime TV Shows */}
                {(mediaType === "all" || mediaType === "tv") && (
                    <NetflixLandscapeRail
                        title="Award-Winning Bingeworthy Crime TV Shows"
                        fetcher={fetchAwardCrime}
                        type="tv"
                    />
                )}
            </div>
        </div>
    )
}
