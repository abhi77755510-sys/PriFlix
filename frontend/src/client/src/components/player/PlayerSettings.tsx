import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Check, Settings, Captions, Volume2, HardDrive, Gauge, Clapperboard, RefreshCw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useMediaWatchContext } from "./providers/MediaWatchProvider"
import { useSubtitles } from "./hooks/useSubtitles"

interface PlayerSettingsProps {
    ref?: React.RefObject<HTMLDivElement | null>

    playbackRate: number
    onPlaybackRateChange: (rate: number) => void

    qualities: {
        index: number
        height: number
        label: string
    }[]

    currentQuality: number
    onQualityChange: (level: number) => void

    defaultTab?: string
    trigger?: React.ReactNode
}

export function PlayerSettings({ ref, playbackRate, onPlaybackRateChange, qualities, currentQuality, onQualityChange, defaultTab = "source", trigger }: PlayerSettingsProps) {
    const { t } = useTranslation("player")
    const { state, selectSource } = useMediaWatchContext()
    const { subtitles, selectedSubtitle, selectSubtitle } = useSubtitles()

    const sources = useMemo(() => {
        return state.media?.playback.sources || []
    }, [state.media?.playback.sources])

    const selectedSource = state.media?.playback.selectedSource

    // Group sources into distinct servers per provider
    const groupedServers = useMemo(() => {
        const groups: Record<string, { serverName: string; primarySource: (typeof sources)[0]; allSources: typeof sources }[]> = {}

        const providerMap = new Map<string, typeof sources>()
        sources.forEach((s) => {
            const pKey = s.provider.name || s.provider.id
            if (!providerMap.has(pKey)) {
                providerMap.set(pKey, [])
            }
            providerMap.get(pKey)!.push(s)
        })

        providerMap.forEach((pSources, providerName) => {
            groups[providerName] = []

            // Group by distinct stream variant (e.g. language or separate feed)
            const distinctStreams = new Map<string, typeof sources>()
            pSources.forEach((s) => {
                const streamKey = (s.audioTracks?.map((a) => a.language).join(",") || "default") + ":" + s.type
                if (!distinctStreams.has(streamKey)) {
                    distinctStreams.set(streamKey, [])
                }
                distinctStreams.get(streamKey)!.push(s)
            })

            let serverIdx = 1
            distinctStreams.forEach((streamSources) => {
                const primary = streamSources[0]
                groups[providerName].push({
                    serverName: distinctStreams.size > 1 ? `Server ${serverIdx}` : `Server 1`,
                    primarySource: primary,
                    allSources: streamSources,
                })
                serverIdx++
            })
        })

        return groups
    }, [sources])

    // Aggregate all unique audio languages available across sources for the active media
    const availableAudioTracks = useMemo(() => {
        const trackMap = new Map<string, { label: string; language: string; source: (typeof sources)[0] }>()

        // First check the active provider's sources
        const activeProviderId = selectedSource?.provider.id || selectedSource?.provider.name
        const providerSources = sources.filter((s) => (s.provider.id || s.provider.name) === activeProviderId)

        providerSources.forEach((s) => {
            ;(s.audioTracks || []).forEach((t) => {
                const label = t.label || t.language || "Original"
                if (!trackMap.has(label.toLowerCase())) {
                    trackMap.set(label.toLowerCase(), {
                        label,
                        language: t.language || label,
                        source: s,
                    })
                }
            })
        })

        // Include any additional languages from other sources
        sources.forEach((s) => {
            ;(s.audioTracks || []).forEach((t) => {
                const label = t.label || t.language || "Original"
                if (!trackMap.has(label.toLowerCase())) {
                    trackMap.set(label.toLowerCase(), {
                        label,
                        language: t.language || label,
                        source: s,
                    })
                }
            })
        })

        return Array.from(trackMap.values())
    }, [sources, selectedSource])

    return (
        <Popover>
            <PopoverTrigger asChild>
                {trigger ? (
                    trigger
                ) : (
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" title={t("controls.settings")}>
                        <Settings className="h-5 w-5" />
                    </Button>
                )}
            </PopoverTrigger>
            <PopoverContent ref={ref} align="end" className="w-full min-w-80 bg-black/80 backdrop-blur-md border border-zinc-800">
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList className="w-full justify-start p-0">
                        <TabsTrigger value="source">
                            <HardDrive className="mr-2" />
                            {t("settings.tabs.source")}
                        </TabsTrigger>
                        <TabsTrigger value="subtitles">
                            <Captions className="mr-2" />
                            {t("settings.tabs.subtitles")}
                        </TabsTrigger>
                        <TabsTrigger value="audio">
                            <Volume2 className="mr-2" />
                            {t("settings.tabs.audio")}
                        </TabsTrigger>

                        <TabsTrigger value="quality">
                            <Clapperboard className="mr-2" />
                            Quality
                        </TabsTrigger>

                        <TabsTrigger value="speed">
                            <Gauge className="mr-2" />
                            Speed
                        </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-72">
                        <TabsContent value="source" className="m-0 p-2">
                            {Object.entries(groupedServers).map(([provider, servers]) => (
                                <div key={provider} className="mb-4 last:mb-0">
                                    <div className="px-2 py-1 text-xs font-bold tracking-wider text-primary uppercase">{provider}</div>
                                    <div className="mt-1 space-y-1">
                                        {servers.map((srv, idx) => {
                                            const isSelected = selectedSource && srv.allSources.some((s) => s.url === selectedSource.url)
                                            return (
                                                <button
                                                    key={`${provider}-${idx}`}
                                                    onClick={() => selectSource(srv.primarySource)}
                                                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors ${
                                                        isSelected ? "bg-primary/20 text-primary border border-primary/40" : "text-zinc-300 hover:bg-zinc-800"
                                                    }`}
                                                >
                                                    <span className="text-sm font-medium">{srv.serverName}</span>
                                                    {isSelected && <Check className="h-4 w-4" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4 pt-2 border-t border-zinc-800">
                                <button
                                    onClick={async () => {
                                        const omssUrl = import.meta.env.VITE_OMSS_API_URL || ""
                                        await fetch(`${omssUrl}/v1/cache/clear`).catch(() => {})
                                        window.location.reload()
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-800/80 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                                >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Clear Cache & Re-fetch Sources
                                </button>
                            </div>
                        </TabsContent>

                        <TabsContent value="subtitles" className="m-0 p-2">
                            <button
                                onClick={() => selectSubtitle(undefined)}
                                className={`flex w-full items-center justify-between rounded-md px-2 py-2 transition-colors ${
                                    !selectedSubtitle ? "bg-primary/20 text-primary" : "text-zinc-300 hover:bg-zinc-800"
                                }`}
                            >
                                <span className="text-sm font-medium">{t("selectors.subtitlesOff")}</span>
                                {!selectedSubtitle && <Check className="" />}
                            </button>
                            {subtitles.map((sub, idx) => (
                                <button
                                    key={`${sub.url}-${idx}`}
                                    onClick={() => selectSubtitle(sub)}
                                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 transition-colors ${
                                        selectedSubtitle?.url === sub.url ? "bg-primary/20 text-primary" : "text-zinc-300 hover:bg-zinc-800"
                                    }`}
                                >
                                    <span className="text-sm font-medium">{sub.label}</span>
                                    {selectedSubtitle?.url === sub.url && <Check className="" />}
                                </button>
                            ))}
                        </TabsContent>

                        <TabsContent value="audio" className="m-0 p-2">
                            {availableAudioTracks.length > 0 ? (
                                availableAudioTracks.map((track, idx) => {
                                    const isSelected = selectedSource?.audioTracks?.some(
                                        (a) => (a.label || a.language || "").toLowerCase() === track.label.toLowerCase()
                                    )
                                    return (
                                        <button
                                            key={`${track.language}-${idx}`}
                                            onClick={() => {
                                                if (track.source && track.source.url !== selectedSource?.url) {
                                                    selectSource(track.source)
                                                }
                                            }}
                                            className={`flex w-full items-center justify-between rounded-md px-3 py-2 transition-colors ${
                                                isSelected ? "bg-primary/20 text-primary border border-primary/40" : "text-zinc-300 hover:bg-zinc-800"
                                            }`}
                                        >
                                            <span className="text-sm font-medium">{track.label || track.language}</span>
                                            {isSelected && <Check className="h-4 w-4" />}
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="p-4 text-center text-sm text-zinc-500">{t("settings.noAudioTracks")}</div>
                            )}
                        </TabsContent>

                        <TabsContent value="speed" className="m-0 p-2">
                            {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((speed) => (
                                <button
                                    key={speed}
                                    onClick={() => onPlaybackRateChange(speed)}
                                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 transition-colors ${
                                        playbackRate === speed ? "bg-primary/20 text-primary-foreground" : ""
                                    }`}
                                >
                                    <span className="text-sm font-medium">{speed}x</span>

                                    {playbackRate === speed && <Check className="" />}
                                </button>
                            ))}
                        </TabsContent>

                        <TabsContent value="quality" className="m-0 p-2">
                            <button
                                onClick={() => onQualityChange(-1)}
                                className={`flex w-full items-center justify-between rounded-md px-2 py-2 transition-colors ${currentQuality === -1 ? "bg-primary/20 text-primary" : ""}`}
                            >
                                <span className="text-sm font-medium">Auto</span>

                                {currentQuality === -1 && <Check className="" />}
                            </button>

                            {qualities.map((quality) => (
                                <button
                                    key={quality.index}
                                    onClick={() => onQualityChange(quality.index)}
                                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 transition-colors ${
                                        currentQuality === quality.index ? "bg-primary/20 text-primary" : ""
                                    }`}
                                >
                                    <span className="text-sm font-medium">{quality.label}</span>

                                    {currentQuality === quality.index && <Check className="" />}
                                </button>
                            ))}
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </PopoverContent>
        </Popover>
    )
}
