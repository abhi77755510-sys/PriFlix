import { Flame, Film, Tv, Sparkles } from "lucide-react"

export interface OTTPlatform {
    id: string
    name: string
    providerId?: number | string
    networkId?: number | string
    genreId?: number
    watchRegion?: string
    badgeClass: string
    accentColor: string
    bgGradient: string
    tagline: string
}

export const OTT_PLATFORMS: OTTPlatform[] = [
    {
        id: "all",
        name: "Trending All",
        badgeClass: "bg-primary/20 text-primary border-primary/40",
        accentColor: "#3b82f6",
        bgGradient: "from-blue-600/20 to-transparent",
        tagline: "Trending Movies & TV Shows Across All Platforms",
    },
    {
        id: "netflix",
        name: "Netflix",
        providerId: 8,
        networkId: 213,
        watchRegion: "IN",
        badgeClass: "ott-badge-netflix",
        accentColor: "#E50914",
        bgGradient: "from-red-600/20 to-transparent",
        tagline: "Netflix Originals, Blockbusters & Exclusives",
    },
    {
        id: "prime",
        name: "Prime Video",
        providerId: "9|119",
        networkId: 1024,
        watchRegion: "IN",
        badgeClass: "ott-badge-prime",
        accentColor: "#00A8E1",
        bgGradient: "from-sky-500/20 to-transparent",
        tagline: "Amazon Originals, Top Hit Movies & Shows",
    },
    {
        id: "hotstar",
        name: "JioHotstar",
        providerId: "237|337|122",
        networkId: "8036|3919|2739",
        watchRegion: "IN",
        badgeClass: "ott-badge-disney",
        accentColor: "#113CCF",
        bgGradient: "from-indigo-600/20 to-transparent",
        tagline: "Hotstar Specials, Marvel, Disney+ & Indian Blockbusters",
    },
    {
        id: "max",
        name: "Max",
        providerId: "384|1899",
        networkId: "8304|3186",
        watchRegion: "US",
        badgeClass: "bg-purple-600/20 text-purple-400 border-purple-500/40",
        accentColor: "#9900FF",
        bgGradient: "from-purple-600/20 to-transparent",
        tagline: "HBO Originals, Warner Bros & DC Universe",
    },
    {
        id: "anime",
        name: "HiAnime",
        genreId: 16,
        badgeClass: "ott-badge-anime",
        accentColor: "#FF640A",
        bgGradient: "from-orange-500/20 to-transparent",
        tagline: "Top Rated Anime Series & Japanese Animation",
    },
]

interface OTTTabsProps {
    selectedOtt: string
    onSelectOtt: (ottId: string) => void
    mediaType?: "all" | "movie" | "tv"
    onSelectMediaType?: (type: "all" | "movie" | "tv") => void
}

export function OTTTabs({ selectedOtt, onSelectOtt, mediaType = "all", onSelectMediaType }: OTTTabsProps) {
    const activeOtt = OTT_PLATFORMS.find((p) => p.id === selectedOtt) || OTT_PLATFORMS[0]

    return (
        <div className="w-full space-y-3 mb-6">
            {/* OTT Platform Switcher Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {OTT_PLATFORMS.map((platform) => {
                    const isSelected = selectedOtt === platform.id
                    return (
                        <button
                            key={platform.id}
                            onClick={() => onSelectOtt(platform.id)}
                            className={`group relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-300 ${
                                isSelected
                                    ? "bg-zinc-900/90 text-white shadow-lg border border-white/20 scale-[1.02]"
                                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/60 hover:bg-zinc-800/60 hover:text-zinc-200"
                            }`}
                            style={{
                                boxShadow: isSelected ? `0 0 20px -3px ${platform.accentColor}33` : undefined,
                            }}
                        >
                            {/* Accent Glow Pill */}
                            <span
                                className="h-2 w-2 rounded-full transition-all"
                                style={{
                                    backgroundColor: platform.accentColor,
                                    boxShadow: isSelected ? `0 0 8px ${platform.accentColor}` : undefined,
                                }}
                            />
                            <span>{platform.name}</span>
                        </button>
                    )
                })}
            </div>

            {/* Active Platform Banner & Type Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/5 bg-gradient-to-r from-zinc-900/80 to-zinc-950/80 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                    <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                        style={{
                            backgroundColor: `${activeOtt.accentColor}22`,
                            color: activeOtt.accentColor,
                            border: `1px solid ${activeOtt.accentColor}44`,
                        }}
                    >
                        <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            {activeOtt.name}
                            <span className="text-xs font-normal text-zinc-400 hidden sm:inline">— {activeOtt.tagline}</span>
                        </h2>
                    </div>
                </div>

                {/* Media Type Filter (All, Movies, TV) */}
                {onSelectMediaType && (
                    <div className="flex items-center gap-1 rounded-lg bg-zinc-950/60 p-1 border border-zinc-800/80 self-start sm:self-auto">
                        <button
                            onClick={() => onSelectMediaType("all")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                mediaType === "all" ? "bg-primary text-primary-foreground shadow" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            <Flame className="h-3.5 w-3.5" />
                            All
                        </button>
                        <button
                            onClick={() => onSelectMediaType("movie")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                mediaType === "movie" ? "bg-primary text-primary-foreground shadow" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            <Film className="h-3.5 w-3.5" />
                            Movies
                        </button>
                        <button
                            onClick={() => onSelectMediaType("tv")}
                            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                mediaType === "tv" ? "bg-primary text-primary-foreground shadow" : "text-zinc-400 hover:text-zinc-200"
                            }`}
                        >
                            <Tv className="h-3.5 w-3.5" />
                            TV Shows
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
