import type { SourceResponse } from "@omss/sdk"
import type { PlaybackBundle } from "../types/player.types"
import { mapSource, mapSubtitle } from "./source.mapper"
import { getPreferredSource } from "../utils/playback"

export function mapPlaybackResponse(
    response: SourceResponse,
    preferredServer?: string | null,
    preferredAudio?: string | null
): PlaybackBundle {
    const sources = response.sources.map(mapSource)
    const subtitles = response.subtitles.map(mapSubtitle)
    const selectedSource = getPreferredSource(sources, preferredServer, preferredAudio)

    // Aggregate audio tracks from the selected source
    const audioTracks = selectedSource?.audioTracks || (sources.length > 0 ? sources[0].audioTracks : [])

    let selectedAudioTrack = audioTracks.length > 0 ? audioTracks[0] : undefined
    if (preferredAudio && preferredAudio !== "all") {
        const target = preferredAudio.toLowerCase()
        const match = audioTracks.find((a) => {
            const lang = (a.language || "").toLowerCase()
            const label = (a.label || "").toLowerCase()
            return lang.includes(target) || label.includes(target)
        })
        if (match) selectedAudioTrack = match
    }

    return {
        sources,
        subtitles,
        audioTracks,
        selectedSource,
        selectedSubtitle: subtitles.length > 0 ? subtitles[0] : undefined,
        selectedAudioTrack,
    }
}
