import React from 'react';
import type { Spec } from './page.js';
interface Props {
    path: string;
    spec: Spec;
    params?: Record<string, string>;
    whileLoadingPage?: () => React.ReactNode | null;
    children?: React.ReactNode;
}
export declare const ActiveRouteLoader: ({ spec, params, whileLoadingPage, }: Props) => React.JSX.Element;
export {};
//# sourceMappingURL=active-route-loader.d.ts.map