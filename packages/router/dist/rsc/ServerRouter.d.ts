import type { ReactNode } from 'react';
import React from 'react';
import type { RouterContextProviderProps } from '../router-context.js';
import type { TrailingSlashesTypes } from '../util.js';
export interface RouterProps extends Omit<RouterContextProviderProps, 'routes' | 'activeRouteName'> {
    trailingSlashes?: TrailingSlashesTypes;
    pageLoadingDelay?: number;
    children: ReactNode;
}
export declare const Router: React.FC<RouterProps>;
//# sourceMappingURL=ServerRouter.d.ts.map