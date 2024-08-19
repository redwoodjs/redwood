type SSRModuleMap = null | {
    [clientId: string]: {
        [clientExportName: string]: ClientReferenceManifestEntry;
    };
};
type ClientReferenceManifestEntry = ImportManifestEntry;
type ImportManifestEntry = {
    id: string;
    chunks: string[];
    name: string;
};
export declare const moduleMap: SSRModuleMap;
export {};
//# sourceMappingURL=ssrModuleMap.d.ts.map