import { OmssClient } from "@omss/sdk"

export const omssService = {
    getMovieSources: async (client: OmssClient, id: string, server?: string | null) => {
        const baseUrl = client?.getBaseUrl?.() || "https://priflix-backend.onrender.com"
        let url = `${baseUrl}/v1/movies/${encodeURIComponent(id)}`
        if (server && server !== "auto" && server !== "all") {
            url += `?provider=${encodeURIComponent(server)}`
        }
        const res = await fetch(url)
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}))
            throw new Error(errJson?.error?.message || `Failed to fetch movie sources (${res.status})`)
        }
        return await res.json()
    },

    getTvSources: async (client: OmssClient, id: string, season: number, episode: number, server?: string | null) => {
        const baseUrl = client?.getBaseUrl?.() || "https://priflix-backend.onrender.com"
        let url = `${baseUrl}/v1/tv/${encodeURIComponent(id)}/seasons/${season}/episodes/${episode}`
        if (server && server !== "auto" && server !== "all") {
            url += `?provider=${encodeURIComponent(server)}`
        }
        const res = await fetch(url)
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}))
            throw new Error(errJson?.error?.message || `Failed to fetch TV sources (${res.status})`)
        }
        return await res.json()
    },

    refreshSource: async (client: OmssClient, responseId: string) => {
        const result = await client.refreshSource(responseId)
        if (result.error) throw new Error(result.error.error.message)
        return result.data
    },
}
