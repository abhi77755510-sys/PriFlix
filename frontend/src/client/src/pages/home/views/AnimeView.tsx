import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface AnimeViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
}

export function AnimeView({ tmdb, mediaType }: AnimeViewProps) {
    // ── Dedicated HiAnime Fetchers ─────────────────────────────────────────────
    const fetchTop10Anime = useCallback(
        () => tmdb.discover.tv({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchTopAnimeMovies = useCallback(
        () => tmdb.discover.movie({ with_genres: "16", with_origin_country: "JP", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchTopAiringAnime = useCallback(
        () => tmdb.discover.tv({ with_genres: "16", with_origin_country: "JP", sort_by: "first_air_date.desc" }),
        [tmdb]
    )

    const fetchShonenAction = useCallback(
        () => tmdb.discover.tv({ with_genres: "16,10759", with_origin_country: "JP", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchPopularAnimeAllTime = useCallback(
        () => tmdb.discover.tv({ with_genres: "16", with_origin_country: "JP", sort_by: "vote_count.desc" }),
        [tmdb]
    )

    return (
        <div className="space-y-10 px-4 sm:px-8 pt-4 animate-in duration-500 fade-in bg-black">
            {/* Top 10 Anime Series */}
            {(mediaType === "all" || mediaType === "tv") && (
                <Top10Rail
                    title="Top 10 Anime Series Today"
                    fetcher={fetchTop10Anime}
                    type="tv"
                    themeStyle="anime"
                />
            )}

            {/* Top Anime Movies */}
            {(mediaType === "all" || mediaType === "movie") && (
                <Top10Rail
                    title="Top Anime Feature Films"
                    fetcher={fetchTopAnimeMovies}
                    type="movie"
                    themeStyle="anime"
                />
            )}

            {/* Top Airing Anime */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Top Airing Anime Episodes"
                    fetcher={fetchTopAiringAnime}
                    type="tv"
                    badgeType="New Episode"
                />
            )}

            {/* Shonen & Action Anime */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Shonen & Battle Action Anime"
                    fetcher={fetchShonenAction}
                    type="tv"
                    badgeType="Recently added"
                />
            )}

            {/* Most Popular Anime of All Time */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Most Popular Anime of All Time"
                    fetcher={fetchPopularAnimeAllTime}
                    type="tv"
                />
            )}
        </div>
    )
}
