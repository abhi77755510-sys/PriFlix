import { OmssClient } from "@omss/sdk"

const getEnvBaseUrl = () => import.meta.env.VITE_OMSS_API_URL || ""

function normalizeResponseUrls(data: any, baseUrl: string) {
    if (!data || !baseUrl) return data
    try {
        const baseOrigin = new URL(baseUrl).origin
        const normalizeBackendUrl = (url: string) => {
            const parsed = new URL(url)
            const isBackendRoute = parsed.pathname.startsWith('/v1/proxy') ||
                parsed.pathname.startsWith('/m/v1/') ||
                parsed.pathname.startsWith('/subtitles/')
            return isBackendRoute ? `${baseOrigin}${parsed.pathname}${parsed.search}` : url
        }
        if (Array.isArray(data.sources)) {
            data.sources = data.sources.map((s: any) => {
                if (s?.url) {
                    try {
                        s.url = normalizeBackendUrl(s.url)
                    } catch {}
                }
                return s
            })
        }
        if (Array.isArray(data.subtitles)) {
            data.subtitles = data.subtitles.map((sub: any) => {
                if (sub?.url) {
                    try {
                        sub.url = normalizeBackendUrl(sub.url)
                    } catch {}
                }
                return sub
            })
        }
    } catch {}
    return data
}

export const omssService = {
    getMovieSources: async (_client: OmssClient, id: string, server?: string | null) => {
        const baseUrl = getEnvBaseUrl()
        let url = `${baseUrl}/v1/movies/${encodeURIComponent(id)}`
        if (server && server !== "auto" && server !== "all") {
            url += `?provider=${encodeURIComponent(server)}`
        }
        const res = await fetch(url)
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}))
            throw new Error(errJson?.error?.message || `Failed to fetch movie sources (${res.status})`)
        }
        const json = await res.json()
        return normalizeResponseUrls(json, baseUrl)
    },

    getTvSources: async (_client: OmssClient, id: string, season: number, episode: number, server?: string | null) => {
        const baseUrl = getEnvBaseUrl()
        let url = `${baseUrl}/v1/tv/${encodeURIComponent(id)}/seasons/${season}/episodes/${episode}`
        if (server && server !== "auto" && server !== "all") {
            url += `?provider=${encodeURIComponent(server)}`
        }
        const res = await fetch(url)
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}))
            throw new Error(errJson?.error?.message || `Failed to fetch TV sources (${res.status})`)
        }
        const json = await res.json()
        return normalizeResponseUrls(json, baseUrl)
    },

    refreshSource: async (client: OmssClient, responseId: string) => {
        const result = await client.refreshSource(responseId)
        if (result.error) throw new Error(result.error.error.message)
        return result.data
    },
}
