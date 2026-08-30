import { useState, useEffect } from "react"
import type { TMDB } from "@lorenzopant/tmdb"
import { Play, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMediaDrawer } from "@/components/media/drawer/hooks/useMediaDrawer"
import { useNavigate } from "react-router-dom"

interface NetflixBillboardProps {
    tmdb: TMDB
}

interface BillboardMedia {
    id: number
    type: "movie" | "tv"
    title: string
    tagline?: string
    overview: string
    backdropUrl: string
    logoUrl?: string
    ratingUa: string
}

export function NetflixBillboard({ tmdb }: NetflixBillboardProps) {
    const { open } = useMediaDrawer()
    const navigate = useNavigate()
    const [media, setMedia] = useState<BillboardMedia | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let isMounted = true

        const loadFeatured = async () => {
            try {
                // Fetch top trending Netflix originals
                const res = await tmdb.discover.tv({
                    with_networks: "213",
                    sort_by: "popularity.desc",
                })

                const item = res.results?.[0]
                if (!item) return

                // Fetch details for logo and backdrop
                let logoUrl = ""
                try {
                    const imgRes = await tmdb.tv_series.images(item.id, {})
                    const enLogo = imgRes.logos?.find((l) => l.iso_639_1 === "en" || !l.iso_639_1)
                    if (enLogo?.file_path) {
                        logoUrl = `https://image.tmdb.org/t/p/w500${enLogo.file_path}`
                    }
                } catch {
                    // ignore
                }

                if (isMounted) {
                    setMedia({
                        id: item.id,
                        type: "tv",
                        title: item.name,
                        tagline: "Trending Global Series: Watch Now",
                        overview: item.overview || "Watch exclusive Netflix Originals, top blockbuster movies, and award-winning series.",
                        backdropUrl: item.backdrop_path
                            ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                            : `https://image.tmdb.org/t/p/original${item.poster_path}`,
                        logoUrl,
                        ratingUa: item.adult ? "A 18+" : "U/A 16+",
                    })
                    setIsLoading(false)
                }
            } catch (err) {
                console.error("Failed to load Netflix Billboard:", err)
                if (isMounted) setIsLoading(false)
            }
        }

        loadFeatured()

        return () => {
            isMounted = false
        }
    }, [tmdb])

    if (isLoading || !media) {
        return (
            <div className="relative h-[70vh] sm:h-[85vh] w-full bg-zinc-950 animate-pulse flex items-end p-8 sm:p-16">
                <div className="space-y-4 max-w-xl">
                    <div className="h-8 w-32 bg-zinc-800 rounded" />
                    <div className="h-12 w-80 bg-zinc-800 rounded" />
                    <div className="h-16 w-full bg-zinc-800 rounded" />
                </div>
            </div>
        )
    }

    return (
        <section className="relative h-[75vh] sm:h-[88vh] w-full overflow-hidden bg-black select-none">
            {/* Cinematic Backdrop Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src={media.backdropUrl}
                    alt={media.title}
                    className="h-full w-full object-cover object-top sm:object-center"
                />
                {/* Vignettes */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            </div>

            {/* Billboard Content */}
            <div className="relative z-10 flex h-full items-end pb-16 sm:pb-24 px-6 sm:px-12 md:px-16">
                <div className="max-w-xl sm:max-w-2xl space-y-4">
                    {/* Red Netflix Wordmark */}
                    <div className="flex items-center gap-2">
                        <span className="text-[#E50914] font-black tracking-widest text-lg sm:text-2xl drop-shadow-[0_2px_8px_rgba(229,9,20,0.8)]">
                            N E T F L I X
                        </span>
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded border border-white/10">
                            Series
                        </span>
                    </div>

                    {/* Title Logo or Big Text */}
                    {media.logoUrl ? (
                        <img
                            src={media.logoUrl}
                            alt={media.title}
                            className="max-h-24 sm:max-h-36 max-w-[75vw] sm:max-w-[420px] object-contain drop-shadow-2xl"
                        />
                    ) : (
                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-2xl">
                            {media.title}
                        </h1>
                    )}

                    {/* Tagline */}
                    {media.tagline && (
                        <p className="text-sm sm:text-base font-bold text-zinc-100 drop-shadow-md">
                            {media.tagline}
                        </p>
                    )}

                    {/* Synopsis */}
                    <p className="text-xs sm:text-sm leading-relaxed text-zinc-300 line-clamp-3 max-w-lg drop-shadow-md">
                        {media.overview}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button
                            onClick={() => navigate(`/watch/${media.type}/${media.id}?s=1&e=1`)}
                            className="bg-white text-black font-extrabold px-6 sm:px-8 py-2.5 rounded-md hover:bg-white/80 shadow-2xl transition-all hover:scale-105"
                        >
                            <Play className="mr-2 h-5 w-5 fill-black" />
                            Play
                        </Button>

                        <Button
                            onClick={() => open({ type: media.type, id: media.id })}
                            className="bg-zinc-600/70 hover:bg-zinc-600/50 text-white font-bold px-6 sm:px-7 py-2.5 rounded-md backdrop-blur-md transition-all hover:scale-105 border border-white/10"
                        >
                            <Info className="mr-2 h-5 w-5" />
                            More Info
                        </Button>
                    </div>
                </div>
            </div>

            {/* Maturity Rating Pill (Bottom Right) */}
            <div className="absolute bottom-16 sm:bottom-24 right-0 z-10 bg-black/60 backdrop-blur-md border-l-4 border-zinc-400 text-zinc-200 px-4 py-1 text-xs font-bold tracking-wider">
                {media.ratingUa}
            </div>
        </section>
    )
}
