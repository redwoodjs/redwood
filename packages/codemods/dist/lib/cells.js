"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.parseGqlQueryToAst = exports.parseDocumentAST = exports.isFileInsideFolder = exports.isCellFile = exports.hasDefaultExport = exports.getNamedExports = exports.getCellGqlQuery = exports.findCells = exports.fileToAst = void 0;
require("core-js/modules/es.array.push.js");
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _endsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/ends-with"));
var _findIndex = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find-index"));
var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/starts-with"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _core = require("@babel/core");
var _parser = require("@babel/parser");
var _traverse = _interopRequireDefault(require("@babel/traverse"));
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _graphql = require("graphql");
var _projectConfig = require("@redwoodjs/project-config");
const findCells = (cwd = (0, _projectConfig.getPaths)().web.src) => {
  const modules = _fastGlob.default.sync('**/*Cell.{js,jsx,ts,tsx}', {
    cwd,
    absolute: true,
    ignore: ['node_modules']
  });
  return (0, _filter.default)(modules).call(modules, isCellFile);
};
exports.findCells = findCells;
const isCellFile = p => {
  const {
    dir,
    name
  } = _path.default.parse(p);

  // If the path isn't on the web side it cannot be a cell
  if (!isFileInsideFolder(p, (0, _projectConfig.getPaths)().web.src)) {
    return false;
  }

  // A Cell must be a directory named module.
  if (!(0, _endsWith.default)(dir).call(dir, name)) {
    return false;
  }
  const ast = fileToAst(p);

  // A Cell should not have a default export.
  if (hasDefaultExport(ast)) {
    return false;
  }

  // A Cell must export QUERY and Success.
  const exports = getNamedExports(ast);
  const exportedQUERY = (0, _findIndex.default)(exports).call(exports, v => v.name === 'QUERY') !== -1;
  const exportedSuccess = (0, _findIndex.default)(exports).call(exports, v => v.name === 'Success') !== -1;
  if (!exportedQUERY && !exportedSuccess) {
    return false;
  }
  return true;
};
exports.isCellFile = isCellFile;
const isFileInsideFolder = (filePath, folderPath) => {
  const {
    dir
  } = _path.default.parse(filePath);
  const relativePathFromFolder = _path.default.relative(folderPath, dir);
  if (!relativePathFromFolder || (0, _startsWith.default)(relativePathFromFolder).call(relativePathFromFolder, '..') || _path.default.isAbsolute(relativePathFromFolder)) {
    return false;
  } else {
    return true;
  }
};
exports.isFileInsideFolder = isFileInsideFolder;
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
            type: 're-export'
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
          type: 'variable'
        });
      } else if (declaration.type === 'FunctionDeclaration') {
        namedExports.push({
          name: declaration?.id?.name,
          type: 'function'
        });
      } else if (declaration.type === 'ClassDeclaration') {
        namedExports.push({
          name: declaration?.id?.name,
          type: 'class'
        });
      }
    }
  });
  return namedExports;
};
exports.getNamedExports = getNamedExports;
const fileToAst = filePath => {
  var _context;
  const code = _fs.default.readFileSync(filePath, 'utf-8');

  // use jsx plugin for web files, because in JS, the .jsx extension is not used
  const isJsxFile = _path.default.extname(filePath).match(/[jt]sx$/) || isFileInsideFolder(filePath, (0, _projectConfig.getPaths)().web.base);
  const plugins = (0, _filter.default)(_context = ['typescript', 'nullishCoalescingOperator', 'objectRestSpread', isJsxFile && 'jsx']).call(_context, Boolean);
  try {
    return (0, _parser.parse)(code, {
      sourceType: 'module',
      plugins
    });
  } catch (e) {
    // console.error(chalk.red(`Error parsing: ${filePath}`))
    console.error(e);
    throw new Error(e?.message); // we throw, so typescript doesn't complain about returning
  }
};
exports.fileToAst = fileToAst;
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
const parseGqlQueryToAst = gqlQuery => {
  const ast = (0, _graphql.parse)(gqlQuery);
  return parseDocumentAST(ast);
};
exports.parseGqlQueryToAst = parseGqlQueryToAst;
const parseDocumentAST = document => {
  const operations = [];
  (0, _graphql.visit)(document, {
    OperationDefinition(node) {
      var _context3;
      const fields = [];
      (0, _forEach.default)(_context3 = node.selectionSet.selections).call(_context3, field => {
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
exports.parseDocumentAST = parseDocumentAST;
const getFields = field => {
  // base
  if (!field.selectionSet) {
    return field.name.value;
  } else {
    const obj = {
      [field.name.value]: []
    };
    const lookAtFieldNode = node => {
      node.selectionSet?.selections.forEach(subField => {
        switch (subField.kind) {
          case _graphql.Kind.FIELD:
            obj[field.name.value].push(getFields(subField));
            break;
          case _graphql.Kind.FRAGMENT_SPREAD:
            // TODO: Maybe this will also be needed, right now it's accounted for to not crash in the tests
            break;
          case _graphql.Kind.INLINE_FRAGMENT:
            lookAtFieldNode(subField);
        }
      });
    };
    lookAtFieldNode(field);
    return obj;
  }
};