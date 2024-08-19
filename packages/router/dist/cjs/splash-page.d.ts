import React from 'react';
type PathDefinition = string;
interface SplashPageProps {
    hasGeneratedRoutes: boolean;
    allStandardRoutes: Record<PathDefinition, {
        name: string | null;
        path: PathDefinition;
    }>;
}
export declare const SplashPage: ({ hasGeneratedRoutes, allStandardRoutes: routesMap, }: SplashPageProps) => React.JSX.Element;
export {};
//# sourceMappingURL=splash-page.d.ts.map