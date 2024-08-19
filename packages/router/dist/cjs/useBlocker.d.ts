type BlockerState = 'IDLE' | 'BLOCKED';
interface UseBlockerOptions {
    when: boolean;
}
export declare function useBlocker({ when }: UseBlockerOptions): {
    state: BlockerState;
    confirm: () => void;
    abort: () => void;
};
export {};
//# sourceMappingURL=useBlocker.d.ts.map