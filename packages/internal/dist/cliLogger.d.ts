type CLog = (typeof console)['log'];
/**
 * An alternative to createLogger which supports the same logging levels
 * but allows for full ANSI when printing to the console.
 */
export declare const cliLogger: CLog & {
    trace: CLog;
    debug: CLog;
};
export {};
//# sourceMappingURL=cliLogger.d.ts.map