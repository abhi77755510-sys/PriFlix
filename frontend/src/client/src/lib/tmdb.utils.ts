import type { CountryISO3166_1 } from "@lorenzopant/tmdb"

export function getCountry(): CountryISO3166_1 | undefined {
    try {
        const locale = new Intl.Locale(navigator.language)
        if (locale.region) return locale.region as unknown as CountryISO3166_1
    } catch {
        // continue
    }

    const fallback = navigator.language.split("-")[1]
    if (fallback) return fallback.toUpperCase() as unknown as CountryISO3166_1

    return undefined
}
