"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var updateResolverTypes_yargs_exports = {};
__export(updateResolverTypes_yargs_exports, {
  command: () => command,
  description: () => description,
  handler: () => handler
});
module.exports = __toCommonJS(updateResolverTypes_yargs_exports);
var import_path = __toESM(require("path"));
var import_fast_glob = __toESM(require("fast-glob"));
var import_tasuku = __toESM(require("tasuku"));
var import_project_config = require("@redwoodjs/project-config");
var import_runTransform = __toESM(require("../../../lib/runTransform"));
const command = "update-resolver-types";
const description = '(v2.x.x->v3.x.x) Wraps types for "relation" resolvers in the bottom of service files';
const handler = () => {
  (0, import_tasuku.default)("Update Resolver Types", async ({ setOutput }) => {
    await (0, import_runTransform.default)({
      transformPath: import_path.default.join(__dirname, "updateResolverTypes.js"),
      // Target services written in TS only
      targetPaths: import_fast_glob.default.sync("**/*.ts", {
        cwd: (0, import_project_config.getPaths)().api.services,
        ignore: ["**/node_modules/**", "**/*.test.ts", "**/*.scenarios.ts"],
        absolute: true
      })
    });
    setOutput("All done! Run `yarn rw lint --fix` to prettify your code");
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  command,
  description,
  handler
});
