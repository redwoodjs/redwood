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
var typeDefinitions_exports = {};
__export(typeDefinitions_exports, {
  generateMirrorCell: () => generateMirrorCell,
  generateMirrorCells: () => generateMirrorCells,
  generateMirrorDirectoryNamedModule: () => generateMirrorDirectoryNamedModule,
  generateMirrorDirectoryNamedModules: () => generateMirrorDirectoryNamedModules,
  generateTypeDefCurrentUser: () => generateTypeDefCurrentUser,
  generateTypeDefGlobImports: () => generateTypeDefGlobImports,
  generateTypeDefGlobalContext: () => generateTypeDefGlobalContext,
  generateTypeDefRouterPages: () => generateTypeDefRouterPages,
  generateTypeDefRouterRoutes: () => generateTypeDefRouterRoutes,
  generateTypeDefScenarios: () => generateTypeDefScenarios,
  generateTypeDefTestMocks: () => generateTypeDefTestMocks,
  generateTypeDefs: () => generateTypeDefs,
  generateViteClientTypesDirective: () => generateViteClientTypesDirective,
  mirrorPathForCell: () => mirrorPathForCell,
  mirrorPathForDirectoryNamedModules: () => mirrorPathForDirectoryNamedModules
});
module.exports = __toCommonJS(typeDefinitions_exports);
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_source_map = require("source-map");
var import_project_config = require("@redwoodjs/project-config");
var import_ast = require("../ast");
var import_files = require("../files");
var import_gql = require("../gql");
var import_jsx = require("../jsx");
var import_graphqlCodeGen = require("./graphqlCodeGen");
var import_templates = require("./templates");
const generateTypeDefs = async () => {
  const { typeDefFiles: gqlApiTypeDefFiles, errors: apiErrors } = await (0, import_graphqlCodeGen.generateTypeDefGraphQLApi)();
  const { typeDefFiles: gqlWebTypeDefFiles, errors: webErrors } = await (0, import_graphqlCodeGen.generateTypeDefGraphQLWeb)();
  return {
    typeDefFiles: [
      ...generateMirrorDirectoryNamedModules(),
      ...generateMirrorCells(),
      ...generateTypeDefRouterPages(),
      ...generateTypeDefCurrentUser(),
      ...generateTypeDefRouterRoutes(),
      ...generateTypeDefGlobImports(),
      ...generateTypeDefGlobalContext(),
      ...generateTypeDefScenarios(),
      ...generateTypeDefTestMocks(),
      ...generateStubStorybookTypes(),
      ...generateViteClientTypesDirective(),
      ...gqlApiTypeDefFiles,
      ...gqlWebTypeDefFiles
    ],
    errors: [...apiErrors, ...webErrors]
  };
};
const generateMirrorDirectoryNamedModules = () => {
  const rwjsPaths = (0, import_project_config.getPaths)();
  return (0, import_files.findDirectoryNamedModules)().map(
    (p) => generateMirrorDirectoryNamedModule(p, rwjsPaths)
  );
};
const mirrorPathForDirectoryNamedModules = (p, rwjsPaths = (0, import_project_config.getPaths)()) => {
  return [
    import_path.default.join(
      rwjsPaths.generated.types.mirror,
      import_path.default.relative(rwjsPaths.base, import_path.default.dirname(p))
    ),
    "index.d.ts"
  ];
};
const generateMirrorDirectoryNamedModule = (p, rwjsPaths = (0, import_project_config.getPaths)()) => {
  const [mirrorDir, typeDef] = mirrorPathForDirectoryNamedModules(p, rwjsPaths);
  import_fs.default.mkdirSync(mirrorDir, { recursive: true });
  const typeDefPath = import_path.default.join(mirrorDir, typeDef);
  const { name } = import_path.default.parse(p);
  (0, import_templates.writeTemplate)(
    "templates/mirror-directoryNamedModule.d.ts.template",
    typeDefPath,
    { name }
  );
  if (p.startsWith(rwjsPaths.web.src)) {
    try {
      const fileContents = (0, import_ast.fileToAst)(p);
      const defaultExportLocation = (0, import_ast.getDefaultExportLocation)(fileContents) ?? {
        line: 1,
        column: 0
      };
      const map = new import_source_map.SourceMapGenerator({
        file: "index.d.ts"
      });
      map.addMapping({
        generated: {
          line: 4,
          column: 0
        },
        source: import_path.default.relative(import_path.default.dirname(typeDefPath), p),
        original: defaultExportLocation
      });
      import_fs.default.writeFileSync(
        `${typeDefPath}.map`,
        JSON.stringify(map.toJSON(), void 0, 2)
      );
    } catch (error) {
      console.error(
        "Couldn't generate a definition map for directory named module at path:",
        p
      );
      console.error(error);
    }
  }
  return typeDefPath;
};
const generateMirrorCells = () => {
  const rwjsPaths = (0, import_project_config.getPaths)();
  return (0, import_files.findCells)().map((p) => generateMirrorCell(p, rwjsPaths));
};
const mirrorPathForCell = (p, rwjsPaths = (0, import_project_config.getPaths)()) => {
  const mirrorDir = import_path.default.join(
    rwjsPaths.generated.types.mirror,
    import_path.default.relative(rwjsPaths.base, import_path.default.dirname(p))
  );
  import_fs.default.mkdirSync(mirrorDir, { recursive: true });
  return [mirrorDir, "index.d.ts"];
};
const generateMirrorCell = (p, rwjsPaths = (0, import_project_config.getPaths)()) => {
  const [mirrorDir, typeDef] = mirrorPathForCell(p, rwjsPaths);
  import_fs.default.mkdirSync(mirrorDir, { recursive: true });
  const typeDefPath = import_path.default.join(mirrorDir, typeDef);
  const { name } = import_path.default.parse(p);
  const fileContents = (0, import_ast.fileToAst)(p);
  const cellQuery = (0, import_ast.getCellGqlQuery)(fileContents);
  if (cellQuery) {
    const gqlDoc = (0, import_gql.parseGqlQueryToAst)(cellQuery)[0];
    (0, import_templates.writeTemplate)("templates/mirror-cell.d.ts.template", typeDefPath, {
      name,
      queryResultType: `${gqlDoc?.name}`,
      queryVariablesType: `${gqlDoc?.name}Variables`
    });
  } else {
    (0, import_templates.writeTemplate)("templates/mirror-cell.d.ts.template", typeDefPath, {
      name,
      queryResultType: "any",
      queryVariablesType: "any"
    });
  }
  try {
    const exportedComponents = (0, import_ast.getNamedExports)(fileContents);
    const successComponent = exportedComponents.find(
      (x) => x.name === "Success"
    );
    if (successComponent === void 0) {
      throw new Error("No Success component found");
    }
    const map = new import_source_map.SourceMapGenerator({
      file: "index.d.ts"
    });
    map.addMapping({
      generated: {
        line: 12,
        column: 0
      },
      source: import_path.default.relative(import_path.default.dirname(typeDefPath), p),
      original: successComponent.location
    });
    import_fs.default.writeFileSync(
      `${typeDefPath}.map`,
      JSON.stringify(map.toJSON(), void 0, 2)
    );
  } catch (error) {
    console.error("Couldn't generate a definition map for cell at path:", p);
    console.error(error);
  }
  return typeDefPath;
};
const writeTypeDefIncludeFile = (template, values = {}) => {
  const rwjsPaths = (0, import_project_config.getPaths)();
  const typeDefPath = import_path.default.join(
    rwjsPaths.generated.types.includes,
    template.replace(".template", "")
  );
  const templateFilename = import_path.default.join("templates", template);
  (0, import_templates.writeTemplate)(templateFilename, typeDefPath, values);
  return [typeDefPath];
};
const generateTypeDefRouterRoutes = () => {
  const ast = (0, import_ast.fileToAst)((0, import_project_config.getPaths)().web.routes);
  let hasRootRoute = false;
  const routes = (0, import_jsx.getJsxElements)(ast, "Route").filter((x) => {
    const isValidRoute = typeof x.props?.path !== "undefined" && typeof x.props?.name !== "undefined";
    if (isValidRoute && x.props.path === "/") {
      hasRootRoute = true;
    }
    return isValidRoute;
  });
  try {
    const typeDefPath = import_path.default.join(
      (0, import_project_config.getPaths)().generated.types.includes,
      "web-routerRoutes.d.ts"
    );
    const map = new import_source_map.SourceMapGenerator({
      file: "web-routerRoutes.d.ts"
    });
    const startLine = 7;
    for (let i = 0; i < routes.length; i++) {
      map.addMapping({
        generated: {
          line: startLine + i,
          column: 4
        },
        source: import_path.default.relative(import_path.default.dirname(typeDefPath), (0, import_project_config.getPaths)().web.routes),
        original: routes[i].location
      });
    }
    import_fs.default.writeFileSync(
      `${typeDefPath}.map`,
      JSON.stringify(map.toJSON(), void 0, 2)
    );
  } catch (error) {
    console.error(
      "Couldn't generate a definition map for web-routerRoutes.d.ts:"
    );
    console.error(error);
  }
  if (!hasRootRoute) {
    routes.push({
      name: "splashPage route",
      location: { line: -1, column: -1 },
      props: {
        path: "/",
        name: "home"
      }
    });
  }
  return writeTypeDefIncludeFile("web-routerRoutes.d.ts.template", { routes });
};
const generateTypeDefRouterPages = () => {
  const pages = (0, import_project_config.processPagesDir)();
  try {
    const typeDefPath = import_path.default.join(
      (0, import_project_config.getPaths)().generated.types.includes,
      "web-routesPages.d.ts"
    );
    const map = new import_source_map.SourceMapGenerator({
      file: "web-routesPages.d.ts"
    });
    const startLine = pages.length + 5;
    for (let i = 0; i < pages.length; i++) {
      const fileContents = (0, import_ast.fileToAst)(pages[i].path);
      const defaultExportLocation = (0, import_ast.getDefaultExportLocation)(fileContents) ?? {
        line: 1,
        column: 0
      };
      map.addMapping({
        generated: {
          line: startLine + i,
          column: 0
        },
        source: import_path.default.relative(import_path.default.dirname(typeDefPath), pages[i].path),
        original: defaultExportLocation
      });
    }
    import_fs.default.writeFileSync(
      `${typeDefPath}.map`,
      JSON.stringify(map.toJSON(), void 0, 2)
    );
  } catch (error) {
    console.error(
      "Couldn't generate a definition map for web-routesPages.d.ts:"
    );
    console.error(error);
  }
  return writeTypeDefIncludeFile("web-routesPages.d.ts.template", { pages });
};
const generateTypeDefCurrentUser = () => {
  return writeTypeDefIncludeFile("all-currentUser.d.ts.template");
};
const generateTypeDefScenarios = () => {
  return writeTypeDefIncludeFile("api-scenarios.d.ts.template");
};
const generateTypeDefTestMocks = () => {
  return [
    writeTypeDefIncludeFile("api-test-globals.d.ts.template"),
    writeTypeDefIncludeFile("web-test-globals.d.ts.template")
  ].flat();
};
const generateTypeDefGlobImports = () => {
  return writeTypeDefIncludeFile("api-globImports.d.ts.template");
};
const generateTypeDefGlobalContext = () => {
  return writeTypeDefIncludeFile("api-globalContext.d.ts.template");
};
const generateViteClientTypesDirective = () => {
  const viteClientDirective = `/// <reference types="vite/client" />`;
  const redwoodProjectPaths = (0, import_project_config.getPaths)();
  const viteClientDirectivePath = import_path.default.join(
    redwoodProjectPaths.generated.types.includes,
    "web-vite-client.d.ts"
  );
  import_fs.default.writeFileSync(viteClientDirectivePath, viteClientDirective);
  return [viteClientDirectivePath];
};
function generateStubStorybookTypes() {
  const stubStorybookTypesFileContent = `declare module '@storybook/react' {
  export type Meta<T = any> = any
  export type StoryObj<T = any> = any
}
`;
  const redwoodProjectPaths = (0, import_project_config.getPaths)();
  const packageJson = JSON.parse(
    import_fs.default.readFileSync(
      import_path.default.join(redwoodProjectPaths.base, "package.json"),
      "utf-8"
    )
  );
  const hasCliStorybookVite = Object.keys(
    packageJson["devDependencies"]
  ).includes("@redwoodjs/cli-storybook-vite");
  if (hasCliStorybookVite) {
    return [];
  }
  const stubStorybookTypesFilePath = import_path.default.join(
    redwoodProjectPaths.generated.types.includes,
    "web-storybook.d.ts"
  );
  import_fs.default.writeFileSync(stubStorybookTypesFilePath, stubStorybookTypesFileContent);
  return [stubStorybookTypesFilePath];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  generateMirrorCell,
  generateMirrorCells,
  generateMirrorDirectoryNamedModule,
  generateMirrorDirectoryNamedModules,
  generateTypeDefCurrentUser,
  generateTypeDefGlobImports,
  generateTypeDefGlobalContext,
  generateTypeDefRouterPages,
  generateTypeDefRouterRoutes,
  generateTypeDefScenarios,
  generateTypeDefTestMocks,
  generateTypeDefs,
  generateViteClientTypesDirective,
  mirrorPathForCell,
  mirrorPathForDirectoryNamedModules
});
