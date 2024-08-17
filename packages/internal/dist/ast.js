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
var ast_exports = {};
__export(ast_exports, {
  fileToAst: () => fileToAst,
  getCellGqlQuery: () => getCellGqlQuery,
  getDefaultExportLocation: () => getDefaultExportLocation,
  getGqlQueries: () => getGqlQueries,
  getNamedExports: () => getNamedExports,
  hasDefaultExport: () => hasDefaultExport
});
module.exports = __toCommonJS(ast_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_core = require("@babel/core");
var import_parser = require("@babel/parser");
var import_traverse = __toESM(require("@babel/traverse"));
var import_chalk = __toESM(require("chalk"));
var import_project_config = require("@redwoodjs/project-config");
var import_files = require("./files");
const fileToAst = (filePath) => {
  const code = import_fs.default.readFileSync(filePath, "utf-8");
  const isJsxFile = import_path.default.extname(filePath).match(/[jt]sx$/) || (0, import_files.isFileInsideFolder)(filePath, (0, import_project_config.getPaths)().web.base);
  const plugins = [
    "typescript",
    "nullishCoalescingOperator",
    "objectRestSpread",
    isJsxFile && "jsx"
  ].filter(Boolean);
  try {
    return (0, import_parser.parse)(code, {
      sourceType: "module",
      plugins
    });
  } catch (e) {
    console.error(import_chalk.default.red(`Error parsing: ${filePath}`));
    console.error(e);
    throw new Error(e?.message);
  }
};
const getNamedExports = (ast) => {
  const namedExports = [];
  (0, import_traverse.default)(ast, {
    ExportNamedDeclaration(path2) {
      const specifiers = path2.node?.specifiers;
      if (specifiers.length) {
        for (const s of specifiers) {
          const id = s.exported;
          namedExports.push({
            name: id.name,
            type: "re-export",
            location: {
              line: id.loc?.start.line ?? 1,
              column: id.loc?.start.column ?? 0
            }
          });
        }
        return;
      }
      const declaration = path2.node.declaration;
      if (!declaration) {
        return;
      }
      if (declaration.type === "VariableDeclaration") {
        const id = declaration.declarations[0].id;
        namedExports.push({
          name: id.name,
          type: "variable",
          location: {
            line: id.loc?.start.line ?? 1,
            column: id.loc?.start.column ?? 0
          }
        });
      } else if (declaration.type === "FunctionDeclaration") {
        namedExports.push({
          name: declaration?.id?.name,
          type: "function",
          location: {
            line: declaration?.id?.loc?.start.line ?? 1,
            column: declaration?.id?.loc?.start.column ?? 0
          }
        });
      } else if (declaration.type === "ClassDeclaration") {
        namedExports.push({
          name: declaration?.id?.name,
          type: "class",
          location: {
            line: declaration?.id?.loc?.start.line ?? 1,
            column: declaration?.id?.loc?.start.column ?? 0
          }
        });
      }
    }
  });
  return namedExports;
};
const getGqlQueries = (ast) => {
  const gqlQueries = [];
  (0, import_traverse.default)(ast, {
    TaggedTemplateExpression(path2) {
      const gqlTag = path2.node.tag;
      if (gqlTag.type === "Identifier" && gqlTag.name === "gql") {
        gqlQueries.push(path2.node.quasi.quasis[0].value.raw);
      }
    }
  });
  return gqlQueries;
};
const getCellGqlQuery = (ast) => {
  let cellQuery = void 0;
  (0, import_traverse.default)(ast, {
    ExportNamedDeclaration({ node }) {
      if (node.exportKind === "value" && import_core.types.isVariableDeclaration(node.declaration)) {
        const exportedQueryNode = node.declaration.declarations.find((d) => {
          return import_core.types.isIdentifier(d.id) && d.id.name === "QUERY" && import_core.types.isTaggedTemplateExpression(d.init);
        });
        if (exportedQueryNode) {
          const templateExpression = exportedQueryNode.init;
          cellQuery = templateExpression.quasi.quasis[0].value.raw;
        }
      }
      return;
    }
  });
  return cellQuery;
};
const hasDefaultExport = (ast) => {
  let exported = false;
  (0, import_traverse.default)(ast, {
    ExportDefaultDeclaration() {
      exported = true;
      return;
    }
  });
  return exported;
};
const getDefaultExportLocation = (ast) => {
  let defaultExport;
  (0, import_traverse.default)(ast, {
    ExportDefaultDeclaration(path2) {
      defaultExport = path2.node;
    }
  });
  if (!defaultExport) {
    return null;
  }
  if (import_core.types.isIdentifier(defaultExport.declaration) && import_core.types.isFile(ast)) {
    const exportedName = defaultExport.declaration.name;
    const declaration = ast.program.body.find((node) => {
      return import_core.types.isVariableDeclaration(node) && node.declarations.find((d) => {
        return import_core.types.isVariableDeclarator(d) && import_core.types.isIdentifier(d.id) && d.id.name === exportedName;
      });
    });
    return {
      line: declaration?.loc?.start.line ?? 1,
      column: declaration?.loc?.start.column ?? 0
    };
  }
  return {
    line: defaultExport.loc?.start.line ?? 1,
    column: defaultExport.loc?.start.column ?? 0
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fileToAst,
  getCellGqlQuery,
  getDefaultExportLocation,
  getGqlQueries,
  getNamedExports,
  hasDefaultExport
});
