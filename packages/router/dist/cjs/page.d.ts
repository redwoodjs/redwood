export interface Spec {
    name: string;
    prerenderLoader: (name?: string) => {
        default: React.ComponentType<unknown>;
    };
    LazyComponent: React.LazyExoticComponent<React.ComponentType<unknown>> | React.ComponentType<unknown>;
}
export declare function isSpec(specOrPage: Spec | React.ComponentType): specOrPage is Spec;
/**
 * Pages can be imported automatically or manually. Automatic imports are actually
 * objects and take the following form (which we call a 'spec'):
 *
 *   const WhateverPage = {
 *     name: 'WhateverPage',
 *     LazyComponent: lazy(() => import('src/pages/WhateverPage'))
 *     prerenderLoader: ...
 *   }
 *
 * Manual imports simply load the page:
 *
 *   import WhateverPage from 'src/pages/WhateverPage'
 *
 * Before passing a "page" to the PageLoader, we will normalize the manually
 * imported version into a spec.
 */
export declare function normalizePage(specOrPage: Spec | React.ComponentType<unknown>): Spec;
export type PageType = Spec | React.ComponentType<any> | ((props: any) => JSX.Element);
//# sourceMappingURL=page.d.ts.map