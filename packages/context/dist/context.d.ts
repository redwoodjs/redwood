export interface GlobalContext extends Record<string, unknown> {
}
export declare const createContextProxy: (target: GlobalContext) => GlobalContext;
export declare let context: GlobalContext;
/**
 * Set the contents of the global context object.
 *
 * This completely replaces the existing context values such as currentUser.
 *
 * If you wish to extend the context simply use the `context` object directly,
 * such as `context.magicNumber = 1`, or `setContext({ ...context, magicNumber: 1 })`
 */
export declare const setContext: (newContext: GlobalContext) => GlobalContext;
//# sourceMappingURL=context.d.ts.map