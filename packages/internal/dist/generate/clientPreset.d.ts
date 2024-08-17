export declare const shouldGenerateTrustedDocuments: () => boolean;
export declare const generateClientPreset: () => Promise<{
    clientPresetFiles: string[];
    trustedDocumentsStoreFile: never[];
    errors: {
        message: string;
        error: unknown;
    }[];
} | {
    clientPresetFiles: string[];
    trustedDocumentsStoreFile: string;
    errors: {
        message: string;
        error: unknown;
    }[];
}>;
//# sourceMappingURL=clientPreset.d.ts.map