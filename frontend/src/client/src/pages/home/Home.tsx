import { useState, useCallback } from "react"
import { useTmdb } from "@/hooks/use-tmdb"
import { HeroCarousel } from "@/components/media/HeroCarousel/HeroCarousel"
import { HeroFade } from "@/components/media/HeroCarousel/HeroFade"
import { MovieRail, TvRail } from "@/components/media/MediaRail/TypedRails.tsx"
import { OTTTabs } from "@/components/layout/OTTTabs"

// Dedicated OTT View Replications
import { NetflixView } from "./views/NetflixView"
import { PrimeView } from "./views/PrimeView"
import { JioHotstarView } from "./views/JioHotstarView"
import { DisneyPlusView } from "./views/DisneyPlusView"
import { MaxView } from "./views/MaxView"
import { AnimeView } from "./views/AnimeView"

export function HomePage() {
    const tmdb = useTmdb()
    const [selectedOtt, setSelectedOtt] = useState<string>("netflix")
    const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all")

    // ── Global Trending All Fetchers ───────────────────────────────────────────
    const fetchGlobalHero = useCallback(() => {
        return Promise.all([tmdb.movie_lists.now_playing(), tmdb.tv_lists.popular()])
    }, [tmdb])

    const fetchAllPopularMovies = useCallback(() => tmdb.movie_lists.popular({}), [tmdb])
    const fetchAllTrendingTv = useCallback(() => tmdb.tv_lists.popular({}), [tmdb])
    const fetchAllTopRatedMovies = useCallback(() => tmdb.movie_lists.top_rated(), [tmdb])
    const fetchAllActionMovies = useCallback(() => tmdb.discover.movie({ with_genres: "28", sort_by: "popularity.desc" }), [tmdb])

    return (
        <div className="min-h-screen overflow-hidden bg-black text-white">
            {/* Top OTT Platform Switcher Bar */}
            <div className="pt-20 px-4 sm:px-8 max-w-7xl mx-auto">
                <OTTTabs
                    selectedOtt={selectedOtt}
                    onSelectOtt={setSelectedOtt}
                    mediaType={mediaType}
                    onSelectMediaType={setMediaType}
                />
            </div>

            {/* 1. NETFLIX VIEW */}
            {selectedOtt === "netflix" && <NetflixView tmdb={tmdb} mediaType={mediaType} />}

            {/* 2. PRIME VIDEO VIEW */}
            {selectedOtt === "prime" && <PrimeView tmdb={tmdb} mediaType={mediaType} />}

            {/* 3. JIOHOTSTAR VIEW */}
            {selectedOtt === "hotstar" && <JioHotstarView tmdb={tmdb} mediaType={mediaType} />}

            {/* 4. DISNEY+ GLOBAL VIEW */}
            {selectedOtt === "disney" && <DisneyPlusView tmdb={tmdb} mediaType={mediaType} />}

            {/* 5. MAX (HBO) VIEW */}
            {selectedOtt === "max" && <MaxView tmdb={tmdb} mediaType={mediaType} />}

            {/* 6. HIANIME VIEW */}
            {selectedOtt === "anime" && <AnimeView tmdb={tmdb} mediaType={mediaType} />}

            {/* 7. GLOBAL TRENDING ALL VIEW */}
            {selectedOtt === "all" && (
                <div>
                    <HeroCarousel key={`hero-${selectedOtt}`} tmdb={tmdb} fetcher={fetchGlobalHero} />
                    <HeroFade />
                    <div className="space-y-8 px-4 sm:px-8 -mt-16 sm:-mt-24 relative z-20">
                        {(mediaType === "all" || mediaType === "movie") && (
                            <MovieRail title="Popular Movies" fetcher={fetchAllPopularMovies} />
                        )}

                        {(mediaType === "all" || mediaType === "tv") && (
                            <TvRail title="Trending TV Shows" fetcher={fetchAllTrendingTv} />
                        )}

                        {(mediaType === "all" || mediaType === "movie") && (
                            <MovieRail title="Top Rated Movies" fetcher={fetchAllTopRatedMovies} />
                        )}

                        {(mediaType === "all" || mediaType === "movie") && (
                            <MovieRail title="Action & Thrillers" fetcher={fetchAllActionMovies} />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default HomePage
