import type { ReactElement, ReactNode } from 'react';
import type { PageType } from './page.js';
import { type ParamType } from './util.js';
type WhileLoadingPage = () => ReactElement | null;
export type GeneratedRoutesMap = {
    [key: string]: (args?: Record<string | number, string | number | boolean>) => string;
};
export type Wrappers = ((props: any) => ReactNode)[];
interface Set {
    id: string;
    wrappers: Wrappers;
    isPrivate: boolean;
    props: {
        private?: boolean;
        [key: string]: unknown;
    };
}
type RoutePath = string;
/**
 * This is essentially the same as RouteProps
 * but it allows for page and redirect to be null or undefined
 * Keeping the shape consistent makes it easier to use
 */
interface AnalyzedRoute {
    path: RoutePath;
    name: string | null;
    whileLoadingPage?: WhileLoadingPage;
    page: PageType | null;
    redirect: string | null;
    sets: Set[];
}
interface AnalyzeRoutesOptions {
    currentPathName: string;
    userParamTypes?: Record<string, ParamType>;
}
export declare function analyzeRoutes(children: ReactNode, { currentPathName, userParamTypes }: AnalyzeRoutesOptions): {
    pathRouteMap: Record<string, AnalyzedRoute>;
    namedRoutesMap: GeneratedRoutesMap;
    hasRootRoute: boolean;
    NotFoundPage: PageType | undefined;
    activeRoutePath: string | undefined;
};
export {};
//# sourceMappingURL=analyzeRoutes.d.ts.map