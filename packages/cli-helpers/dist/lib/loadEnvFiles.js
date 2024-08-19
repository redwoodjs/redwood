import fs from "node:fs";
import path from "node:path";
import { config as dotenvConfig } from "dotenv";
import { config as dotenvDefaultsConfig } from "dotenv-defaults";
import { hideBin, Parser } from "yargs/helpers";
import { getPaths } from "@redwoodjs/project-config";
function loadEnvFiles() {
  if (process.env.REDWOOD_ENV_FILES_LOADED) {
    return;
  }
  const { base } = getPaths();
  loadDefaultEnvFiles(base);
  loadNodeEnvDerivedEnvFile(base);
  const { loadEnvFiles: loadEnvFiles2 } = Parser.default(hideBin(process.argv), {
    array: ["load-env-files"],
    default: {
      loadEnvFiles: []
    }
  });
  if (loadEnvFiles2.length > 0) {
    loadUserSpecifiedEnvFiles(base, loadEnvFiles2);
  }
  process.env.REDWOOD_ENV_FILES_LOADED = "true";
}
function loadDefaultEnvFiles(cwd) {
  dotenvDefaultsConfig({
    path: path.join(cwd, ".env"),
    defaults: path.join(cwd, ".env.defaults"),
    // @ts-expect-error - Old typings. @types/dotenv-defaults depends on dotenv
    // v8. dotenv-defaults uses dotenv v14
    multiline: true
  });
}
function loadNodeEnvDerivedEnvFile(cwd) {
  if (!process.env.NODE_ENV) {
    return;
  }
  const nodeEnvDerivedEnvFilePath = path.join(
    cwd,
    `.env.${process.env.NODE_ENV}`
  );
  if (!fs.existsSync(nodeEnvDerivedEnvFilePath)) {
    return;
  }
  dotenvConfig({ path: nodeEnvDerivedEnvFilePath, override: true });
}
function loadUserSpecifiedEnvFiles(cwd, loadEnvFiles2) {
  for (const suffix of loadEnvFiles2) {
    const envPath = path.join(cwd, `.env.${suffix}`);
    if (!fs.existsSync(envPath)) {
      throw new Error(
        `Couldn't find an .env file at '${envPath}' as specified by '--load-env-files'`
      );
    }
    dotenvConfig({ path: envPath, override: true });
  }
}
export {
  loadDefaultEnvFiles,
  loadEnvFiles,
  loadNodeEnvDerivedEnvFile,
  loadUserSpecifiedEnvFiles
};
