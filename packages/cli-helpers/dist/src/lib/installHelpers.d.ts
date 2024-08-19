export declare const addWebPackages: (webPackages: string[]) => {
    title: string;
    task: () => Promise<void>;
};
export declare const addApiPackages: (apiPackages: string[]) => {
    title: string;
    task: () => Promise<void>;
};
export declare const addRootPackages: (packages: string[], devDependency?: boolean) => {
    title: string;
    task: () => Promise<void>;
};
export declare const installPackages: {
    title: string;
    task: () => Promise<void>;
};
//# sourceMappingURL=installHelpers.d.ts.map