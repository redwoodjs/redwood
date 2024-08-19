import { AsyncLocalStorage } from "async_hooks";
let CONTEXT_STORAGE;
const getAsyncStoreInstance = () => {
  if (!CONTEXT_STORAGE) {
    CONTEXT_STORAGE = new AsyncLocalStorage();
  }
  return CONTEXT_STORAGE;
};
export {
  getAsyncStoreInstance
};
