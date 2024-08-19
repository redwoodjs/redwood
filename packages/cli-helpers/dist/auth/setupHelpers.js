import { Listr } from "listr2";
import terminalLink from "terminal-link";
import { errorTelemetry } from "@redwoodjs/telemetry";
import { colors } from "../lib/colors.js";
import {
  addApiPackages,
  addWebPackages,
  installPackages
} from "../lib/installHelpers.js";
import {
  addAuthConfigToGqlApi,
  addConfigToRoutes,
  addConfigToWebApp,
  setAuthSetupMode,
  createWebAuth,
  generateAuthApiFiles
} from "./authTasks.js";
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
    `Also see the ${terminalLink(
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
  const tasks = new Listr(
    [
      setAuthSetupMode(forceArg),
      generateAuthApiFiles(basedir, webAuthn),
      addConfigToWebApp(),
      createWebAuth(basedir, webAuthn),
      addConfigToRoutes(),
      addAuthConfigToGqlApi(authDecoderImport),
      webPackages.length && addWebPackages(webPackages),
      apiPackages.length && addApiPackages(apiPackages),
      (webPackages.length || apiPackages.length) && installPackages,
      ...(extraTasks || []).filter(truthy),
      notes && {
        title: "One more thing...",
        task: (ctx) => {
          if (ctx.setupMode === "REPLACE") {
            notes.push(
              ...[
                "",
                `${colors.warning(
                  "Your existing auth provider has been replaced!"
                )}`,
                "You'll still need to manually remove your old auth provider's config,",
                "functions, and dependencies (in your web and api package.json's)."
              ]
            );
          }
          if (ctx.setupMode === "COMBINE") {
            notes.push(
              colors.warning(
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
      errorTelemetry(process.argv, e.message);
      console.error(colors.error(e.message));
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
export {
  standardAuthBuilder,
  standardAuthHandler
};
