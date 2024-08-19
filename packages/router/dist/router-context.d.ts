import React from 'react';
import type { AuthContextInterface } from '@redwoodjs/auth' with { 'resolution-mode': 'import' };
import type { analyzeRoutes } from './analyzeRoutes.js';
import type { ParamType } from './util.js';
type UseAuth = () => AuthContextInterface<unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown, unknown>;
export interface RouterState {
    paramTypes?: Record<string, ParamType>;
    useAuth: UseAuth;
    routes: ReturnType<typeof analyzeRoutes>;
    activeRouteName?: string | undefined | null;
}
export interface RouterContextProviderProps extends Omit<RouterState, 'useAuth'> {
    useAuth?: UseAuth;
    routes: ReturnType<typeof analyzeRoutes>;
    activeRouteName?: string | undefined | null;
    children: React.ReactNode;
}
export declare const RouterContextProvider: React.FC<RouterContextProviderProps>;
export declare const useRouterState: () => RouterState;
export {};
//# sourceMappingURL=router-context.d.ts.map