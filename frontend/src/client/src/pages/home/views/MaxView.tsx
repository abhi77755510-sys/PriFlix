import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface MaxViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
}

export function MaxView({ tmdb, mediaType }: MaxViewProps) {
    // ── Dedicated Max / HBO Fetchers ───────────────────────────────────────────
    const fetchHboSeries = useCallback(
        () => tmdb.discover.tv({ with_networks: "49|8304|3186", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchMaxMovies = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "384|1899", watch_region: "US", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchWarnerBros = useCallback(
        () => tmdb.discover.movie({ with_companies: "174", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchDcUniverse = useCallback(
        () => tmdb.discover.movie({ with_companies: "429|9993", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchHboAwardWinners = useCallback(
        () => tmdb.discover.tv({ with_networks: "49", sort_by: "vote_average.desc", "vote_count.gte": 150 }),
        [tmdb]
    )

    return (
        <div className="space-y-10 px-4 sm:px-8 pt-4 animate-in duration-500 fade-in bg-black">
            {/* Top 10 Series on HBO Max */}
            {(mediaType === "all" || mediaType === "tv") && (
                <Top10Rail
                    title="Top 10 Series on Max"
                    fetcher={fetchHboSeries}
                    type="tv"
                    themeStyle="prime"
                />
            )}

            {/* Top Movies on Max */}
            {(mediaType === "all" || mediaType === "movie") && (
                <Top10Rail
                    title="Top Blockbuster Movies on Max"
                    fetcher={fetchMaxMovies}
                    type="movie"
                    themeStyle="prime"
                />
            )}

            {/* HBO Original Series */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="HBO Iconic Original Series"
                    fetcher={fetchHboSeries}
                    type="tv"
                    badgeType="Recently added"
                />
            )}

            {/* Warner Bros Pictures */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Warner Bros. Pictures"
                    fetcher={fetchWarnerBros}
                    type="movie"
                    badgeType="Recently added"
                />
            )}

            {/* DC Universe */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="DC Universe Movies & Series"
                    fetcher={fetchDcUniverse}
                    type="movie"
                />
            )}

            {/* Award-Winning HBO Classics */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Award-Winning HBO Masterpieces"
                    fetcher={fetchHboAwardWinners}
                    type="tv"
                />
            )}
        </div>
    )
}
