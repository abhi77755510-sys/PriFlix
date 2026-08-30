import { Flame, Film, Tv, Sparkles, Languages } from "lucide-react"

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

export interface LanguageFilter {
    code: string
    label: string
    nativeLabel: string
}

export const REGIONAL_LANGUAGES: LanguageFilter[] = [
    { code: "all", label: "All Languages", nativeLabel: "All" },
    { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം" },
    { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
    { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
    { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
    { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" },
    { code: "en", label: "English", nativeLabel: "English" },
]

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
        providerId: "122|337",
        networkId: "8036|3919",
        watchRegion: "IN",
        badgeClass: "ott-badge-disney",
        accentColor: "#113CCF",
        bgGradient: "from-indigo-600/20 to-transparent",
        tagline: "Hotstar Specials, Indian Blockbusters & Serials",
    },
    {
        id: "sonyliv",
        name: "SonyLIV",
        providerId: "237",
        networkId: "1720",
        watchRegion: "IN",
        badgeClass: "bg-amber-600/20 text-amber-400 border-amber-500/40",
        accentColor: "#F59E0B",
        bgGradient: "from-amber-600/20 to-transparent",
        tagline: "SonyLIV Originals, Indian Thrillers & Sports",
    },
    {
        id: "disney",
        name: "Disney+",
        providerId: "337",
        networkId: "2739",
        watchRegion: "US",
        badgeClass: "ott-badge-disney",
        accentColor: "#0063e5",
        bgGradient: "from-blue-700/20 to-transparent",
        tagline: "Marvel MCU, Star Wars, Pixar & Disney Classics",
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
    selectedLang?: string
    onSelectLang?: (lang: string) => void
}

export function OTTTabs({
    selectedOtt,
    onSelectOtt,
    mediaType = "all",
    onSelectMediaType,
    selectedLang = "all",
    onSelectLang,
}: OTTTabsProps) {
    const activeOtt = OTT_PLATFORMS.find((p) => p.id === selectedOtt) || OTT_PLATFORMS[0]

    return (
        <div className="w-full space-y-4 mb-6">
            {/* 1. OTT Platform Switcher Bar */}
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

            {/* 2. Platform Banner + Media Type & Language Filters */}
            <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-gradient-to-r from-zinc-900/80 to-zinc-950/80 p-3.5 backdrop-blur-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                {/* 3. Regional Language Sub-Filters */}
                {onSelectLang && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none border-t border-white/5">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 shrink-0 mr-1">
                            <Languages className="h-3 w-3" />
                            Region:
                        </span>
                        {REGIONAL_LANGUAGES.map((lang) => {
                            const isSelected = selectedLang === lang.code
                            return (
                                <button
                                    key={lang.code}
                                    onClick={() => onSelectLang(lang.code)}
                                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
                                        isSelected
                                            ? "bg-white text-black font-bold shadow"
                                            : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700/60 hover:text-white"
                                    }`}
                                >
                                    {lang.label} <span className="text-[10px] opacity-70">({lang.nativeLabel})</span>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
