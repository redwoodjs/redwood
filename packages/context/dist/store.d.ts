import { AsyncLocalStorage } from 'async_hooks';
import type { GlobalContext } from './context.js';
/**
 * This returns a AsyncLocalStorage instance, not the actual store.
 * Should not be used by Redwood apps directly. The framework handles
 * this.
 */
export declare const getAsyncStoreInstance: () => AsyncLocalStorage<Map<string, GlobalContext>>;
//# sourceMappingURL=store.d.ts.map