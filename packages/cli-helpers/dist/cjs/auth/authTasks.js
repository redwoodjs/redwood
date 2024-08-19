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
var authTasks_exports = {};
__export(authTasks_exports, {
  addApiConfig: () => addApiConfig,
  addAuthConfigToGqlApi: () => addAuthConfigToGqlApi,
  addConfigToRoutes: () => addConfigToRoutes,
  addConfigToWebApp: () => addConfigToWebApp,
  createWebAuth: () => createWebAuth,
  generateAuthApiFiles: () => generateAuthApiFiles,
  getWebAppPath: () => getWebAppPath,
  hasAuthProvider: () => hasAuthProvider,
  removeAuthProvider: () => removeAuthProvider,
  setAuthSetupMode: () => setAuthSetupMode
});
module.exports = __toCommonJS(authTasks_exports);
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_project_config = require("@redwoodjs/project-config");
var import_colors = require("../lib/colors.js");
var import_lib = require("../lib/index.js");
var import_paths = require("../lib/paths.js");
var import_project = require("../lib/project.js");
var import_authFiles = require("./authFiles.js");
const AUTH_PROVIDER_HOOK_IMPORT = `import { AuthProvider, useAuth } from './auth'`;
const AUTH_HOOK_IMPORT = `import { useAuth } from './auth'`;
const getWebAppPath = () => (0, import_paths.getPaths)().web.app;
function addAuthDecoderToCreateGraphQLHandler(content) {
  if (!new RegExp("(?=(^.*?createGraphQLHandler))\\1.*\\bauthDecoder", "s").test(
    content
  )) {
    return content.replace(
      /^(?<indentation>\s*)(loggerConfig:)(.*)$/m,
      `$<indentation>authDecoder,
$<indentation>$2$3`
    );
  }
  return content;
}
function replaceAuthDecoderImport(content, decoderImport) {
  return content.replace(/^import { authDecoder .*} from .+/, decoderImport);
}
function replaceAuthDecoderArg(content) {
  return content.replace(/^(\s+)authDecoder\b.+/m, "$1authDecoder,");
}
const addApiConfig = ({
  replaceExistingImport,
  authDecoderImport
}) => {
  const graphqlPath = (0, import_project.getGraphqlPath)();
  if (!graphqlPath) {
    throw new Error("Could not find your graphql file path");
  }
  const content = import_fs.default.readFileSync(graphqlPath).toString();
  let newContent = content;
  if (authDecoderImport) {
    if (replaceExistingImport) {
      newContent = replaceAuthDecoderImport(newContent, authDecoderImport);
      newContent = replaceAuthDecoderArg(newContent);
    }
    const didReplace = newContent.includes(authDecoderImport);
    if (!replaceExistingImport || !didReplace) {
      newContent = authDecoderImport + "\n" + newContent;
      newContent = addAuthDecoderToCreateGraphQLHandler(newContent);
    }
  }
  const hasCurrentUserImport = /(^import {.*?getCurrentUser(?!getCurrentUser).*?} from 'src\/lib\/auth')/s.test(
    newContent
  );
  if (!hasCurrentUserImport) {
    newContent = newContent.replace(
      /^(import { db } from 'src\/lib\/db')$/m,
      `import { getCurrentUser } from 'src/lib/auth'
$1`
    );
    newContent = newContent.replace(
      /^(\s*)(loggerConfig:)(.*)$/m,
      `$1getCurrentUser,
$1$2$3`
    );
  }
  if (newContent !== content) {
    import_fs.default.writeFileSync(graphqlPath, newContent);
  }
};
const apiSrcDoesExist = () => {
  return import_fs.default.existsSync(import_path.default.join((0, import_paths.getPaths)().api.src));
};
const addAuthImportToApp = (content) => {
  const contentLines = content.split("\n");
  const importIndex = contentLines.findLastIndex(
    (line) => /^\s*import (?!.*(?:.css'|.scss'))/.test(line)
  );
  contentLines.splice(importIndex + 1, 0, "", AUTH_PROVIDER_HOOK_IMPORT);
  return contentLines.join("\n");
};
const addAuthImportToRoutes = (content) => {
  const contentLines = content.split("\n");
  const importIndex = contentLines.findLastIndex(
    (line) => /^\s*import (?!.*(?:.css'|.scss'))/.test(line)
  );
  contentLines.splice(importIndex + 1, 0, "", AUTH_HOOK_IMPORT);
  return contentLines.join("\n");
};
const hasAuthProvider = (content) => {
  return /\s*<AuthProvider([\s>]|$)/.test(content);
};
const removeAuthProvider = (content) => {
  let remove = false;
  let end = "";
  let unindent = false;
  return content.split("\n").reduce((acc, line) => {
    let keep = !remove;
    if (hasAuthProvider(line)) {
      remove = true;
      keep = false;
      unindent = true;
      end = line.replace(/^(\s*)<Auth.*/s, "$1") + ">";
    }
    if (hasAuthProvider(line) && line.trimEnd().at(-1) === ">" || line.trimEnd() === end) {
      remove = false;
    }
    if (/\s*<\/AuthProvider>/.test(line)) {
      keep = false;
      unindent = false;
    }
    if (keep) {
      if (unindent) {
        acc.push(line.replace("  ", ""));
      } else {
        acc.push(line);
      }
    }
    return acc;
  }, []).join("\n");
};
const addAuthProviderToApp = (content, setupMode) => {
  if (setupMode === "FORCE" || setupMode === "REPLACE") {
    content = removeAuthProvider(content);
  }
  const match = content.match(
    /(\s+)(<RedwoodProvider.*?>)(.*)(<\/RedwoodProvider>)/s
  );
  if (!match) {
    throw new Error("Could not find <RedwoodProvider> in App.{jsx,tsx}");
  }
  if (/\s+<AuthProvider>/.test(content)) {
    return content;
  }
  const [
    _,
    newlineAndIndent,
    redwoodProviderOpen,
    redwoodProviderChildren,
    redwoodProviderClose
  ] = match;
  const redwoodProviderChildrenLines = redwoodProviderChildren.split("\n").map((line, index) => {
    return `${index === 0 ? "" : "  "}` + line;
  });
  const renderContent = newlineAndIndent + redwoodProviderOpen + newlineAndIndent + `  <AuthProvider>` + redwoodProviderChildrenLines.join("\n") + `</AuthProvider>` + newlineAndIndent + redwoodProviderClose;
  return content.replace(
    /\s+<RedwoodProvider.*?>.*<\/RedwoodProvider>/s,
    renderContent
  );
};
const hasUseAuthHook = (componentName, content) => {
  return new RegExp(
    `<${componentName}.*useAuth={.*?}.*?>.*</${componentName}>`,
    "s"
  ).test(content);
};
const addUseAuthHook = (componentName, content) => {
  return content.replace(
    `<${componentName}`,
    `<${componentName} useAuth={useAuth}`
  );
};
const addConfigToWebApp = () => {
  return {
    title: "Updating web/src/App.{jsx,tsx}",
    task: (ctx, task) => {
      const webAppPath = getWebAppPath();
      if (!import_fs.default.existsSync(webAppPath)) {
        const ext = (0, import_project.isTypeScriptProject)() ? "tsx" : "jsx";
        throw new Error(`Could not find root App.${ext}`);
      }
      let content = import_fs.default.readFileSync(webAppPath, "utf-8");
      if (!content.includes(AUTH_PROVIDER_HOOK_IMPORT)) {
        content = addAuthImportToApp(content);
      }
      if (ctx.setupMode === "REPLACE" || ctx.setupMode === "FORCE") {
        content = content.replace(
          "import { AuthProvider } from '@redwoodjs/auth'\n",
          ""
        );
      }
      content = addAuthProviderToApp(content, ctx.setupMode);
      if (/\s*<RedwoodApolloProvider/.test(content)) {
        if (!hasUseAuthHook("RedwoodApolloProvider", content)) {
          content = addUseAuthHook("RedwoodApolloProvider", content);
        }
      } else {
        task.output = import_colors.colors.warning(
          "Could not find <RedwoodApolloProvider>.\nIf you are using a custom GraphQL Client you will have to make sure it gets access to your `useAuth`, if it needs it."
        );
      }
      import_fs.default.writeFileSync(webAppPath, content);
    }
  };
};
const createWebAuth = (basedir, webAuthn) => {
  const templatesBaseDir = import_path.default.join(basedir, "templates", "web");
  const templates = import_fs.default.readdirSync(templatesBaseDir);
  const rscEnabled = (0, import_project_config.getConfig)().experimental?.rsc?.enabled;
  const templateStart = "auth" + (webAuthn ? ".webAuthn" : "") + (rscEnabled ? ".rsc" : "") + ".ts";
  const templateFileName = templates.find((template) => {
    return template.startsWith(templateStart);
  });
  if (!templateFileName) {
    throw new Error(
      "Could not find the auth.ts(x) template, looking for filename starting with " + templateStart
    );
  }
  const templateExtension = templateFileName.split(".").at(-2);
  const isTSProject = (0, import_project.isTypeScriptProject)();
  let ext = templateExtension;
  if (!(0, import_project.isTypeScriptProject)()) {
    ext = ext?.replace("ts", "js");
  }
  return {
    title: `Creating web/src/auth.${ext}`,
    task: async (ctx) => {
      let authFileName = import_path.default.join((0, import_paths.getPaths)().web.src, "auth");
      if (ctx.setupMode === "COMBINE") {
        let i = 1;
        while ((0, import_project_config.resolveFile)(authFileName)) {
          const count = i > 1 ? i : "";
          authFileName = import_path.default.join(
            (0, import_paths.getPaths)().web.src,
            ctx.provider + "Auth" + count
          );
          i++;
        }
      }
      authFileName = authFileName + "." + ext;
      let template = import_fs.default.readFileSync(
        import_path.default.join(templatesBaseDir, templateFileName),
        "utf-8"
      );
      template = isTSProject ? template : await (0, import_lib.transformTSToJS)(authFileName, template);
      import_fs.default.writeFileSync(authFileName, template);
    }
  };
};
const addConfigToRoutes = () => {
  return {
    title: "Updating Routes file...",
    task: () => {
      const webRoutesPath = (0, import_paths.getPaths)().web.routes;
      let content = import_fs.default.readFileSync(webRoutesPath).toString();
      if (!content.includes(AUTH_HOOK_IMPORT)) {
        content = addAuthImportToRoutes(content);
      }
      if (!hasUseAuthHook("Router", content)) {
        content = addUseAuthHook("Router", content);
      }
      import_fs.default.writeFileSync(webRoutesPath, content);
    }
  };
};
const generateAuthApiFiles = (basedir, webAuthn) => {
  return {
    title: "Generating auth api side files...",
    task: async (ctx, task) => {
      if (!apiSrcDoesExist()) {
        return new Error(
          "Could not find api/src directory. Cannot continue setup!"
        );
      }
      let filesRecord = await (0, import_authFiles.apiSideFiles)({ basedir, webAuthn });
      let existingFiles = "FAIL";
      if (ctx.setupMode === "FORCE") {
        existingFiles = "OVERWRITE";
      } else if (ctx.setupMode === "REPLACE") {
        const filesToOverwrite = findExistingFiles(filesRecord);
        const overwrite = await task.prompt({
          type: "confirm",
          message: `Overwrite existing ${filesToOverwrite.join(", ")}?`,
          initial: false
        });
        existingFiles = overwrite ? "OVERWRITE" : "SKIP";
      } else if (ctx.setupMode === "COMBINE") {
        const uniqueFilesRecord = (0, import_authFiles.generateUniqueFileNames)(
          filesRecord,
          ctx.provider
        );
        filesRecord = uniqueFilesRecord;
        existingFiles = "FAIL";
      }
      return (0, import_lib.writeFilesTask)(filesRecord, {
        existingFiles
      });
    }
  };
};
function findExistingFiles(filesMap) {
  return Object.keys(filesMap).filter((filePath) => import_fs.default.existsSync(filePath)).map((filePath) => filePath.replace((0, import_paths.getPaths)().base, ""));
}
const addAuthConfigToGqlApi = (authDecoderImport) => ({
  title: "Adding auth config to GraphQL API...",
  task: (ctx, _task) => {
    if ((0, import_project.graphFunctionDoesExist)()) {
      addApiConfig({
        authDecoderImport,
        replaceExistingImport: ctx.setupMode === "REPLACE" || ctx.setupMode === "FORCE"
      });
    } else {
      throw new Error(
        "GraphQL function not found. You will need to pass the decoder to the createGraphQLHandler function."
      );
    }
  }
});
const setAuthSetupMode = (force) => {
  return {
    title: "Checking project for existing auth...",
    task: async (ctx, task) => {
      if (force) {
        ctx.setupMode = "FORCE";
        return;
      }
      const webAppContents = import_fs.default.readFileSync(getWebAppPath(), "utf-8");
      if (hasAuthProvider(webAppContents) && ctx.setupMode === "UNKNOWN") {
        const setupMode = "REPLACE";
        ctx.setupMode = setupMode;
        return;
      } else {
        ctx.setupMode = "FORCE";
        task.skip("Setting up Auth from scratch");
      }
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addApiConfig,
  addAuthConfigToGqlApi,
  addConfigToRoutes,
  addConfigToWebApp,
  createWebAuth,
  generateAuthApiFiles,
  getWebAppPath,
  hasAuthProvider,
  removeAuthProvider,
  setAuthSetupMode
});
