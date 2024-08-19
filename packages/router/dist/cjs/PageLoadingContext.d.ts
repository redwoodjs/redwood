import React from 'react';
export interface PageLoadingContextInterface {
    loading: boolean;
    setPageLoadingContext: (loading: boolean) => void;
    delay?: number;
}
interface Props {
    children: React.ReactNode;
    delay?: number;
}
export declare const PageLoadingContextProvider: React.FC<Props>;
export declare const usePageLoadingContext: () => PageLoadingContextInterface;
export {};
//# sourceMappingURL=PageLoadingContext.d.ts.map