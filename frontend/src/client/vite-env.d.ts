/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TMDB_API_KEY: string
    readonly VITE_TMDB_BASE_URL?: string
    readonly VITE_OMSS_API_URL?: string
    readonly VITE_STANDALONE: boolean
    readonly NODE_ENV: "development" | "production"
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
