import React from 'react';
export interface ParamsContextProps {
    params: Record<string, string>;
}
export declare const ParamsContext: React.Context<ParamsContextProps | undefined>;
interface Props {
    allParams?: Record<any, any>;
    children?: React.ReactNode;
}
export declare const ParamsProvider: React.FC<Props>;
export declare const useParams: () => Record<string, string>;
export {};
//# sourceMappingURL=params.d.ts.map