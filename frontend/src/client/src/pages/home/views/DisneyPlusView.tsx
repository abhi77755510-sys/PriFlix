import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface DisneyPlusViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
}

export function DisneyPlusView({ tmdb, mediaType }: DisneyPlusViewProps) {
    // ── Dedicated Disney+ Global Fetchers ──────────────────────────────────────
    const fetchDpTop10Movies = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "337", watch_region: "US", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchDpTop10Tv = useCallback(
        () => tmdb.discover.tv({ with_watch_providers: "337", watch_region: "US", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchDpOriginals = useCallback(
        () => tmdb.discover.tv({ with_networks: "2739", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchDpMarvel = useCallback(
        () => tmdb.discover.movie({ with_companies: "420", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchDpStarWars = useCallback(
        () => tmdb.discover.movie({ with_companies: "1", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchDpPixar = useCallback(
        () => tmdb.discover.movie({ with_companies: "3", sort_by: "popularity.desc" }),
        [tmdb]
    )

    return (
        <div className="space-y-10 px-4 sm:px-8 pt-4 animate-in duration-500 fade-in bg-black">
            {/* Top 10 on Disney+ */}
            {(mediaType === "all" || mediaType === "movie") && (
                <Top10Rail
                    title="Top 10 on Disney+ Today"
                    fetcher={fetchDpTop10Movies}
                    type="movie"
                    themeStyle="disney"
                />
            )}

            {(mediaType === "all" || mediaType === "tv") && (
                <Top10Rail
                    title="Top 10 Series on Disney+"
                    fetcher={fetchDpTop10Tv}
                    type="tv"
                    themeStyle="disney"
                />
            )}

            {/* Disney+ Originals */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Disney+ Original Series"
                    fetcher={fetchDpOriginals}
                    type="tv"
                    badgeType="Recently added"
                />
            )}

            {/* Marvel Cinematic Universe */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Marvel Cinematic Universe"
                    fetcher={fetchDpMarvel}
                    type="movie"
                    badgeType="Recently added"
                />
            )}

            {/* Star Wars Universe */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Star Wars Universe"
                    fetcher={fetchDpStarWars}
                    type="movie"
                />
            )}

            {/* Pixar Animation Favorites */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Pixar Animation Studio"
                    fetcher={fetchDpPixar}
                    type="movie"
                />
            )}
        </div>
    )
}
