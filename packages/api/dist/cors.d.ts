import type { PartialRequest } from './transforms';
export type CorsConfig = {
    origin?: boolean | string | string[];
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
};
export type CorsHeaders = Record<string, string>;
export type CorsContext = ReturnType<typeof createCorsContext>;
export declare function createCorsContext(cors: CorsConfig | undefined): {
    shouldHandleCors(request: PartialRequest): boolean;
    getRequestHeaders(request: PartialRequest): CorsHeaders;
};
//# sourceMappingURL=cors.d.ts.map