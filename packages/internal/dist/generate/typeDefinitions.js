"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.mirrorPathForDirectoryNamedModules = exports.mirrorPathForCell = exports.generateViteClientTypesDirective = exports.generateTypeDefs = exports.generateTypeDefTestMocks = exports.generateTypeDefScenarios = exports.generateTypeDefRouterRoutes = exports.generateTypeDefRouterPages = exports.generateTypeDefGlobalContext = exports.generateTypeDefGlobImports = exports.generateTypeDefCurrentUser = exports.generateMirrorDirectoryNamedModules = exports.generateMirrorDirectoryNamedModule = exports.generateMirrorCells = exports.generateMirrorCell = void 0;
require("core-js/modules/es.array.push.js");
require("core-js/modules/esnext.json.parse.js");
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/starts-with"));
var _stringify = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/json/stringify"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _flat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/flat"));
var _keys = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/object/keys"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _sourceMap = require("source-map");
var _projectConfig = require("@redwoodjs/project-config");
var _ast = require("../ast");
var _files = require("../files");
var _gql = require("../gql");
var _jsx = require("../jsx");
var _graphqlCodeGen = require("./graphqlCodeGen");
var _templates = require("./templates");
// TODO:
// Common return format for CLI output:
// ['type', 'relative path to base']

// Note for contributors:
//
// The functions in this file generate type definitions of which there are two types:
//
// 1. Mirror types: Create a virtual directory that allows us to type
// cells and directory named modules.
// 2. Types based on contents of other files
//
// When generating a new type definition that targets a particular side,
// you must prefix the generated filename
// with "web-" or "api-" to target inclusion for that side,
// or use "all-" for both. This is controlled by the user's "tsconfig.json"
// file.

/**
 * Generate all the types for a RedwoodJS project
 * and return the generated path to files, so they're logged
 */
const generateTypeDefs = async () => {
  // Return all the paths so they can be printed
  const {
    typeDefFiles: gqlApiTypeDefFiles,
    errors: apiErrors
  } = await (0, _graphqlCodeGen.generateTypeDefGraphQLApi)();
  const {
    typeDefFiles: gqlWebTypeDefFiles,
    errors: webErrors
  } = await (0, _graphqlCodeGen.generateTypeDefGraphQLWeb)();
  return {
    typeDefFiles: [...generateMirrorDirectoryNamedModules(), ...generateMirrorCells(), ...generateTypeDefRouterPages(), ...generateTypeDefCurrentUser(), ...generateTypeDefRouterRoutes(), ...generateTypeDefGlobImports(), ...generateTypeDefGlobalContext(), ...generateTypeDefScenarios(), ...generateTypeDefTestMocks(), ...generateStubStorybookTypes(), ...generateViteClientTypesDirective(), ...gqlApiTypeDefFiles, ...gqlWebTypeDefFiles],
    errors: [...apiErrors, ...webErrors]
  };
};
exports.generateTypeDefs = generateTypeDefs;
const generateMirrorDirectoryNamedModules = () => {
  var _context;
  const rwjsPaths = (0, _projectConfig.getPaths)();
  return (0, _map.default)(_context = (0, _files.findDirectoryNamedModules)()).call(_context, p => generateMirrorDirectoryNamedModule(p, rwjsPaths));
};
exports.generateMirrorDirectoryNamedModules = generateMirrorDirectoryNamedModules;
const mirrorPathForDirectoryNamedModules = (p, rwjsPaths = (0, _projectConfig.getPaths)()) => {
  return [_path.default.join(rwjsPaths.generated.types.mirror, _path.default.relative(rwjsPaths.base, _path.default.dirname(p))), 'index.d.ts'];
};
exports.mirrorPathForDirectoryNamedModules = mirrorPathForDirectoryNamedModules;
const generateMirrorDirectoryNamedModule = (p, rwjsPaths = (0, _projectConfig.getPaths)()) => {
  const [mirrorDir, typeDef] = mirrorPathForDirectoryNamedModules(p, rwjsPaths);
  _fs.default.mkdirSync(mirrorDir, {
    recursive: true
  });
  const typeDefPath = _path.default.join(mirrorDir, typeDef);
  const {
    name
  } = _path.default.parse(p);
  (0, _templates.writeTemplate)('templates/mirror-directoryNamedModule.d.ts.template', typeDefPath, {
    name
  });

  // We add a source map to allow "go to definition" to avoid ending in the .d.ts file
  // We do this for the web side only
  if ((0, _startsWith.default)(p).call(p, rwjsPaths.web.src)) {
    try {
      // Get the line and column where the default export is defined
      const fileContents = (0, _ast.fileToAst)(p);
      const defaultExportLocation = (0, _ast.getDefaultExportLocation)(fileContents) ?? {
        line: 1,
        column: 0
      };

      // Generate a source map that points to the definition of the default export
      const map = new _sourceMap.SourceMapGenerator({
        file: 'index.d.ts'
      });
      map.addMapping({
        generated: {
          line: 4,
          column: 0
        },
        source: _path.default.relative(_path.default.dirname(typeDefPath), p),
        original: defaultExportLocation
      });
      _fs.default.writeFileSync(`${typeDefPath}.map`, (0, _stringify.default)(map.toJSON(), undefined, 2));
    } catch (error) {
      console.error("Couldn't generate a definition map for directory named module at path:", p);
      console.error(error);
    }
  }
  return typeDefPath;
};
exports.generateMirrorDirectoryNamedModule = generateMirrorDirectoryNamedModule;
const generateMirrorCells = () => {
  var _context2;
  const rwjsPaths = (0, _projectConfig.getPaths)();
  return (0, _map.default)(_context2 = (0, _files.findCells)()).call(_context2, p => generateMirrorCell(p, rwjsPaths));
};
exports.generateMirrorCells = generateMirrorCells;
const mirrorPathForCell = (p, rwjsPaths = (0, _projectConfig.getPaths)()) => {
  const mirrorDir = _path.default.join(rwjsPaths.generated.types.mirror, _path.default.relative(rwjsPaths.base, _path.default.dirname(p)));
  _fs.default.mkdirSync(mirrorDir, {
    recursive: true
  });
  return [mirrorDir, 'index.d.ts'];
};
exports.mirrorPathForCell = mirrorPathForCell;
const generateMirrorCell = (p, rwjsPaths = (0, _projectConfig.getPaths)()) => {
  const [mirrorDir, typeDef] = mirrorPathForCell(p, rwjsPaths);
  _fs.default.mkdirSync(mirrorDir, {
    recursive: true
  });
  const typeDefPath = _path.default.join(mirrorDir, typeDef);
  const {
    name
  } = _path.default.parse(p);
  const fileContents = (0, _ast.fileToAst)(p);
  const cellQuery = (0, _ast.getCellGqlQuery)(fileContents);
  if (cellQuery) {
    const gqlDoc = (0, _gql.parseGqlQueryToAst)(cellQuery)[0];
    (0, _templates.writeTemplate)('templates/mirror-cell.d.ts.template', typeDefPath, {
      name,
      queryResultType: `${gqlDoc?.name}`,
      queryVariablesType: `${gqlDoc?.name}Variables`
    });
  } else {
    // If for some reason we can't parse the query, generated the mirror cell anyway
    (0, _templates.writeTemplate)('templates/mirror-cell.d.ts.template', typeDefPath, {
      name,
      queryResultType: 'any',
      queryVariablesType: 'any'
    });
  }

  // We add a source map to allow "go to definition" to avoid ending in the .d.ts file
  // Unlike pages, layouts, components etc. there is no clear definition location so we link
  // to the Success component
  try {
    // Get the location of the Success component
    const exportedComponents = (0, _ast.getNamedExports)(fileContents);
    const successComponent = (0, _find.default)(exportedComponents).call(exportedComponents, x => x.name === 'Success');
    if (successComponent === undefined) {
      throw new Error('No Success component found');
    }

    // Generate the map
    const map = new _sourceMap.SourceMapGenerator({
      file: 'index.d.ts'
    });
    map.addMapping({
      generated: {
        line: 12,
        column: 0
      },
      source: _path.default.relative(_path.default.dirname(typeDefPath), p),
      original: successComponent.location
    });
    _fs.default.writeFileSync(`${typeDefPath}.map`, (0, _stringify.default)(map.toJSON(), undefined, 2));
  } catch (error) {
    console.error("Couldn't generate a definition map for cell at path:", p);
    console.error(error);
  }
  return typeDefPath;
};
exports.generateMirrorCell = generateMirrorCell;
const writeTypeDefIncludeFile = (template, values = {}) => {
  const rwjsPaths = (0, _projectConfig.getPaths)();
  const typeDefPath = _path.default.join((0, _includes.default)(rwjsPaths.generated.types), template.replace('.template', ''));
  const templateFilename = _path.default.join('templates', template);
  (0, _templates.writeTemplate)(templateFilename, typeDefPath, values);
  return [typeDefPath];
};
const generateTypeDefRouterRoutes = () => {
  var _context3;
  const ast = (0, _ast.fileToAst)((0, _projectConfig.getPaths)().web.routes);
  let hasRootRoute = false;
  const routes = (0, _filter.default)(_context3 = (0, _jsx.getJsxElements)(ast, 'Route')).call(_context3, x => {
    // All generated "routes" should have a "name" and "path" prop-value
    const isValidRoute = typeof x.props?.path !== 'undefined' && typeof x.props?.name !== 'undefined';
    if (isValidRoute && x.props.path === '/') {
      hasRootRoute = true;
    }
    return isValidRoute;
  });

  // Generate declaration mapping for improved go-to-definition behaviour
  try {
    const typeDefPath = _path.default.join((0, _includes.default)((0, _projectConfig.getPaths)().generated.types), 'web-routerRoutes.d.ts');
    const map = new _sourceMap.SourceMapGenerator({
      file: 'web-routerRoutes.d.ts'
    });

    // Start line is based on where in the template the
    // `    ${name}: (params?: RouteParams<"${path}"> & QueryParams) => "${path}"`
    // line is defined
    const startLine = 7;

    // Map the location of the default export for each page
    for (let i = 0; i < routes.length; i++) {
      map.addMapping({
        generated: {
          line: startLine + i,
          column: 4
        },
        source: _path.default.relative(_path.default.dirname(typeDefPath), (0, _projectConfig.getPaths)().web.routes),
        original: routes[i].location
      });
    }
    _fs.default.writeFileSync(`${typeDefPath}.map`, (0, _stringify.default)(map.toJSON(), undefined, 2));
  } catch (error) {
    console.error("Couldn't generate a definition map for web-routerRoutes.d.ts:");
    console.error(error);
  }
  if (!hasRootRoute) {
    routes.push({
      name: 'splashPage route',
      location: {
        line: -1,
        column: -1
      },
      props: {
        path: '/',
        name: 'home'
      }
    });
  }
  return writeTypeDefIncludeFile('web-routerRoutes.d.ts.template', {
    routes
  });
};
exports.generateTypeDefRouterRoutes = generateTypeDefRouterRoutes;
const generateTypeDefRouterPages = () => {
  const pages = (0, _projectConfig.processPagesDir)();

  // Generate declaration map for better go-to-definition behaviour
  try {
    const typeDefPath = _path.default.join((0, _includes.default)((0, _projectConfig.getPaths)().generated.types), 'web-routesPages.d.ts');
    const map = new _sourceMap.SourceMapGenerator({
      file: 'web-routesPages.d.ts'
    });

    // Start line is based on where in the template the `  const ${importName}: typeof ${importName}Type` are defined
    const startLine = pages.length + 5;

    // Map the location of the default export for each page
    for (let i = 0; i < pages.length; i++) {
      const fileContents = (0, _ast.fileToAst)(pages[i].path);
      const defaultExportLocation = (0, _ast.getDefaultExportLocation)(fileContents) ?? {
        line: 1,
        column: 0
      };
      map.addMapping({
        generated: {
          line: startLine + i,
          column: 0
        },
        source: _path.default.relative(_path.default.dirname(typeDefPath), pages[i].path),
        original: defaultExportLocation
      });
    }
    _fs.default.writeFileSync(`${typeDefPath}.map`, (0, _stringify.default)(map.toJSON(), undefined, 2));
  } catch (error) {
    console.error("Couldn't generate a definition map for web-routesPages.d.ts:");
    console.error(error);
  }
  return writeTypeDefIncludeFile('web-routesPages.d.ts.template', {
    pages
  });
};
exports.generateTypeDefRouterPages = generateTypeDefRouterPages;
const generateTypeDefCurrentUser = () => {
  return writeTypeDefIncludeFile('all-currentUser.d.ts.template');
};
exports.generateTypeDefCurrentUser = generateTypeDefCurrentUser;
const generateTypeDefScenarios = () => {
  return writeTypeDefIncludeFile('api-scenarios.d.ts.template');
};
exports.generateTypeDefScenarios = generateTypeDefScenarios;
const generateTypeDefTestMocks = () => {
  var _context4;
  return (0, _flat.default)(_context4 = [writeTypeDefIncludeFile('api-test-globals.d.ts.template'), writeTypeDefIncludeFile('web-test-globals.d.ts.template')]).call(_context4);
};
exports.generateTypeDefTestMocks = generateTypeDefTestMocks;
const generateTypeDefGlobImports = () => {
  return writeTypeDefIncludeFile('api-globImports.d.ts.template');
};
exports.generateTypeDefGlobImports = generateTypeDefGlobImports;
const generateTypeDefGlobalContext = () => {
  return writeTypeDefIncludeFile('api-globalContext.d.ts.template');
};
/**
 * Typescript does not preserve triple slash directives when outputting js or d.ts files.
 * This is a work around so that *.svg, *.png, etc. imports have types.
 */
exports.generateTypeDefGlobalContext = generateTypeDefGlobalContext;
const generateViteClientTypesDirective = () => {
  const viteClientDirective = `/// <reference types="vite/client" />`;
  const redwoodProjectPaths = (0, _projectConfig.getPaths)();
  const viteClientDirectivePath = _path.default.join((0, _includes.default)(redwoodProjectPaths.generated.types), 'web-vite-client.d.ts');
  _fs.default.writeFileSync(viteClientDirectivePath, viteClientDirective);
  return [viteClientDirectivePath];
};
exports.generateViteClientTypesDirective = generateViteClientTypesDirective;
function generateStubStorybookTypes() {
  var _context5;
  const stubStorybookTypesFileContent = `\
declare module '@storybook/react' {
  export type Meta<T = any> = any
  export type StoryObj<T = any> = any
}
`;
  const redwoodProjectPaths = (0, _projectConfig.getPaths)();
  const packageJson = JSON.parse(_fs.default.readFileSync(_path.default.join(redwoodProjectPaths.base, 'package.json'), 'utf-8'));
  const hasCliStorybookVite = (0, _includes.default)(_context5 = (0, _keys.default)(packageJson['devDependencies'])).call(_context5, '@redwoodjs/cli-storybook-vite');
  if (hasCliStorybookVite) {
    return [];
  }
  const stubStorybookTypesFilePath = _path.default.join((0, _includes.default)(redwoodProjectPaths.generated.types), 'web-storybook.d.ts');
  _fs.default.writeFileSync(stubStorybookTypesFilePath, stubStorybookTypesFileContent);
  return [stubStorybookTypesFilePath];
}