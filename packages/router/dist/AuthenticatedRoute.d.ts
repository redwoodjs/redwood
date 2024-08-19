import React from 'react';
import type { GeneratedRoutesMap } from './analyzeRoutes.js';
interface AuthenticatedRouteProps {
    children: React.ReactNode | Thenable<React.ReactNode>;
    roles?: string | string[];
    unauthenticated: keyof GeneratedRoutesMap;
    whileLoadingAuth?: () => React.ReactElement | null;
}
export declare const AuthenticatedRoute: React.FC<AuthenticatedRouteProps>;
export {};
//# sourceMappingURL=AuthenticatedRoute.d.ts.map