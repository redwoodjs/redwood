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
var configureFastify_yargs_exports = {};
__export(configureFastify_yargs_exports, {
  command: () => command,
  description: () => description,
  handler: () => handler
});
module.exports = __toCommonJS(configureFastify_yargs_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_fetch = require("@whatwg-node/fetch");
var import_fast_glob = __toESM(require("fast-glob"));
var import_tasuku = __toESM(require("tasuku"));
var import_project_config = require("@redwoodjs/project-config");
var import_prettify = __toESM(require("../../../lib/prettify"));
var import_runTransform = __toESM(require("../../../lib/runTransform"));
const command = "configure-fastify";
const description = "(v2.x.x->v2.x.x) Updates api side\u2019s server.config.js to configure Fastify";
const handler = () => {
  (0, import_tasuku.default)("Configure Fastify", async ({ setOutput }) => {
    const [API_SERVER_CONFIG_PATH] = import_fast_glob.default.sync("server.config.{js,ts}", {
      cwd: (0, import_project_config.getPaths)().api.base,
      absolute: true
    });
    if (import_fs.default.existsSync(API_SERVER_CONFIG_PATH)) {
      await (0, import_runTransform.default)({
        transformPath: import_path.default.join(__dirname, "configureFastify.js"),
        targetPaths: [API_SERVER_CONFIG_PATH]
      });
      import_fs.default.writeFileSync(
        API_SERVER_CONFIG_PATH,
        await (0, import_prettify.default)(import_fs.default.readFileSync(API_SERVER_CONFIG_PATH, "utf-8"))
      );
      setOutput("All done!");
    } else {
      const res = await (0, import_fetch.fetch)(
        "https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/server.config.js"
      );
      const text = await res.text();
      const NEW_API_SERVER_CONFIG_PATH = import_path.default.join(
        (0, import_project_config.getPaths)().api.base,
        "server.config.js"
      );
      import_fs.default.writeFileSync(NEW_API_SERVER_CONFIG_PATH, await (0, import_prettify.default)(text));
      setOutput(
        "Done! No server.config.js found, so we updated your project to use the latest version."
      );
    }
  });
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  command,
  description,
  handler
});
