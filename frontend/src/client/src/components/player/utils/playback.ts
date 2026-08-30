import type { NormalizedSource } from "../types/source.types"

export function getPreferredSource(
    sources: NormalizedSource[],
    preferredServer?: string | null,
    preferredAudio?: string | null
): NormalizedSource | undefined {
    if (sources.length === 0) return undefined

    let filtered = [...sources]

    // 1. Filter / prioritize by preferred server if specified
    if (preferredServer && preferredServer !== "auto") {
        const srvMatch = filtered.filter((s) => {
            const pId = (s.provider?.id || "").toLowerCase()
            const pName = (s.provider?.name || "").toLowerCase()
            const target = preferredServer.toLowerCase()
            return pId.includes(target) || pName.includes(target)
        })
        if (srvMatch.length > 0) {
            filtered = srvMatch
        }
    }

    // 2. Filter / prioritize by preferred audio language if specified
    if (preferredAudio && preferredAudio !== "all") {
        const target = preferredAudio.toLowerCase()
        const audioMatch = filtered.filter((s) => {
            return (s.audioTracks || []).some((a) => {
                const lang = (a.language || "").toLowerCase()
                const label = (a.label || "").toLowerCase()
                return lang.includes(target) || label.includes(target)
            })
        })
        if (audioMatch.length > 0) {
            return audioMatch[0]
        }

        // If not found in the filtered server subset, search across all available sources
        const globalAudioMatch = sources.filter((s) => {
            return (s.audioTracks || []).some((a) => {
                const lang = (a.language || "").toLowerCase()
                const label = (a.label || "").toLowerCase()
                return lang.includes(target) || label.includes(target)
            })
        })
        if (globalAudioMatch.length > 0) {
            return globalAudioMatch[0]
        }
    }

    // Sort by quality (assume higher quality is better)
    const sorted = [...filtered].sort((a, b) => {
        const qA = parseInt(a.quality) || 0
        const qB = parseInt(b.quality) || 0
        return qB - qA
    })

    // Prefer HLS for streaming if available
    const hls = sorted.find((s) => s.type === "hls")
    if (hls) return hls

    return sorted[0] || sources[0]
}

export function isHls(url: string): boolean {
    return url.includes(".m3u8")
}

export function isDash(url: string): boolean {
    return url.includes(".mpd")
}
