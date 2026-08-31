import { useParams, useSearchParams, useNavigate } from "react-router-dom"
import { MediaWatchProvider } from "./providers/MediaWatchProvider"
import { useMediaWatch } from "./hooks/useMediaWatch"
import { MediaPlayer } from "./MediaPlayer"
import { ErrorState } from "./ErrorState"
import type { MediaType } from "./types/media.types"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"

function MediaWatchPageContent({ type }: { type: MediaType }) {
    const { id } = useParams<{ id: string }>()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()

    const season = searchParams.get("s") ? parseInt(searchParams.get("s")!) : type === "tv" ? 1 : undefined

    const episode = searchParams.get("e") ? parseInt(searchParams.get("e")!) : type === "tv" ? 1 : undefined

    const server = searchParams.get("server")
    const audio = searchParams.get("audio")

    const media = useMediaWatch(id!, type, season, episode, server, audio)

    const { error } = media

    if (error) {
        return <ErrorState error={error} />
    }

    return (
        <div className="relative min-h-screen bg-black text-foreground">
            <div className="absolute top-4 left-4 z-50">
                <Button variant="ghost" className="border border-border bg-black/60 backdrop-blur-md" onClick={() => navigate(-1)}>
                    <ChevronLeft className="h-6 w-6" /> Back
                </Button>
            </div>

            <div className="h-full w-full bg-black">
                <MediaPlayer />
            </div>
        </div>
    )
}

export default function MediaWatchPage({ type }: { type: MediaType }) {
    return (
        <MediaWatchProvider>
            <MediaWatchPageContent type={type} />
        </MediaWatchProvider>
    )
}
