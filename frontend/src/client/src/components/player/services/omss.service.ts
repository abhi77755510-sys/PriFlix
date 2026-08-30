import { OmssClient } from "@omss/sdk"

export const omssService = {
    getMovieSources: async (client: OmssClient, id: string) => {
        const result = await client.getMovie(id)
        if (result.error) throw new Error(result.error.error.message)
        return result.data
    },

    getTvSources: async (client: OmssClient, id: string, season: number, episode: number) => {
        const result = await client.getTvEpisode(id, season, episode)
        if (result.error) throw new Error(result.error.error.message)
        return result.data
    },

    refreshSource: async (client: OmssClient, responseId: string) => {
        const result = await client.refreshSource(responseId)
        if (result.error) throw new Error(result.error.error.message)
        return result.data
    },
}
