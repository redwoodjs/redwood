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
var setupHelpers_exports = {};
__export(setupHelpers_exports, {
  standardAuthBuilder: () => standardAuthBuilder,
  standardAuthHandler: () => standardAuthHandler
});
module.exports = __toCommonJS(setupHelpers_exports);
var import_listr2 = require("listr2");
var import_terminal_link = __toESM(require("terminal-link"), 1);
var import_telemetry = require("@redwoodjs/telemetry");
var import_colors = require("../lib/colors.js");
var import_installHelpers = require("../lib/installHelpers.js");
var import_authTasks = require("./authTasks.js");
const standardAuthBuilder = (yargs) => {
  return yargs.option("force", {
    alias: "f",
    default: false,
    description: "Overwrite existing auth configuration",
    type: "boolean"
  }).option("verbose", {
    alias: "v",
    default: false,
    description: "Log setup output",
    type: "boolean"
  }).epilogue(
    `Also see the ${(0, import_terminal_link.default)(
      "Redwood CLI Reference",
      "https://redwoodjs.com/docs/cli-commands#setup-auth"
    )}`
  );
};
function truthy(value) {
  return !!value;
}
const standardAuthHandler = async ({
  basedir,
  forceArg,
  provider,
  authDecoderImport,
  webAuthn = false,
  webPackages = [],
  apiPackages = [],
  extraTasks,
  notes,
  verbose
}) => {
  const tasks = new import_listr2.Listr(
    [
      (0, import_authTasks.setAuthSetupMode)(forceArg),
      (0, import_authTasks.generateAuthApiFiles)(basedir, webAuthn),
      (0, import_authTasks.addConfigToWebApp)(),
      (0, import_authTasks.createWebAuth)(basedir, webAuthn),
      (0, import_authTasks.addConfigToRoutes)(),
      (0, import_authTasks.addAuthConfigToGqlApi)(authDecoderImport),
      webPackages.length && (0, import_installHelpers.addWebPackages)(webPackages),
      apiPackages.length && (0, import_installHelpers.addApiPackages)(apiPackages),
      (webPackages.length || apiPackages.length) && import_installHelpers.installPackages,
      ...(extraTasks || []).filter(truthy),
      notes && {
        title: "One more thing...",
        task: (ctx) => {
          if (ctx.setupMode === "REPLACE") {
            notes.push(
              ...[
                "",
                `${import_colors.colors.warning(
                  "Your existing auth provider has been replaced!"
                )}`,
                "You'll still need to manually remove your old auth provider's config,",
                "functions, and dependencies (in your web and api package.json's)."
              ]
            );
          }
          if (ctx.setupMode === "COMBINE") {
            notes.push(
              import_colors.colors.warning(
                `To avoid overwriting existing files we've generated new file names for the newly generated files. This probably means ${ctx.provider} auth doesn't work out of the box. You'll most likely have to manually merge some of the generated files with your existing auth files`
              )
            );
          }
        }
      }
    ].filter(truthy),
    {
      rendererOptions: { collapseSubtasks: false },
      renderer: verbose ? "verbose" : "default",
      ctx: {
        setupMode: "UNKNOWN",
        provider,
        // provider name passed from CLI
        force: forceArg
      }
    }
  );
  try {
    await tasks.run();
    if (notes) {
      console.log(`
   ${notes.join("\n   ")}
`);
    }
  } catch (e) {
    if (isErrorWithMessage(e)) {
      (0, import_telemetry.errorTelemetry)(process.argv, e.message);
      console.error(import_colors.colors.error(e.message));
    }
    if (isErrorWithErrorCode(e)) {
      process.exit(e.exitCode || 1);
    } else {
      process.exit(1);
    }
  }
};
function isErrorWithMessage(e) {
  return !!e.message;
}
function isErrorWithErrorCode(e) {
  return !isNaN(e.exitCode);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  standardAuthBuilder,
  standardAuthHandler
});
