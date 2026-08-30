import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface SonyLivViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
    selectedLang?: string
}

export function SonyLivView({ tmdb, mediaType, selectedLang = "all" }: SonyLivViewProps) {
    // ── Dedicated SonyLIV Fetchers ─────────────────────────────────────────────
    const fetchSonyLivTv = useCallback(
        () => {
            const params: any = { with_networks: "1720", sort_by: "popularity.desc" }
            if (selectedLang !== "all") params.with_original_language = selectedLang
            return tmdb.discover.tv(params)
        },
        [tmdb, selectedLang]
    )

    const fetchSonyLivMovies = useCallback(
        () => {
            const params: any = { with_watch_providers: "237", watch_region: "IN", sort_by: "popularity.desc" }
            if (selectedLang !== "all") params.with_original_language = selectedLang
            return tmdb.discover.movie(params)
        },
        [tmdb, selectedLang]
    )

    const fetchSonyCrimeThrillers = useCallback(
        () => {
            const params: any = { with_networks: "1720", with_genres: "80,9648", sort_by: "popularity.desc" }
            if (selectedLang !== "all") params.with_original_language = selectedLang
            return tmdb.discover.tv(params)
        },
        [tmdb, selectedLang]
    )

    const fetchSonyRegionalHits = useCallback(
        () => {
            const params: any = { with_watch_providers: "237", watch_region: "IN", with_origin_country: "IN", sort_by: "popularity.desc" }
            if (selectedLang !== "all") params.with_original_language = selectedLang
            return tmdb.discover.movie(params)
        },
        [tmdb, selectedLang]
    )

    return (
        <div className="space-y-10 px-4 sm:px-8 pt-4 animate-in duration-500 fade-in bg-black">
            {/* Top 10 Series on SonyLIV */}
            {(mediaType === "all" || mediaType === "tv") && (
                <Top10Rail
                    title="Top 10 Shows on SonyLIV"
                    fetcher={fetchSonyLivTv}
                    type="tv"
                    themeStyle="prime"
                />
            )}

            {/* Top Movies on SonyLIV */}
            {(mediaType === "all" || mediaType === "movie") && (
                <Top10Rail
                    title="Top Movies on SonyLIV"
                    fetcher={fetchSonyLivMovies}
                    type="movie"
                    themeStyle="prime"
                />
            )}

            {/* SonyLIV Crime & Thrillers */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="SonyLIV Crime Thrillers & Dramas"
                    fetcher={fetchSonyCrimeThrillers}
                    type="tv"
                    badgeType="Recently added"
                />
            )}

            {/* Indian Regional Blockbusters */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Indian Regional Hits on SonyLIV"
                    fetcher={fetchSonyRegionalHits}
                    type="movie"
                    badgeType="New Season"
                />
            )}
        </div>
    )
}
