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
var useArmor_yargs_exports = {};
__export(useArmor_yargs_exports, {
  command: () => command,
  description: () => description,
  handler: () => handler
});
module.exports = __toCommonJS(useArmor_yargs_exports);
var import_path = __toESM(require("path"));
var import_tasuku = __toESM(require("tasuku"));
var import_project_config = require("@redwoodjs/project-config");
var import_isTSProject = __toESM(require("../../../lib/isTSProject"));
var import_runTransform = __toESM(require("../../../lib/runTransform"));
const command = "use-armor";
const description = "(v4.x.x->v4.x.x) Updates createGraphQLHandler config to use GraphQL Armor config as needed";
const handler = () => {
  (0, import_tasuku.default)("Use Armor", async ({ setOutput }) => {
    const graphqlHandlerFile = import_isTSProject.default ? "graphql.ts" : "graphql.js";
    await (0, import_runTransform.default)({
      transformPath: import_path.default.join(__dirname, "useArmor.js"),
      targetPaths: [
        import_path.default.join((0, import_project_config.getPaths)().api.base, "src", "functions", graphqlHandlerFile)
      ]
    });
    setOutput(
      "Updating createGraphQLHandler for useArmor config is done! Run `yarn rw lint --fix` to prettify your code"
    );
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  command,
  description,
  handler
});
