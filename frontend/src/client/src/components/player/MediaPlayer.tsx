import React, { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { useTranslation } from "react-i18next"
import { usePlayerState } from "./hooks/usePlayerState"
import { PlayerControls } from "./PlayerControls"
import { LoadingState } from "./LoadingState"
import { useEpisodeAutoplay } from "./hooks/useEpisodeAutoplay"
import { EpisodeAutoplayOverlay } from "./EpisodeAutoplayOverlay"
import { useSubtitles } from "@/components/player/hooks/useSubtitles.ts"
import { CustomSubtitles } from "@/components/player/CustomSubtitles"

export function MediaPlayer() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const hlsRef = useRef<Hls | null>(null)

    const { media, isPlaying, isLoading, currentTime, duration, volume, isMuted, setIsPlaying, setIsLoading, setCurrentTime, setDuration, setVolume, setIsMuted, setError } = usePlayerState()
    const { t } = useTranslation("player")

    const { handleEpisodeEnded } = useEpisodeAutoplay()
    const { selectedSubtitle } = useSubtitles()

    const [showControls, setShowControls] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showAutoplay, setShowAutoplay] = useState(false)
    const [isPiP, setIsPiP] = useState(false)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [qualities, setQualities] = useState<
        {
            index: number
            height: number
            label: string
        }[]
    >([])

    const [currentQuality, setCurrentQuality] = useState(-1)
    const [bufferedTime, setBufferedTime] = useState(0)

    const controlsTimeoutRef = useRef<number | null>(null)

    const selectedSource = media?.playback.selectedSource

    const updateBuffered = () => {
        const video = videoRef.current
        if (video && video.buffered && video.buffered.length > 0) {
            const curTime = video.currentTime
            for (let i = 0; i < video.buffered.length; i++) {
                if (video.buffered.start(i) <= curTime && curTime <= video.buffered.end(i)) {
                    setBufferedTime(video.buffered.end(i))
                    return
                }
            }
            // Fallback to highest buffered end
            setBufferedTime(video.buffered.end(video.buffered.length - 1))
        }
    }

    // Initialize HLS or Native Video
    useEffect(() => {
        const video = videoRef.current
        if (!video || !selectedSource) return

        setIsLoading(true)
        setBufferedTime(0)

        if (selectedSource.type === "hls") {
            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: false,
                    startFragPrefetch: true, // Aggressive prefetch next fragments
                    maxBufferLength: 120, // Buffer up to 120 seconds ahead
                    maxMaxBufferLength: 300, // Buffer up to 5 minutes ahead
                    maxBufferSize: 120 * 1000 * 1000, // 120MB buffer memory
                    maxBufferHole: 0.5,
                    progressive: true,
                    nudgeMaxRetry: 5,
                })
                hls.loadSource(selectedSource.url)
                hls.attachMedia(video)
                hlsRef.current = hls

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (isPlaying) video.play().catch(() => setIsPlaying(false))
                    const levels = hls.levels.map((level, index) => ({
                        index,
                        height: level.height,
                        label: `${level.height}p`,
                    }))

                    setQualities(levels)
                    setIsLoading(false)
                })

                hls.on(Hls.Events.BUFFER_APPENDED, () => {
                    updateBuffered()
                })

                hls.on(Hls.Events.FRAG_BUFFERED, () => {
                    updateBuffered()
                })

                hls.on(Hls.Events.ERROR, (_, data) => {
                    if (data.fatal) {
                        setError(`HLS Fatal Error: ${data.type}`)
                    }
                })
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = selectedSource.url
            }
        } else {
            video.src = selectedSource.url
            if (isPlaying) video.play().catch(() => setIsPlaying(false))

            // Extract all quality options for this direct provider
            const providerSources = (media?.playback.sources || []).filter(
                (s) => s.provider.id === selectedSource.provider.id || s.provider.name === selectedSource.provider.name
            )

            const uniqueMap = new Map<string, { index: number; height: number; label: string }>()
            providerSources.forEach((s, idx) => {
                const rawQ = (s.quality || "Auto").trim()
                const qLabel = rawQ.toLowerCase().endsWith("p") || rawQ.toLowerCase() === "auto" ? rawQ : `${rawQ}p`
                if (!uniqueMap.has(qLabel)) {
                    const h = parseInt(qLabel) || 0
                    uniqueMap.set(qLabel, {
                        index: idx,
                        height: h,
                        label: qLabel,
                    })
                }
            })

            const directQualities = Array.from(uniqueMap.values()).sort((a, b) => b.height - a.height)
            setQualities(directQualities)

            const curQ = selectedSource.quality || "Auto"
            const curQLabel = curQ.toLowerCase().endsWith("p") || curQ.toLowerCase() === "auto" ? curQ : `${curQ}p`
            const activeMatch = directQualities.find((q) => q.label.toLowerCase() === curQLabel.toLowerCase())
            setCurrentQuality(activeMatch ? activeMatch.index : -1)
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
            }
        }
    }, [selectedSource, setError, setIsLoading, setIsPlaying, media?.playback.sources])

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate
        }
    }, [playbackRate])

    // Sync isPlaying state
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        if (isPlaying) {
            video.play().catch(() => setIsPlaying(false))
        } else {
            video.pause()
        }
    }, [isPlaying, setIsPlaying])

    // Sync volume/mute to video element
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = isMuted ? 0 : volume
            videoRef.current.muted = isMuted
        }
    }, [volume, isMuted])

    useEffect(() => {
        const video = videoRef.current

        if (!video) return

        const handleEnterPiP = () => setIsPiP(true)
        const handleLeavePiP = () => setIsPiP(false)

        video.addEventListener("enterpictureinpicture", handleEnterPiP)
        video.addEventListener("leavepictureinpicture", handleLeavePiP)

        return () => {
            video.removeEventListener("enterpictureinpicture", handleEnterPiP)
            video.removeEventListener("leavepictureinpicture", handleLeavePiP)
        }
    }, [])

    const pendingSeekTimeRef = useRef<number | null>(null)

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime)
            updateBuffered()
        }
    }

    const handleLoadedMetadata = () => {
        const video = videoRef.current
        if (video) {
            setDuration(video.duration)
            if (pendingSeekTimeRef.current !== null && pendingSeekTimeRef.current > 0) {
                video.currentTime = pendingSeekTimeRef.current
                pendingSeekTimeRef.current = null
            }
            setIsLoading(false)
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        if (media?.type === "tv" && media.episodeNumber !== undefined) {
            setShowAutoplay(true)
        }
    }

    const handleMouseMove = () => {
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
    }

    const togglePlay = () => setIsPlaying(!isPlaying)

    const handleSeek = (val: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = val[0]
            setCurrentTime(val[0])
            updateBuffered()
        }
    }

    const togglePictureInPicture = async () => {
        const video = videoRef.current

        if (!video) return

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture()
                setIsPiP(false)
            } else {
                await video.requestPictureInPicture()
                setIsPiP(true)
            }
        } catch (err) {
            console.error("PiP failed:", err)
        }
    }

    const handleQualityChange = (level: number) => {
        if (selectedSource?.type === "hls") {
            if (hlsRef.current) {
                hlsRef.current.currentLevel = level
                setCurrentQuality(level)
            }
        } else if (media && selectedSource) {
            const providerSources = (media.playback.sources || []).filter(
                (s) => s.provider.id === selectedSource.provider.id || s.provider.name === selectedSource.provider.name
            )

            const targetQuality = qualities.find((q) => q.index === level)
            if (!targetQuality) return

            const targetSource = providerSources.find((s) => {
                const rawQ = (s.quality || "Auto").trim()
                const qLabel = rawQ.toLowerCase().endsWith("p") || rawQ.toLowerCase() === "auto" ? rawQ : `${rawQ}p`
                return qLabel.toLowerCase() === targetQuality.label.toLowerCase()
            }) || providerSources[level]

            if (targetSource && targetSource.url !== selectedSource.url) {
                pendingSeekTimeRef.current = videoRef.current ? videoRef.current.currentTime : currentTime
                setCurrentQuality(level)
                selectSource(targetSource)
            }
        }
    }

    const toggleMute = () => setIsMuted(!isMuted)

    const handleVolumeChange = (val: number[]) => {
        setVolume(val[0])
        if (val[0] === 0) {
            setIsMuted(true)
        } else if (isMuted) {
            setIsMuted(false)
        }
    }

    const toggleFullscreen = () => {
        if (!containerRef.current) return
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen()
            setIsFullscreen(true)
        } else {
            document.exitFullscreen()
            setIsFullscreen(false)
        }
    }

    if (!selectedSource)
        return (
            <LoadingState
                message={
                    <div className={"flex flex-col items-center justify-center"}>
                        <span className={"text-lg"}>{t("states.resolving")}</span>
                        <span>{t("states.resolvingSub")}</span>
                    </div>
                }
            />
        )

    return (
        <div ref={containerRef} className="group relative h-screen w-full overflow-hidden" onMouseMove={handleMouseMove} onMouseLeave={() => setShowControls(false)}>
            <video
                ref={videoRef}
                className="h-full w-full"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onProgress={updateBuffered}
                onEnded={handleEnded}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onClick={togglePlay}
                preload="auto"
                crossOrigin="anonymous"
                poster={media?.backdropUrl.replace("w300", "original")}
                playsInline
            />

            {selectedSubtitle && <CustomSubtitles url={selectedSubtitle.url} currentTime={currentTime} />}

            {isLoading && !isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <LoadingState message={t("states.buffering")} />
                </div>
            )}

            <PlayerControls
                isPlaying={isPlaying}
                onDoubleClick={toggleFullscreen}
                onWheel={(e: React.WheelEvent<HTMLDivElement>) => {
                    // scroll up = increase volume
                    const delta = -e.deltaY * 0.001

                    const newVolume = Math.max(0, Math.min(1, volume + delta))

                    setVolume(newVolume)

                    if (newVolume === 0) {
                        setIsMuted(true)
                    } else if (isMuted) {
                        setIsMuted(false)
                    }
                }}
                currentTime={currentTime}
                onDivClick={togglePlay}
                duration={duration}
                volume={volume}
                isMuted={isMuted}
                isFullscreen={isFullscreen}
                onTogglePlay={togglePlay}
                onSeek={handleSeek}
                onToggleMute={toggleMute}
                onVolumeChange={handleVolumeChange}
                onToggleFullscreen={toggleFullscreen}
                show={showControls || !isPlaying}
                ref={containerRef}
                isPiP={isPiP}
                onTogglePiP={togglePictureInPicture}
                playbackRate={playbackRate}
                onPlaybackRateChange={setPlaybackRate}
                qualities={qualities}
                currentQuality={currentQuality}
                onQualityChange={handleQualityChange}
                buffered={bufferedTime}
            />

            <EpisodeAutoplayOverlay
                show={showAutoplay}
                onNext={() => {
                    setShowAutoplay(false)
                    handleEpisodeEnded()
                }}
                onCancel={() => setShowAutoplay(false)}
            />
        </div>
    )
}
