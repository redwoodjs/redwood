import type { LocationContextType } from './location.js';
export type LoadingState = 'PRE_SHOW' | 'SHOW_LOADING' | 'DONE';
export type LoadingStateRecord = Record<string, {
    specName: string;
    state: LoadingState;
    page: React.ComponentType<unknown>;
    location: LocationContextType;
} | undefined>;
interface ActivePageState {
    loadingState: LoadingStateRecord;
}
export declare const ActivePageContextProvider: import("react").Provider<ActivePageState | undefined>;
export declare const useActivePageContext: () => ActivePageState;
export {};
//# sourceMappingURL=ActivePageContext.d.ts.map