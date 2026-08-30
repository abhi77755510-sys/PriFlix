import { Card, CardContent } from "@/components/ui/card.tsx"
import { cn } from "@/lib/utils.ts"
import { useMediaDrawer } from "@/components/media/drawer/hooks/useMediaDrawer"

export interface NetflixLandscapeCardProps {
    id: number
    type: "movie" | "tv"
    title: string
    backdropPath?: string | null
    posterPath?: string | null
    badge?: "Recently added" | "New Episode" | "New Season" | "Live" | null
    progress?: number // 0 - 100 for Continue Watching
    rating?: number
    year?: number
}

export function NetflixLandscapeCard({
    id,
    type,
    title,
    backdropPath,
    posterPath,
    badge,
    progress,
}: NetflixLandscapeCardProps) {
    const { open } = useMediaDrawer()

    const imageUrl = backdropPath || posterPath || "/favicon.svg"

    return (
        <Card
            onClick={() => open({ type, id })}
            className="group relative cursor-pointer overflow-hidden rounded-md border-0 bg-zinc-900 shadow-md transition-all duration-300 hover:scale-[1.05] hover:z-20 hover:shadow-2xl hover:ring-2 hover:ring-white/20 p-0"
        >
            <CardContent className="p-0">
                <div className="relative aspect-video w-full overflow-hidden rounded-md bg-zinc-950">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        loading="lazy"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-90" />

                    {/* Bottom Title on Card */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-white drop-shadow-md line-clamp-1">
                            {title}
                        </span>
                    </div>

                    {/* Red Status Badge */}
                    {badge && (
                        <div className="absolute bottom-2 left-2 z-10">
                            <span className="rounded bg-[#E50914] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-md">
                                {badge}
                            </span>
                        </div>
                    )}

                    {/* Progress Bar for Continue Watching */}
                    {typeof progress === "number" && progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                            <div className="h-full bg-[#E50914]" style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
