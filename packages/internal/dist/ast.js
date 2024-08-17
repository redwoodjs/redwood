"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.hasDefaultExport = exports.getNamedExports = exports.getGqlQueries = exports.getDefaultExportLocation = exports.getCellGqlQuery = exports.fileToAst = void 0;
require("core-js/modules/es.array.push.js");
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _core = require("@babel/core");
var _parser = require("@babel/parser");
var _traverse = _interopRequireDefault(require("@babel/traverse"));
var _chalk = _interopRequireDefault(require("chalk"));
var _projectConfig = require("@redwoodjs/project-config");
var _files = require("./files");
const fileToAst = filePath => {
  var _context;
  const code = _fs.default.readFileSync(filePath, 'utf-8');

  // use jsx plugin for web files, because in JS, the .jsx extension is not used
  const isJsxFile = _path.default.extname(filePath).match(/[jt]sx$/) || (0, _files.isFileInsideFolder)(filePath, (0, _projectConfig.getPaths)().web.base);
  const plugins = (0, _filter.default)(_context = ['typescript', 'nullishCoalescingOperator', 'objectRestSpread', isJsxFile && 'jsx']).call(_context, Boolean);
  try {
    return (0, _parser.parse)(code, {
      sourceType: 'module',
      plugins
    });
  } catch (e) {
    console.error(_chalk.default.red(`Error parsing: ${filePath}`));
    console.error(e);
    throw new Error(e?.message); // we throw, so typescript doesn't complain about returning
  }
};
exports.fileToAst = fileToAst;
/**
 * get all the named exports in a given piece of code.
 */
const getNamedExports = ast => {
  const namedExports = [];
  (0, _traverse.default)(ast, {
    ExportNamedDeclaration(path) {
      // Re-exports from other modules
      // Eg: export { a, b } from './module'
      const specifiers = path.node?.specifiers;
      if (specifiers.length) {
        for (const s of specifiers) {
          const id = s.exported;
          namedExports.push({
            name: id.name,
            type: 're-export',
            location: {
              line: id.loc?.start.line ?? 1,
              column: id.loc?.start.column ?? 0
            }
          });
        }
        return;
      }
      const declaration = path.node.declaration;
      if (!declaration) {
        return;
      }
      if (declaration.type === 'VariableDeclaration') {
        const id = declaration.declarations[0].id;
        namedExports.push({
          name: id.name,
          type: 'variable',
          location: {
            line: id.loc?.start.line ?? 1,
            column: id.loc?.start.column ?? 0
          }
        });
      } else if (declaration.type === 'FunctionDeclaration') {
        namedExports.push({
          name: declaration?.id?.name,
          type: 'function',
          location: {
            line: declaration?.id?.loc?.start.line ?? 1,
            column: declaration?.id?.loc?.start.column ?? 0
          }
        });
      } else if (declaration.type === 'ClassDeclaration') {
        namedExports.push({
          name: declaration?.id?.name,
          type: 'class',
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

/**
 * get all the gql queries from the supplied code
 */
exports.getNamedExports = getNamedExports;
const getGqlQueries = ast => {
  const gqlQueries = [];
  (0, _traverse.default)(ast, {
    TaggedTemplateExpression(path) {
      const gqlTag = path.node.tag;
      if (gqlTag.type === 'Identifier' && gqlTag.name === 'gql') {
        gqlQueries.push(path.node.quasi.quasis[0].value.raw);
      }
    }
  });
  return gqlQueries;
};
exports.getGqlQueries = getGqlQueries;
const getCellGqlQuery = ast => {
  let cellQuery = undefined;
  (0, _traverse.default)(ast, {
    ExportNamedDeclaration({
      node
    }) {
      if (node.exportKind === 'value' && _core.types.isVariableDeclaration(node.declaration)) {
        var _context2;
        const exportedQueryNode = (0, _find.default)(_context2 = node.declaration.declarations).call(_context2, d => {
          return _core.types.isIdentifier(d.id) && d.id.name === 'QUERY' && _core.types.isTaggedTemplateExpression(d.init);
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
exports.getCellGqlQuery = getCellGqlQuery;
const hasDefaultExport = ast => {
  let exported = false;
  (0, _traverse.default)(ast, {
    ExportDefaultDeclaration() {
      exported = true;
      return;
    }
  });
  return exported;
};
exports.hasDefaultExport = hasDefaultExport;
const getDefaultExportLocation = ast => {
  // Get the default export
  let defaultExport;
  (0, _traverse.default)(ast, {
    ExportDefaultDeclaration(path) {
      defaultExport = path.node;
    }
  });
  if (!defaultExport) {
    return null;
  }

  // Handle the case were we're exporting a variable declared elsewhere
  // as we will want to find the location of that declaration instead
  if (_core.types.isIdentifier(defaultExport.declaration) && _core.types.isFile(ast)) {
    var _context3;
    // Directly search the program body for the declaration of the identifier
    // to avoid picking up other identifiers with the same name in the file
    const exportedName = defaultExport.declaration.name;
    const declaration = (0, _find.default)(_context3 = ast.program.body).call(_context3, node => {
      var _context4;
      return _core.types.isVariableDeclaration(node) && (0, _find.default)(_context4 = node.declarations).call(_context4, d => {
        return _core.types.isVariableDeclarator(d) && _core.types.isIdentifier(d.id) && d.id.name === exportedName;
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
exports.getDefaultExportLocation = getDefaultExportLocation;