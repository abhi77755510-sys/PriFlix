import React, { useState } from "react"
import { Server, Volume2, Sparkles, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface PrePlayConfig {
    server: string
    audioLanguage: string
}

interface PrePlaySelectorProps {
    onPlay: (config: PrePlayConfig) => void
    defaultServer?: string
    defaultAudio?: string
}

const AVAILABLE_SERVERS = [
    { id: "auto", name: "Auto Fast (Best Provider)", badge: "Recommended" },
    { id: "fshare", name: "Server 1 (FshareTV)", badge: "High Bitrate" },
    { id: "cinesu", name: "Server 2 (CineSu Glendale)", badge: "Multi-Sub" },
    { id: "vidlink", name: "Server 3 (VidLink Decrypted)", badge: "1080p Direct" },
    { id: "vidnest", name: "Server 4 (VidNest Multi-Audio)", badge: "Regional Dubs" },
]

const AVAILABLE_LANGUAGES = [
    { id: "all", label: "Auto / Original", badge: "Default" },
    { id: "tamil", label: "Tamil", badge: "Regional" },
    { id: "hindi", label: "Hindi", badge: "Regional" },
    { id: "telugu", label: "Telugu", badge: "Regional" },
    { id: "english", label: "English", badge: "Original" },
]

export function PrePlaySelector({ onPlay, defaultServer = "auto", defaultAudio = "all" }: PrePlaySelectorProps) {
    const [selectedServer, setSelectedServer] = useState<string>(defaultServer)
    const [selectedAudio, setSelectedAudio] = useState<string>(defaultAudio)

    const handlePlayClick = () => {
        onPlay({
            server: selectedServer,
            audioLanguage: selectedAudio,
        })
    }

    return (
        <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-5 backdrop-blur-xl shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
                        <Sparkles className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold text-zinc-100 tracking-wide">Stream & Audio Configuration</span>
                </div>
                <span className="text-xs text-zinc-400 font-medium">Configure before playback</span>
            </div>

            {/* Server Selection */}
            <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <Server className="h-3.5 w-3.5 text-blue-400" />
                    Select Streaming Server:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_SERVERS.map((srv) => {
                        const isSelected = selectedServer === srv.id
                        return (
                            <button
                                key={srv.id}
                                type="button"
                                onClick={() => setSelectedServer(srv.id)}
                                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-xs font-medium transition-all ${
                                    isSelected
                                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/50 shadow-[0_0_12px_rgba(59,130,246,0.2)] scale-[1.01]"
                                        : "bg-zinc-900/60 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-white"
                                }`}
                            >
                                <span className="font-semibold">{srv.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isSelected ? "bg-blue-500/30 text-blue-300" : "bg-zinc-800 text-zinc-400"}`}>
                                    {srv.badge}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Audio Language Selection */}
            <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
                    <Volume2 className="h-3.5 w-3.5 text-red-400" />
                    Select Preferred Audio Track:
                </label>
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LANGUAGES.map((lang) => {
                        const isSelected = selectedAudio === lang.id
                        return (
                            <button
                                key={lang.id}
                                type="button"
                                onClick={() => setSelectedAudio(lang.id)}
                                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all ${
                                    isSelected
                                        ? "bg-red-600/20 text-red-400 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)] scale-105"
                                        : "bg-zinc-900/60 text-zinc-300 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-white"
                                }`}
                            >
                                <span>{lang.label}</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-400">{lang.badge}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Play Button CTA */}
            <div className="pt-2">
                <Button
                    onClick={handlePlayClick}
                    size="lg"
                    className="w-full sm:w-auto rounded-full bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-bold px-8 shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                    <Play className="mr-2 h-5 w-5 fill-white" />
                    Play Stream Now
                </Button>
            </div>
        </div>
    )
}
