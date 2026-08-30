import { useMediaRail } from "./MediaRail"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel.tsx"
import { Skeleton } from "@/components/ui/skeleton.tsx"
import { useMediaDrawer } from "@/components/media/drawer/hooks/useMediaDrawer"
import type { MovieResultItem, TVSeriesResultItem } from "@lorenzopant/tmdb"

type Top10Item = (MovieResultItem | TVSeriesResultItem) & {
    title?: string
    name?: string
    poster_path?: string | null
    vote_average?: number
    release_date?: string
    first_air_date?: string
}

interface Top10RailProps {
    title: string
    fetcher: () => Promise<{ results: Top10Item[] } | Top10Item[]>
    type?: "movie" | "tv"
    themeStyle?: "netflix" | "prime" | "disney" | "anime" | "default"
}

export function Top10Rail({ title, fetcher, type = "movie", themeStyle = "netflix" }: Top10RailProps) {
    const { items, isLoading, error } = useMediaRail<Top10Item>(fetcher)
    const { open } = useMediaDrawer()

    if (error) return null

    const top10List = (items || []).slice(0, 10)

    const getRankNumberColor = (index: number) => {
        switch (themeStyle) {
            case "netflix":
                return "text-zinc-800 drop-shadow-[0_4px_12px_rgba(229,9,20,0.6)] [-webkit-text-stroke:2px_#e50914]"
            case "prime":
                return "text-zinc-900 drop-shadow-[0_4px_12px_rgba(0,168,225,0.6)] [-webkit-text-stroke:2px_#00A8E1]"
            case "disney":
                return "text-zinc-900 drop-shadow-[0_4px_12px_rgba(17,60,207,0.6)] [-webkit-text-stroke:2px_#3b82f6]"
            case "anime":
                return "text-zinc-900 drop-shadow-[0_4px_12px_rgba(255,100,10,0.6)] [-webkit-text-stroke:2px_#FF640A]"
            default:
                return "text-zinc-900 drop-shadow-[0_4px_12px_rgba(59,130,246,0.6)] [-webkit-text-stroke:2px_#3b82f6]"
        }
    }

    return (
        <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                {title}
            </h2>

            <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                <CarouselContent className="-ml-3">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, idx) => (
                              <CarouselItem key={`top10-skeleton-${idx}`} className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                                  <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                              </CarouselItem>
                          ))
                        : top10List.map((item, idx) => {
                              const rank = idx + 1
                              const itemTitle = item.title || item.name || ""
                              const itemType = type || (item.title ? "movie" : "tv")
                              const year = item.release_date
                                  ? new Date(item.release_date).getFullYear()
                                  : item.first_air_date
                                    ? new Date(item.first_air_date).getFullYear()
                                    : ""

                              return (
                                  <CarouselItem
                                      key={`${item.id}-${rank}`}
                                      className="pl-3 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                                  >
                                      <div
                                          onClick={() => open({ type: itemType, id: item.id })}
                                          className="group relative flex items-center cursor-pointer select-none py-2"
                                      >
                                          {/* Big Rank Number */}
                                          <div
                                              className={`relative shrink-0 text-7xl sm:text-8xl lg:text-9xl font-black leading-none select-none transition-transform duration-300 group-hover:scale-105 ${getRankNumberColor(
                                                  idx
                                              )}`}
                                              style={{
                                                  fontFamily: "Impact, sans-serif",
                                                  marginRight: "-24px",
                                                  zIndex: 1,
                                              }}
                                          >
                                              {rank}
                                          </div>

                                          {/* Card Image */}
                                          <div className="relative z-10 w-full overflow-hidden rounded-xl bg-zinc-950 border border-white/10 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:border-white/30 group-hover:shadow-[0_12px_25px_-5px_rgba(0,0,0,0.8)]">
                                              <div className="aspect-[2/3] w-full overflow-hidden">
                                                  <img
                                                      src={item.poster_path ? item.poster_path : "/favicon.svg"}
                                                      alt={itemTitle}
                                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                      loading="lazy"
                                                  />
                                              </div>

                                              {/* Hover details */}
                                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex flex-col justify-end p-2.5">
                                                  <span className="text-xs font-bold text-white line-clamp-2">{itemTitle}</span>
                                                  <div className="mt-1 flex items-center justify-between text-[11px] font-semibold text-zinc-300">
                                                      <span>★ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}</span>
                                                      <span>{year}</span>
                                                  </div>
                                              </div>
                                          </div>
                                      </div>
                                  </CarouselItem>
                              )
                          })}
                </CarouselContent>
                <CarouselPrevious className="-left-3 bg-black/60 text-white border-white/20 hover:bg-black/90 hidden sm:flex" />
                <CarouselNext className="-right-3 bg-black/60 text-white border-white/20 hover:bg-black/90 hidden sm:flex" />
            </Carousel>
        </div>
    )
}
