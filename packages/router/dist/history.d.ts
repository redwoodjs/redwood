export interface NavigateOptions {
    replace?: boolean;
}
export type Listener = (ev?: PopStateEvent) => any;
export type BeforeUnloadListener = (ev: BeforeUnloadEvent) => any;
export type BlockerCallback = (tx: {
    retry: () => void;
}) => void;
export type Blocker = {
    id: string;
    callback: BlockerCallback;
};
declare const gHistory: {
    listen: (listener: Listener) => string;
    navigate: (to: string, options?: NavigateOptions) => void;
    back: () => void;
    remove: (listenerId: string) => void;
    block: (id: string, callback: BlockerCallback) => void;
    unblock: (id: string) => void;
};
declare const navigate: (to: string, options?: NavigateOptions) => void, back: () => void, block: (id: string, callback: BlockerCallback) => void, unblock: (id: string) => void;
export { gHistory, navigate, back, block, unblock };
//# sourceMappingURL=history.d.ts.map