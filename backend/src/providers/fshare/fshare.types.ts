export interface FshareSource {
    src: string;
    type: string;
    label?: string;
    quality?: number | string;
}

export interface FshareFile {
    sources?: FshareSource[];
    backups?: FshareSource[];
    alternatives?: FshareSource[][];
}

export interface FshareResponse {
    status: string;
    data?: {
        file?: FshareFile;
    };
}
