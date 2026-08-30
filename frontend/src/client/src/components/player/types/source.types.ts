import type { SourceType, SubtitleFormat } from "@omss/sdk"

export interface NormalizedSource {
    url: string
    type: SourceType
    quality: string
    provider: {
        id: string
        name: string
    }
    audioTracks: NormalizedAudioTrack[]
}

export interface NormalizedSubtitle {
    url: string
    label: string
    format: SubtitleFormat
}

export interface NormalizedAudioTrack {
    language: string
    label: string
}
