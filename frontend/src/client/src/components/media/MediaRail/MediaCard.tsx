import * as React from "react"
import { Card, CardContent } from "@/components/ui/card.tsx"
import { cn } from "@/lib/utils.ts"
import { useMediaDrawer } from "@/components/media/drawer/hooks/useMediaDrawer"
import { StarRating } from "@/components/media/StarRating"

export interface MediaCardProps {
    title: string
    imagePath?: string | null
    imageAlt?: string
    aspectRatio?: "portrait" | "landscape"
    className?: string
    type: "movie" | "tv"
    id: number
    rating: number
    year: number
}

// Performance reason: rails render 6-20+ of these per page; without memo, every rail
// re-render (e.g. a sibling rail loading) re-rendered every card in every other rail too.
export const MediaCard = React.memo(
    React.forwardRef<HTMLDivElement, MediaCardProps>(({ title, imagePath, imageAlt, aspectRatio = "portrait", className, rating, year, id, type }, ref) => {
        const { open } = useMediaDrawer()

        return (
            <Card
                ref={ref}
                className={cn(
                    "group relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900/60 backdrop-blur-md p-0 transition-all duration-300 hover:scale-[1.03] hover:border-primary/40 hover:shadow-[0_10px_25px_-5px_rgba(0,0,0,0.6),0_0_15px_-3px_rgba(59,130,246,0.3)] cursor-pointer",
                    className
                )}
                onClick={() => open({ type: type, id: id })}
            >
                <CardContent className="p-0">
                    <div className={cn("relative overflow-hidden rounded-xl bg-zinc-950", aspectRatio === "portrait" ? "aspect-2/3" : "aspect-video")}>
                        <img
                            src={imagePath ?? "/favicon.svg"}
                            alt={imageAlt || title}
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                            loading="lazy"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
                            <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-200 backdrop-blur-md border border-white/10">
                                {type === "movie" ? "Movie" : "Series"}
                            </span>
                            {rating > 0 && (
                                <span className="flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-md border border-white/10">
                                    ★ {rating.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="pointer-events-none absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            {/* Gradient shadow */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />

                            {/* Text content */}
                            <div className="relative z-10 w-full p-3 text-white">
                                <div className="text-sm leading-snug font-bold line-clamp-2 drop-shadow-md">{title}</div>

                                <div className="mt-1.5 flex w-full items-center justify-between text-xs font-medium text-zinc-300">
                                    <StarRating rating={rating} />
                                    <span>{year || ""}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    })
)

MediaCard.displayName = "MediaCard"
