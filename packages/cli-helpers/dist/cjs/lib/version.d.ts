/**
 * Check if the package at the given version is compatible with the current version of the user's RedwoodJS project. This is
 * determined by checking if the package's engines.redwoodjs field intersects with the user's RedwoodJS version.
 *
 * If the preferred version is not compatible, the latest compatible version will be returned if one exists.
 */
export declare function getCompatibilityData(packageName: string, preferredVersionOrTag: string): Promise<{
    preferred: {
        tag: string | undefined;
        version: string;
    };
    compatible: {
        tag: string | undefined;
        version: string;
    };
}>;
//# sourceMappingURL=version.d.ts.map