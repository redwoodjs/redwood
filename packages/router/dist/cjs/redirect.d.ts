import type { NavigateOptions } from './history.js';
interface RedirectProps {
    /** The path to redirect to */
    to: string;
    options?: NavigateOptions;
}
/**
 * A declarative way to redirect to a route name
 */
export declare const Redirect: ({ to, options }: RedirectProps) => null;
export {};
//# sourceMappingURL=redirect.d.ts.map