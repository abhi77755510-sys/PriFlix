import { useState, useCallback } from "react"
import { useTmdb } from "@/hooks/use-tmdb"
import { HeroCarousel } from "@/components/media/HeroCarousel/HeroCarousel"
import { HeroFade } from "@/components/media/HeroCarousel/HeroFade"
import { MovieRail, TvRail } from "@/components/media/MediaRail/TypedRails.tsx"
import { OTTTabs, OTT_PLATFORMS } from "@/components/layout/OTTTabs"

export function HomePage() {
    const tmdb = useTmdb()
    const [selectedOtt, setSelectedOtt] = useState<string>("all")
    const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all")

    const activeOtt = OTT_PLATFORMS.find((p) => p.id === selectedOtt) || OTT_PLATFORMS[0]

    // Fetchers
    const fetchHero = useCallback(() => {
        return Promise.all([tmdb.movie_lists.now_playing(), tmdb.tv_lists.popular()])
    }, [tmdb])

    const fetchOttMovies = useCallback(() => {
        if (activeOtt.id === "all") {
            return tmdb.movie_lists.popular({})
        }
        if (activeOtt.id === "anime") {
            return tmdb.discover.movie({
                with_genres: "16",
                with_origin_country: "JP",
                sort_by: "popularity.desc",
            })
        }
        return tmdb.discover.movie({
            with_watch_providers: String(activeOtt.providerId),
            watch_region: "US",
            sort_by: "popularity.desc",
        })
    }, [tmdb, activeOtt])

    const fetchOttTv = useCallback(() => {
        if (activeOtt.id === "all") {
            return tmdb.tv_lists.popular({})
        }
        if (activeOtt.id === "anime") {
            return tmdb.discover.tv({
                with_genres: "16",
                with_origin_country: "JP",
                sort_by: "popularity.desc",
            })
        }
        return tmdb.discover.tv({
            with_watch_providers: String(activeOtt.providerId),
            watch_region: "US",
            sort_by: "popularity.desc",
        })
    }, [tmdb, activeOtt])

    const fetchOttTopRated = useCallback(() => {
        if (activeOtt.id === "all") {
            return tmdb.movie_lists.top_rated()
        }
        if (activeOtt.id === "anime") {
            return tmdb.discover.tv({
                with_genres: "16",
                with_origin_country: "JP",
                sort_by: "vote_average.desc",
                "vote_count.gte": 100,
            })
        }
        return tmdb.discover.movie({
            with_watch_providers: String(activeOtt.providerId),
            watch_region: "US",
            sort_by: "vote_average.desc",
            "vote_count.gte": 100,
        })
    }, [tmdb, activeOtt])

    return (
        <div className="min-h-screen overflow-hidden">
            <HeroCarousel tmdb={tmdb} fetcher={fetchHero} />

            <HeroFade />

            <section className="flex flex-col gap-6 bg-background px-4 py-8 sm:px-8">
                {/* OTT Platform Switcher Bar */}
                <OTTTabs
                    selectedOtt={selectedOtt}
                    onSelectOtt={setSelectedOtt}
                    mediaType={mediaType}
                    onSelectMediaType={setMediaType}
                />

                {/* Content Rails */}
                {(mediaType === "all" || mediaType === "movie") && (
                    <MovieRail
                        key={`${activeOtt.id}-movies`}
                        title={activeOtt.id === "all" ? "Popular Movies" : `${activeOtt.name} Featured Movies`}
                        fetcher={fetchOttMovies}
                    />
                )}

                {(mediaType === "all" || mediaType === "tv") && (
                    <TvRail
                        key={`${activeOtt.id}-tv`}
                        title={activeOtt.id === "all" ? "Trending TV Shows" : `${activeOtt.name} Exclusive Series`}
                        fetcher={fetchOttTv}
                    />
                )}

                {(mediaType === "all" || mediaType === "movie") && (
                    <MovieRail
                        key={`${activeOtt.id}-top-rated`}
                        title={activeOtt.id === "all" ? "Top Rated Movies" : `Top Rated on ${activeOtt.name}`}
                        fetcher={fetchOttTopRated}
                    />
                )}
            </section>
        </div>
    )
}

export default HomePage
