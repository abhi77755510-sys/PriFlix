import { createRoot } from "react-dom/client"

// Intercept and proxy TMDB API requests if VITE_TMDB_BASE_URL is configured
const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let url = '';
    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof URL) {
        url = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
        url = (input as any).url;
    }

    if (url && url.includes('api.themoviedb.org')) {
        const tmdbBaseUrl = import.meta.env.VITE_TMDB_BASE_URL;
        if (tmdbBaseUrl) {
            const baseUrlClean = tmdbBaseUrl.endsWith('/') ? tmdbBaseUrl.slice(0, -1) : tmdbBaseUrl;
            const newUrl = url.replace('https://api.themoviedb.org', baseUrlClean);
            if (typeof input === 'string') {
                input = newUrl;
            } else if (input instanceof URL) {
                input = new URL(newUrl);
            } else if (input && typeof input === 'object' && 'url' in input) {
                input = new Request(newUrl, input as Request);
            }
        }
    }
    return originalFetch.call(this, input, init);
};
import "@/index.css"
import App from "@/app/App"
import AppProviders from "@/app/AppProviders"
import { AppSettingsProvider } from "@/app/providers/settings-provider.tsx"

createRoot(document.getElementById("root")!).render(
    <AppSettingsProvider>
        <AppProviders>
            <App />
        </AppProviders>
    </AppSettingsProvider>
)
