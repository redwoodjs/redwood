/**
 * gets the announcement for the new page.
 * called in one of active-route-loader's `useEffect`.
 *
 * the order of priority is:
 * 1. RouteAnnouncement (the most specific one)
 * 2. h1
 * 3. document.title
 * 4. location.pathname
 */
export declare const getAnnouncement: () => string;
export declare const getFocus: () => HTMLElement | null;
export declare const resetFocus: () => void;
//# sourceMappingURL=a11yUtils.d.ts.map