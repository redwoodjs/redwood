import React from 'react';
import type { Spec } from '../page.js';
interface Props {
    path: string;
    spec: Spec;
    params?: Record<string, string>;
    whileLoadingPage?: () => React.ReactNode | null;
    children?: React.ReactNode;
}
export declare const ServerRouteLoader: ({ spec, params }: Props) => React.JSX.Element;
export {};
//# sourceMappingURL=ServerRouteLoader.d.ts.map