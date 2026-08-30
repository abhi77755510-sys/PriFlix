import { useMediaRail } from "./MediaRail"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel.tsx"
import { Skeleton } from "@/components/ui/skeleton.tsx"
import { NetflixLandscapeCard } from "./NetflixLandscapeCard"
import type { MovieResultItem, TVSeriesResultItem } from "@lorenzopant/tmdb"

type RailItem = (MovieResultItem | TVSeriesResultItem) & {
    title?: string
    name?: string
    backdrop_path?: string | null
    poster_path?: string | null
    vote_average?: number
    release_date?: string
    first_air_date?: string
}

interface NetflixLandscapeRailProps {
    title: string
    fetcher: () => Promise<{ results: RailItem[] } | RailItem[]>
    type?: "movie" | "tv"
    badgeType?: "Recently added" | "New Episode" | "New Season" | "Live"
}

export function NetflixLandscapeRail({ title, fetcher, type = "movie", badgeType }: NetflixLandscapeRailProps) {
    const { items, isLoading, error } = useMediaRail<RailItem>(fetcher)

    if (error) return null

    return (
        <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white hover:text-zinc-300 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                {title}
            </h2>

            <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
                <CarouselContent className="-ml-2">
                    {isLoading
                        ? Array.from({ length: 6 }).map((_, idx) => (
                              <CarouselItem key={`nf-skel-${idx}`} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                                  <Skeleton className="aspect-video w-full rounded-md" />
                              </CarouselItem>
                          ))
                        : items.map((item, idx) => {
                              const itemTitle = item.title || item.name || ""
                              const itemType = type || (item.title ? "movie" : "tv")
                              const year = item.release_date
                                  ? new Date(item.release_date).getFullYear()
                                  : item.first_air_date
                                    ? new Date(item.first_air_date).getFullYear()
                                    : undefined

                              // Show badge on a few top items
                              const showBadge = idx % 3 === 0 ? badgeType : undefined

                              return (
                                  <CarouselItem key={`${item.id}-${idx}`} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6">
                                      <NetflixLandscapeCard
                                          id={item.id}
                                          type={itemType}
                                          title={itemTitle}
                                          backdropPath={item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : undefined}
                                          posterPath={item.poster_path ? item.poster_path : undefined}
                                          badge={showBadge}
                                          rating={item.vote_average}
                                          year={year}
                                      />
                                  </CarouselItem>
                              )
                          })}
                </CarouselContent>
                <CarouselPrevious className="-left-3 bg-black/70 text-white border-0 hover:bg-black/90 hidden sm:flex" />
                <CarouselNext className="-right-3 bg-black/70 text-white border-0 hover:bg-black/90 hidden sm:flex" />
            </Carousel>
        </div>
    )
}
