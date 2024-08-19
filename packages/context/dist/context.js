import { getAsyncStoreInstance } from "./store.js";
const createContextProxy = (target) => {
  return new Proxy(target, {
    get: (_target, property) => {
      const store = getAsyncStoreInstance().getStore();
      const ctx = store?.get("context") || {};
      return ctx[property];
    },
    set: (_target, property, newVal) => {
      const store = getAsyncStoreInstance().getStore();
      const ctx = store?.get("context") || {};
      ctx[property] = newVal;
      store?.set("context", ctx);
      return true;
    }
  });
};
let context = createContextProxy({});
const setContext = (newContext) => {
  context = createContextProxy(newContext);
  const store = getAsyncStoreInstance().getStore();
  store?.set("context", newContext);
  return context;
};
export {
  context,
  createContextProxy,
  setContext
};
