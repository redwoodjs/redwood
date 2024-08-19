import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";
import * as toml from "smol-toml";
import {
  findUp,
  getConfigPath,
  getConfig,
  resolveFile
} from "@redwoodjs/project-config";
import { colors } from "./colors.js";
import { getPaths } from "./paths.js";
const getGraphqlPath = () => {
  return resolveFile(path.join(getPaths().api.functions, "graphql"));
};
const graphFunctionDoesExist = () => {
  const graphqlPath = getGraphqlPath();
  return graphqlPath && fs.existsSync(graphqlPath);
};
const isTypeScriptProject = () => {
  const paths = getPaths();
  return fs.existsSync(path.join(paths.web.base, "tsconfig.json")) || fs.existsSync(path.join(paths.api.base, "tsconfig.json"));
};
const getInstalledRedwoodVersion = () => {
  try {
    const packageJson = require("../../package.json");
    return packageJson.version;
  } catch {
    console.error(colors.error("Could not find installed redwood version"));
    process.exit(1);
  }
};
const updateTomlConfig = (packageName) => {
  const redwoodTomlPath = getConfigPath();
  const originalTomlContent = fs.readFileSync(redwoodTomlPath, "utf-8");
  let tomlToAppend = {};
  const config = getConfig(redwoodTomlPath);
  const cliSection = config.experimental?.cli;
  if (!cliSection) {
    tomlToAppend = {
      experimental: {
        cli: {
          autoInstall: true,
          plugins: [{ package: packageName, enabled: true }]
        }
      }
    };
  } else if (cliSection.plugins) {
    const packageExists = cliSection.plugins.some(
      (plugin) => plugin.package === packageName
    );
    if (!packageExists) {
      tomlToAppend = {
        experimental: {
          cli: {
            plugins: [{ package: packageName, enabled: true }]
          }
        }
      };
    }
  } else {
    tomlToAppend = {
      experimental: {
        cli: {
          plugins: [{ package: packageName, enabled: true }]
        }
      }
    };
  }
  const newConfig = originalTomlContent + "\n" + (Object.keys(tomlToAppend).length > 0 ? toml.stringify(tomlToAppend) + "\n" : "");
  return fs.writeFileSync(redwoodTomlPath, newConfig, "utf-8");
};
const updateTomlConfigTask = (packageName) => {
  return {
    title: `Updating redwood.toml to configure ${packageName} ...`,
    task: () => {
      updateTomlConfig(packageName);
    }
  };
};
const addEnvVarTask = (name, value, comment) => {
  return {
    title: `Adding ${name} var to .env...`,
    task: () => {
      addEnvVar(name, value, comment);
    }
  };
};
const addEnvVar = (name, value, comment) => {
  const envPath = path.join(getPaths().base, ".env");
  let envFile = "";
  const newEnvironmentVariable = [
    comment && `# ${comment}`,
    `${name} = ${value}`,
    ""
  ].flat().join("\n");
  if (fs.existsSync(envPath)) {
    envFile = fs.readFileSync(envPath).toString();
    const existingEnvVars = dotenv.parse(envFile);
    if (existingEnvVars[name] && existingEnvVars[name] === value) {
      return envFile;
    }
    if (existingEnvVars[name]) {
      const p = [
        `# Note: The existing environment variable ${name} was not overwritten. Uncomment to use its new value.`,
        comment && `# ${comment}`,
        `# ${name} = ${value}`,
        ""
      ].flat().join("\n");
      envFile += "\n" + p;
    } else {
      envFile += "\n" + newEnvironmentVariable;
    }
  } else {
    envFile = newEnvironmentVariable;
  }
  return fs.writeFileSync(envPath, envFile);
};
const setRedwoodCWD = (cwd) => {
  cwd ??= process.env.RWJS_CWD;
  if (cwd) {
    if (!fs.existsSync(path.join(cwd, "redwood.toml"))) {
      throw new Error(`Couldn't find a "redwood.toml" file in ${cwd}`);
    }
  } else {
    const redwoodTOMLPath = findUp("redwood.toml", process.cwd());
    if (!redwoodTOMLPath) {
      throw new Error(
        `Couldn't find up a "redwood.toml" file from ${process.cwd()}`
      );
    }
    if (redwoodTOMLPath) {
      cwd = path.dirname(redwoodTOMLPath);
    }
  }
  process.env.RWJS_CWD = cwd;
};
function setTomlSetting(section, setting, value) {
  const redwoodTomlPath = getConfigPath();
  const originalTomlContent = fs.readFileSync(redwoodTomlPath, "utf-8");
  const redwoodTomlObject = toml.parse(originalTomlContent);
  const sectionValue = redwoodTomlObject[section];
  const existingValue = (
    // I don't like this type cast, but I couldn't come up with a much better
    // solution
    sectionValue?.[setting]
  );
  if (existingValue === value) {
    return;
  }
  let newTomlContent = originalTomlContent.replace(/\n$/, "") + `

[${section}]
  ${setting} = ${value}`;
  const hasExistingSettingSection = !!redwoodTomlObject?.[section];
  if (hasExistingSettingSection) {
    const existingSectionSettings = Object.keys(redwoodTomlObject[section]);
    let inSection = false;
    let indentation = "";
    let insertionIndex = 1;
    let updateExistingValue = false;
    let updateExistingCommentedValue = false;
    const tomlLines = originalTomlContent.split("\n");
    tomlLines.forEach((line, index) => {
      if (line.startsWith(`[${section}]`)) {
        inSection = true;
        insertionIndex = index + 1;
      } else {
        if (/^\s*\[/.test(line)) {
          inSection = false;
        }
        if (inSection && !updateExistingValue) {
          for (const existingSectionSetting of existingSectionSettings) {
            const matches = line.match(
              new RegExp(`^(\\s*)${existingSectionSetting}\\s*=`, "i")
            );
            if (!updateExistingValue && matches) {
              if (!updateExistingCommentedValue) {
                indentation = matches[1];
              }
              if (existingSectionSetting === setting) {
                updateExistingValue = true;
                insertionIndex = index;
                indentation = matches[1];
              }
            }
            if (!updateExistingValue && !updateExistingCommentedValue && /^\s*\w+\s*=/.test(line)) {
              insertionIndex = index + 1;
            }
          }
          if (!updateExistingValue) {
            const matchesComment = line.match(
              new RegExp(`^(\\s*)#(\\s*)${setting}\\s*=`, "i")
            );
            if (matchesComment) {
              const commentIndentation = matchesComment[1].length > matchesComment[2].length ? matchesComment[1] : matchesComment[2];
              if (commentIndentation.length - 1 > indentation.length) {
                indentation = commentIndentation;
              }
              updateExistingCommentedValue = true;
              insertionIndex = index;
            }
          }
        }
      }
    });
    tomlLines.splice(
      insertionIndex,
      updateExistingValue || updateExistingCommentedValue ? 1 : 0,
      `${indentation}${setting} = ${value}`
    );
    newTomlContent = tomlLines.join("\n");
  }
  fs.writeFileSync(redwoodTomlPath, newTomlContent);
}
export {
  addEnvVar,
  addEnvVarTask,
  getGraphqlPath,
  getInstalledRedwoodVersion,
  graphFunctionDoesExist,
  isTypeScriptProject,
  setRedwoodCWD,
  setTomlSetting,
  updateTomlConfig,
  updateTomlConfigTask
};
