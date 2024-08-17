import { type Decoder } from '@redwoodjs/api';
export declare const messageForSupabaseSettingsError: (envar: string) => string;
export declare const throwSupabaseSettingsError: (envar: string) => never;
/**
 * Decodes a Supabase JWT with Bearer token or uses createServerClient verify an authenticated cookie header request
 */
export declare const authDecoder: Decoder;
//# sourceMappingURL=decoder.d.ts.map