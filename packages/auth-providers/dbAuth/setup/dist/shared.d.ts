export declare const libPath: string;
export declare const functionsPath: string;
export declare const getModelNames: () => Promise<string[]>;
export declare const hasModel: (name: string) => Promise<boolean>;
export declare function addModels(models: string): Promise<void>;
export declare function hasAuthPages(): boolean;
export declare function generateAuthPagesTask(generatingUserModel: boolean): {
    title: string;
    task: () => Promise<void>;
};
//# sourceMappingURL=shared.d.ts.map