import { makeFilePath } from "./utils.js";
const moduleMap = new Proxy(
  {},
  {
    get(_target, filePath) {
      return new Proxy(
        {},
        {
          get(_target2, name) {
            filePath = makeFilePath(filePath);
            const manifestEntry = {
              id: filePath,
              chunks: [filePath],
              name
            };
            return manifestEntry;
          }
        }
      );
    }
  }
);
export {
  moduleMap
};
