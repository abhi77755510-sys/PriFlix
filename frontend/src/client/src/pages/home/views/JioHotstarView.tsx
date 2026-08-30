import { useCallback } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Top10Rail } from "@/components/media/MediaRail/Top10Rail"
import { NetflixLandscapeRail } from "@/components/media/MediaRail/NetflixLandscapeRail"

interface JioHotstarViewProps {
    tmdb: TMDB
    mediaType: "all" | "movie" | "tv"
}

export function JioHotstarView({ tmdb, mediaType }: JioHotstarViewProps) {
    // ── Dedicated JioHotstar Fetchers ──────────────────────────────────────────
    const fetchHotstarTv = useCallback(
        () => tmdb.discover.tv({ with_networks: "8036|3919|2739", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchHotstarMovies = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "237|122|337", watch_region: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchHotstarSpecials = useCallback(
        () => tmdb.discover.tv({ with_networks: "3919", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchIndianDramas = useCallback(
        () => tmdb.discover.tv({ with_networks: "8036", with_origin_country: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    const fetchRegionalBlockbusters = useCallback(
        () => tmdb.discover.movie({ with_watch_providers: "237|122", watch_region: "IN", with_origin_country: "IN", sort_by: "popularity.desc" }),
        [tmdb]
    )

    return (
        <div className="space-y-10 px-4 sm:px-8 pt-4 animate-in duration-500 fade-in bg-black">
            {/* Top 10 on JioHotstar */}
            {(mediaType === "all" || mediaType === "tv") && (
                <Top10Rail
                    title="Top 10 Shows on JioHotstar"
                    fetcher={fetchHotstarTv}
                    type="tv"
                    themeStyle="disney"
                />
            )}

            {/* Top Blockbuster Movies on Hotstar */}
            {(mediaType === "all" || mediaType === "movie") && (
                <Top10Rail
                    title="Top Movies on JioHotstar"
                    fetcher={fetchHotstarMovies}
                    type="movie"
                    themeStyle="disney"
                />
            )}

            {/* Hotstar Specials */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Hotstar Specials & Exclusives"
                    fetcher={fetchHotstarSpecials}
                    type="tv"
                    badgeType="Recently added"
                />
            )}

            {/* Popular Indian Serials & Dramas */}
            {(mediaType === "all" || mediaType === "tv") && (
                <NetflixLandscapeRail
                    title="Trending Indian Series"
                    fetcher={fetchIndianDramas}
                    type="tv"
                    badgeType="New Episode"
                />
            )}

            {/* Regional Indian Blockbusters */}
            {(mediaType === "all" || mediaType === "movie") && (
                <NetflixLandscapeRail
                    title="Indian Blockbusters & Regional Hits"
                    fetcher={fetchRegionalBlockbusters}
                    type="movie"
                />
            )}
        </div>
    )
}
