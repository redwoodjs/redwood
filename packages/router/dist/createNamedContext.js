import { createContext } from "react";
function createNamedContext(name, defaultValue) {
  const Ctx = createContext(defaultValue);
  Ctx.displayName = name;
  return Ctx;
}
export {
  createNamedContext
};
