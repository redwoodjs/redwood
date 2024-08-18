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
var cells_exports = {};
__export(cells_exports, {
  fileToAst: () => fileToAst,
  findCells: () => findCells,
  getCellGqlQuery: () => getCellGqlQuery,
  getNamedExports: () => getNamedExports,
  hasDefaultExport: () => hasDefaultExport,
  isCellFile: () => isCellFile,
  isFileInsideFolder: () => isFileInsideFolder,
  parseDocumentAST: () => parseDocumentAST,
  parseGqlQueryToAst: () => parseGqlQueryToAst
});
module.exports = __toCommonJS(cells_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_core = require("@babel/core");
var import_parser = require("@babel/parser");
var import_traverse = __toESM(require("@babel/traverse"));
var import_fast_glob = __toESM(require("fast-glob"));
var import_graphql = require("graphql");
var import_project_config = require("@redwoodjs/project-config");
const findCells = (cwd = (0, import_project_config.getPaths)().web.src) => {
  const modules = import_fast_glob.default.sync("**/*Cell.{js,jsx,ts,tsx}", {
    cwd,
    absolute: true,
    ignore: ["node_modules"]
  });
  return modules.filter(isCellFile);
};
const isCellFile = (p) => {
  const { dir, name } = import_path.default.parse(p);
  if (!isFileInsideFolder(p, (0, import_project_config.getPaths)().web.src)) {
    return false;
  }
  if (!dir.endsWith(name)) {
    return false;
  }
  const ast = fileToAst(p);
  if (hasDefaultExport(ast)) {
    return false;
  }
  const exports2 = getNamedExports(ast);
  const exportedQUERY = exports2.findIndex((v) => v.name === "QUERY") !== -1;
  const exportedSuccess = exports2.findIndex((v) => v.name === "Success") !== -1;
  if (!exportedQUERY && !exportedSuccess) {
    return false;
  }
  return true;
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
            type: "re-export"
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
          type: "variable"
        });
      } else if (declaration.type === "FunctionDeclaration") {
        namedExports.push({
          name: declaration?.id?.name,
          type: "function"
        });
      } else if (declaration.type === "ClassDeclaration") {
        namedExports.push({
          name: declaration?.id?.name,
          type: "class"
        });
      }
    }
  });
  return namedExports;
};
const fileToAst = (filePath) => {
  const code = import_fs.default.readFileSync(filePath, "utf-8");
  const isJsxFile = import_path.default.extname(filePath).match(/[jt]sx$/) || isFileInsideFolder(filePath, (0, import_project_config.getPaths)().web.base);
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
    console.error(e);
    throw new Error(e?.message);
  }
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
const parseGqlQueryToAst = (gqlQuery) => {
  const ast = (0, import_graphql.parse)(gqlQuery);
  return parseDocumentAST(ast);
};
const parseDocumentAST = (document) => {
  const operations = [];
  (0, import_graphql.visit)(document, {
    OperationDefinition(node) {
      const fields = [];
      node.selectionSet.selections.forEach((field) => {
        fields.push(getFields(field));
      });
      operations.push({
        operation: node.operation,
        name: node.name?.value,
        fields
      });
    }
  });
  return operations;
};
const getFields = (field) => {
  if (!field.selectionSet) {
    return field.name.value;
  } else {
    const obj = {
      [field.name.value]: []
    };
    const lookAtFieldNode = (node) => {
      node.selectionSet?.selections.forEach((subField) => {
        switch (subField.kind) {
          case import_graphql.Kind.FIELD:
            obj[field.name.value].push(getFields(subField));
            break;
          case import_graphql.Kind.FRAGMENT_SPREAD:
            break;
          case import_graphql.Kind.INLINE_FRAGMENT:
            lookAtFieldNode(subField);
        }
      });
    };
    lookAtFieldNode(field);
    return obj;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fileToAst,
  findCells,
  getCellGqlQuery,
  getNamedExports,
  hasDefaultExport,
  isCellFile,
  isFileInsideFolder,
  parseDocumentAST,
  parseGqlQueryToAst
});
