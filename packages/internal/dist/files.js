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
var files_exports = {};
__export(files_exports, {
  findApiDistFunctions: () => findApiDistFunctions,
  findApiFiles: () => findApiFiles,
  findApiServerFunctions: () => findApiServerFunctions,
  findCells: () => findCells,
  findDirectoryNamedModules: () => findDirectoryNamedModules,
  findGraphQLSchemas: () => findGraphQLSchemas,
  findPages: () => findPages,
  findRouteHooksSrc: () => findRouteHooksSrc,
  findScripts: () => findScripts,
  findWebFiles: () => findWebFiles,
  isApiFunction: () => isApiFunction,
  isCellFile: () => isCellFile,
  isDirectoryNamedModuleFile: () => isDirectoryNamedModuleFile,
  isFileInsideFolder: () => isFileInsideFolder,
  isGraphQLSchemaFile: () => isGraphQLSchemaFile,
  isPageFile: () => isPageFile
});
module.exports = __toCommonJS(files_exports);
var import_path = __toESM(require("path"));
var import_fast_glob = __toESM(require("fast-glob"));
var import_project_config = require("@redwoodjs/project-config");
var import_ast = require("./ast");
const findCells = (cwd = (0, import_project_config.getPaths)().web.src) => {
  const modules = import_fast_glob.default.sync("**/*Cell.{js,jsx,ts,tsx}", {
    cwd,
    absolute: true,
    ignore: ["node_modules"]
  });
  return modules.filter(isCellFile);
};
const findPages = (cwd = (0, import_project_config.getPaths)().web.pages) => {
  const modules = import_fast_glob.default.sync("**/*Page.{tsx,js,jsx}", {
    cwd,
    absolute: true,
    ignore: ["node_modules"]
  });
  return modules.filter(isPageFile);
};
const findDirectoryNamedModules = (cwd = (0, import_project_config.getPaths)().base) => {
  const modules = import_fast_glob.default.sync("(api|web)/src/**/*.{ts,js,jsx,tsx}", {
    cwd,
    absolute: true,
    ignore: ["node_modules"]
  });
  return modules.filter(isDirectoryNamedModuleFile).filter((p) => !isCellFile(p));
};
const findGraphQLSchemas = (cwd = (0, import_project_config.getPaths)().api.graphql) => {
  return import_fast_glob.default.sync("**/*.sdl.{ts,js}", { cwd, absolute: true }).filter(isGraphQLSchemaFile);
};
const ignoreApiFiles = [
  "**/*.test.{js,ts}",
  "**/*.scenarios.{js,ts}",
  "**/*.fixtures.{js,ts}",
  "**/*.d.ts"
];
const findApiFiles = (cwd = (0, import_project_config.getPaths)().api.src) => {
  const files = import_fast_glob.default.sync("**/*.{js,ts,jsx,tsx}", {
    cwd,
    absolute: true,
    ignore: ignoreApiFiles
  });
  return files;
};
const findWebFiles = (cwd = (0, import_project_config.getPaths)().web.src) => {
  const files = import_fast_glob.default.sync("**/*.{js,ts,jsx,tsx}", {
    cwd,
    absolute: true,
    ignore: [
      "**/*.test.{js,ts,tsx,jsx}",
      "**/*.fixtures.{js,ts,tsx,jsx}",
      "**/*.mock.{js,ts,tsx,jsx}",
      "**/*.d.ts"
    ]
  });
  return files;
};
const findApiServerFunctions = (cwd = (0, import_project_config.getPaths)().api.functions) => {
  const files = import_fast_glob.default.sync("**/*.{js,ts}", {
    cwd,
    absolute: true,
    deep: 2,
    // We don't support deeply nested api functions.
    ignore: ignoreApiFiles
  });
  return files.filter((f) => isApiFunction(f, cwd));
};
const findApiDistFunctions = (cwd = (0, import_project_config.getPaths)().api.base) => {
  return import_fast_glob.default.sync("dist/functions/**/*.{ts,js}", {
    cwd,
    deep: 2,
    // We don't support deeply nested api functions, to maximise compatibility with deployment providers
    absolute: true
  });
};
const findRouteHooksSrc = (cwd = (0, import_project_config.getPaths)().web.src) => {
  return import_fast_glob.default.sync("**/*.routeHooks.{js,ts,tsx,jsx}", {
    absolute: true,
    cwd
  });
};
const isCellFile = (p) => {
  const { dir, name } = import_path.default.parse(p);
  if (!isFileInsideFolder(p, (0, import_project_config.getPaths)().web.src)) {
    return false;
  }
  if (!dir.endsWith(name)) {
    return false;
  }
  const ast = (0, import_ast.fileToAst)(p);
  if ((0, import_ast.hasDefaultExport)(ast)) {
    return false;
  }
  const exports2 = (0, import_ast.getNamedExports)(ast);
  const exportedQUERY = exports2.findIndex((v) => v.name === "QUERY") !== -1;
  const exportedSuccess = exports2.findIndex((v) => v.name === "Success") !== -1;
  if (!exportedQUERY && !exportedSuccess) {
    return false;
  }
  return true;
};
const findScripts = (cwd = (0, import_project_config.getPaths)().scripts) => {
  return import_fast_glob.default.sync("./**/*.{js,jsx,ts,tsx}", {
    cwd,
    absolute: true,
    ignore: ["node_modules"]
  });
};
const isPageFile = (p) => {
  const { name } = import_path.default.parse(p);
  if (!name.endsWith("Page")) {
    return false;
  }
  if (!isFileInsideFolder(p, (0, import_project_config.getPaths)().web.pages)) {
    return false;
  }
  const ast = (0, import_ast.fileToAst)(p);
  if (!(0, import_ast.hasDefaultExport)(ast)) {
    return false;
  }
  return true;
};
const isDirectoryNamedModuleFile = (p) => {
  const { dir, name } = import_path.default.parse(p);
  return dir.endsWith(name);
};
const isGraphQLSchemaFile = (p) => {
  if (!p.match(/\.sdl\.(ts|js)$/)?.[0]) {
    return false;
  }
  const ast = (0, import_ast.fileToAst)(p);
  const exports2 = (0, import_ast.getNamedExports)(ast);
  return exports2.findIndex((v) => v.name === "schema") !== -1;
};
const isApiFunction = (p, functionsPath) => {
  p = import_path.default.relative(functionsPath, p);
  const { dir, name } = import_path.default.parse(p);
  if (dir === name) {
    return true;
  } else if (dir === "") {
    return true;
  } else if (dir.length && name === "index") {
    return true;
  }
  return false;
};
const isFileInsideFolder = (filePath, folderPath) => {
  const { dir } = import_path.default.parse(filePath);
  const relativePathFromFolder = import_path.default.relative(folderPath, dir);
  if (!relativePathFromFolder || relativePathFromFolder.startsWith("..") || import_path.default.isAbsolute(relativePathFromFolder)) {
    return false;
  } else {
    return true;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  findApiDistFunctions,
  findApiFiles,
  findApiServerFunctions,
  findCells,
  findDirectoryNamedModules,
  findGraphQLSchemas,
  findPages,
  findRouteHooksSrc,
  findScripts,
  findWebFiles,
  isApiFunction,
  isCellFile,
  isDirectoryNamedModuleFile,
  isFileInsideFolder,
  isGraphQLSchemaFile,
  isPageFile
});
