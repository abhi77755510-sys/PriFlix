import { useEffect, useState } from "react"
import { useTmdb } from "@/hooks/use-tmdb"
import { tmdbService } from "../services/tmdb.service"
import type { MediaType } from "../types/media.types"
import type { MovieDetails, TVSeriesDetails, TVEpisode } from "@lorenzopant/tmdb"

export function useMediaDetails(id: string, type: MediaType, season?: number, episode?: number) {
    const tmdb = useTmdb()
    const [details, setDetails] = useState<{
        movie?: MovieDetails
        show?: TVSeriesDetails
        episode?: TVEpisode
    }>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string>()

    useEffect(() => {
        async function fetchDetails() {
            setIsLoading(true)
            try {
                if (type === "movie") {
                    const movie = await tmdbService.getMovieDetails(tmdb, id)
                    setDetails({ movie })
                } else {
                    const show = await tmdbService.getTvDetails(tmdb, id)
                    let epDetails: TVEpisode | undefined
                    if (season !== undefined && episode !== undefined) {
                        epDetails = await tmdbService.getEpisodeDetails(tmdb, id, season, episode)
                    }
                    setDetails({ show, episode: epDetails })
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e))
            } finally {
                setIsLoading(false)
            }
        }

        fetchDetails()
    }, [id, type, season, episode, tmdb])

    return { details, isLoading, error }
}
