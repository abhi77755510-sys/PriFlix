import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface PrimeViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
}

export function PrimeView({ tmdb, mediaType }: PrimeViewProps) {
    // ── Dedicated Prime Video Fetchers ─────────────────────────────────────────
    const fetchPvTop10Tv = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "9|119", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPvTop10Movies = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPvOriginals = useCallback(
        () => tmdb.discover.tv({ with_networks: "1024", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPvAction = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", with_genres: "28,12", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPvCrime = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "9|119", watch_region: "IN", with_genres: "80,9648", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPvRomance = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", with_genres: "10749", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPvComedy = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "9|119", watch_region: "IN", with_genres: "35", sort_by: "popularity.desc" }),
        [tmdb]
    )

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

            {/* Romance Movies on Prime */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Romance Movies on Prime"
                    fetcher={fetchPvRomance}
                    type="movie"
                />
            )}

            {/* Comedy Movies on Prime */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Comedy Hits on Prime"
                    fetcher={fetchPvComedy}
                    type="movie"
                />
            )}
        </div>
    )
}
