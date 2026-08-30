import type { FastifyInstance } from "fastify"
import helmet from "@fastify/helmet"

export async function registerHelmetPlugin(app: FastifyInstance) {
    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                upgradeInsecureRequests: null,

                connectSrc: ["'self'", "http:", "https:", "ws:", "wss:", "https://api.themoviedb.org", "https://image.tmdb.org", app.config.VITE_TMDB_BASE_URL ?? "", app.config.VITE_STANDALONE ? "*" : (app.config.VITE_OMSS_API_URL ?? "")],

                imgSrc: ["'self'", "data:", "https:", "http:"],

                scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],

                styleSrc: ["'self'", "'unsafe-inline'"],

                mediaSrc: ["'self'", "https:", "http:", "blob:"],
                fontSrc: ["'self'", "https:", "http:", "data:"],

                objectSrc: ["'none'"],

                baseUri: ["'self'"],
                formAction: ["'self'"],

                frameAncestors: ["'self'"],

                frameSrc: ["'self'", "https://www.youtube-nocookie.com"],

                childSrc: ["'self'", "https://www.youtube-nocookie.com"],
            },
        },

        referrerPolicy: {
            policy: "strict-origin-when-cross-origin",
        },

        crossOriginOpenerPolicy: { policy: "same-origin" },
        crossOriginResourcePolicy: { policy: "same-origin" },
    })
}
