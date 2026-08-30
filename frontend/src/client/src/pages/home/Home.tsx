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
import { SonyLivView } from "./views/SonyLivView"
import { DisneyPlusView } from "./views/DisneyPlusView"
import { MaxView } from "./views/MaxView"
import { AnimeView } from "./views/AnimeView"

export function HomePage() {
    const tmdb = useTmdb()
    const [selectedOtt, setSelectedOtt] = useState<string>("netflix")
    const [mediaType, setMediaType] = useState<"all" | "movie" | "tv">("all")
    const [selectedLang, setSelectedLang] = useState<string>("all")

    // ── Global Trending All Fetchers ───────────────────────────────────────────
    const fetchGlobalHero = useCallback(() => {
        return Promise.all([tmdb.movie_lists.now_playing(), tmdb.tv_lists.popular()])
    }, [tmdb])

    const fetchAllPopularMovies = useCallback(() => {
        const params: any = {}
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie({ ...params, sort_by: "popularity.desc" })
    }, [tmdb, selectedLang])

    const fetchAllTrendingTv = useCallback(() => {
        const params: any = {}
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.tv({ ...params, sort_by: "popularity.desc" })
    }, [tmdb, selectedLang])

    const fetchAllTopRatedMovies = useCallback(() => {
        const params: any = { sort_by: "vote_average.desc", "vote_count.gte": 200 }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie(params)
    }, [tmdb, selectedLang])

    const fetchAllActionMovies = useCallback(() => {
        const params: any = { with_genres: "28", sort_by: "popularity.desc" }
        if (selectedLang !== "all") params.with_original_language = selectedLang
        return tmdb.discover.movie(params)
    }, [tmdb, selectedLang])

    return (
        <div className="min-h-screen overflow-hidden bg-black text-white">
            {/* Top OTT Platform Switcher Bar */}
            <div className="pt-20 px-4 sm:px-8 max-w-7xl mx-auto">
                <OTTTabs
                    selectedOtt={selectedOtt}
                    onSelectOtt={setSelectedOtt}
                    mediaType={mediaType}
                    onSelectMediaType={setMediaType}
                    selectedLang={selectedLang}
                    onSelectLang={setSelectedLang}
                />
            </div>

            {/* 1. NETFLIX VIEW */}
            {selectedOtt === "netflix" && (
                <NetflixView tmdb={tmdb} mediaType={mediaType} selectedLang={selectedLang} />
            )}

            {/* 2. PRIME VIDEO VIEW */}
            {selectedOtt === "prime" && (
                <PrimeView tmdb={tmdb} mediaType={mediaType} selectedLang={selectedLang} />
            )}

            {/* 3. JIOHOTSTAR VIEW */}
            {selectedOtt === "hotstar" && (
                <JioHotstarView tmdb={tmdb} mediaType={mediaType} />
            )}

            {/* 4. SONYLIV VIEW */}
            {selectedOtt === "sonyliv" && (
                <SonyLivView tmdb={tmdb} mediaType={mediaType} selectedLang={selectedLang} />
            )}

            {/* 5. DISNEY+ GLOBAL VIEW */}
            {selectedOtt === "disney" && (
                <DisneyPlusView tmdb={tmdb} mediaType={mediaType} />
            )}

            {/* 6. MAX (HBO) VIEW */}
            {selectedOtt === "max" && (
                <MaxView tmdb={tmdb} mediaType={mediaType} />
            )}

            {/* 7. HIANIME VIEW */}
            {selectedOtt === "anime" && (
                <AnimeView tmdb={tmdb} mediaType={mediaType} />
            )}

            {/* 8. GLOBAL TRENDING ALL VIEW */}
            {selectedOtt === "all" && (
                <div>
                    <HeroCarousel key={`hero-${selectedOtt}-${selectedLang}`} tmdb={tmdb} fetcher={fetchGlobalHero} />
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
