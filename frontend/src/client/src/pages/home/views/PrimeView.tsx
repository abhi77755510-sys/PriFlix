import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface PrimeViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
    selectedLang?: string
}

export function PrimeView({ tmdb, mediaType, selectedLang = "all" }: PrimeViewProps) {
    // ── Dedicated Prime Video Fetchers ─────────────────────────────────────────
    const fetchPvTop10Tv = useCallback(() => {
        const params: any = { with_watch_providers: "9|119", watch_region: "IN", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    const fetchPvTop10Movies = useCallback(() => {
        const params: any = { with_watch_providers: "9|119", watch_region: "IN", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie(params)
    }, [tmdb, selectedLang])

    const fetchPvOriginals = useCallback(() => {
        const params: any = { with_networks: "1024", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    const fetchPvMalayalam = useCallback(() => {
        return tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", with_original_language: "ml", sort_by: "popularity.desc" })
    }, [tmdb])

    const fetchPvTamil = useCallback(() => {
        return tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", with_original_language: "ta", sort_by: "popularity.desc" })
    }, [tmdb])

    const fetchPvTelugu = useCallback(() => {
        return tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", with_original_language: "te", sort_by: "popularity.desc" })
    }, [tmdb])

    const fetchPvAction = useCallback(() => {
        const params: any = { with_watch_providers: "9|119", watch_region: "IN", with_genres: "28,12", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie(params)
    }, [tmdb, selectedLang])

    const fetchPvCrime = useCallback(() => {
        const params: any = { with_watch_providers: "9|119", watch_region: "IN", with_genres: "80,9648", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv(params)
    }, [tmdb, selectedLang])

    return (
        <div className="space-y-10 px-4 sm:px-8 pt-4 animate-in duration-500 fade-in bg-black">
            {/* Top 10 Series in Prime */}
            {(mediaType === "all" || mediaType === "tv") && (
                <Top10Rail
                    title="Top 10 Series in Prime"
                    fetcher={fetchPvTop10Tv}
                    type="tv"
                    themeStyle="prime"
                />
            )}

            {/* Top 10 Movies in Prime */}
            {(mediaType === "all" || mediaType === "movie") && (
                <Top10Rail
                    title="Top 10 Movies in Prime"
                    fetcher={fetchPvTop10Movies}
                    type="movie"
                    themeStyle="prime"
                />
            )}

            {/* Featured Amazon Originals */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Featured Amazon Originals"
                    fetcher={fetchPvOriginals}
                    type="tv"
                    badgeType="Recently added"
                />
            )}

            {/* Regional Cinema on Prime */}
            {selectedLang === "all" && (
                <>
                    <NetflixLandscapeRail
                        title="Top Malayalam Hits on Prime"
                        fetcher={fetchPvMalayalam}
                        type="movie"
                        badgeType="Recently added"
                    />
                    <NetflixLandscapeRail
                        title="Top Tamil Blockbusters on Prime"
                        fetcher={fetchPvTamil}
                        type="movie"
                        badgeType="Recently added"
                    />
                    <NetflixLandscapeRail
                        title="Top Telugu Hits on Prime"
                        fetcher={fetchPvTelugu}
                        type="movie"
                        badgeType="Recently added"
                    />
                </>
            )}

            {/* Action & Adventure Movies */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Action & Adventure Movies"
                    fetcher={fetchPvAction}
                    type="movie"
                    badgeType="Recently added"
                />
            )}

            {/* Crime & Mystery Series */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Crime & Mystery Series"
                    fetcher={fetchPvCrime}
                    type="tv"
                />
            )}
        </div>
    )
}
