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
var replaceComponentSvgs_exports = {};
__export(replaceComponentSvgs_exports, {
  default: () => transform
});
module.exports = __toCommonJS(replaceComponentSvgs_exports);
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var import_core = require("@svgr/core");
var import_pascalcase = __toESM(require("pascalcase"));
var import_project_config = require("@redwoodjs/project-config");
async function convertSvgToReactComponent(svgFilePath, outputPath, componentName, typescript) {
  const svgContents = await import_promises.default.readFile(svgFilePath, "utf-8");
  const jsCode = await (0, import_core.transform)(
    svgContents,
    {
      jsxRuntime: "automatic",
      plugins: ["@svgr/plugin-jsx"],
      typescript
    },
    {
      componentName
    }
  );
  await import_promises.default.writeFile(outputPath, jsCode);
  console.log();
  console.log(`SVG converted to React component: ${outputPath}`);
}
async function transform(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);
  const isTS = file.path.endsWith(".tsx");
  const svgImports = root.find(j.ImportDeclaration).filter((path2) => {
    const importPath = path2.node.source.value;
    return importPath.endsWith(".svg");
  });
  const svgNamedExports = root.find(j.ExportNamedDeclaration).filter((path2) => {
    const source = path2.value.source;
    return Boolean(
      source && typeof source.value === "string" && source.value.endsWith(".svg")
    );
  });
  const svgsToConvert = [];
  const importOrExportStatementsWithSvg = [
    ...svgImports.paths(),
    ...svgNamedExports.paths()
  ];
  importOrExportStatementsWithSvg.forEach((declaration) => {
    const specifiers = declaration.node.specifiers;
    specifiers?.forEach((specifier) => {
      let svgName = "";
      if (specifier.type === "ExportSpecifier") {
        svgName = specifier.exported.name;
      } else if (specifier.type === "ImportDefaultSpecifier") {
        if (!specifier.local) {
          return;
        }
        svgName = specifier.local.name;
      }
      const sourcePath = declaration.node.source?.value;
      if (!sourcePath) {
        return;
      }
      const currentFolder = import_path.default.dirname(file.path);
      let pathToSvgFile = import_path.default.resolve(currentFolder, sourcePath);
      if (sourcePath.startsWith("src/")) {
        pathToSvgFile = sourcePath.replace("src/", (0, import_project_config.getPaths)().web.src + "/");
      }
      const svgsUsedAsComponent = root.findJSXElements(svgName);
      const svgsUsedAsRenderProp = root.find(j.JSXExpressionContainer, {
        expression: {
          type: "Identifier",
          name: svgName
        }
      });
      const svgsReexported = root.find(j.ExportSpecifier).filter((path2) => {
        return path2.value.local?.name === svgName || path2.value.exported.name === svgName;
      });
      const selectedSvgs = [
        ...svgsUsedAsComponent.paths(),
        ...svgsUsedAsRenderProp.paths(),
        ...svgsReexported.paths()
      ];
      selectedSvgs.forEach(() => {
        svgsToConvert.push({
          filePath: pathToSvgFile,
          importSourcePath: declaration.node.source
          // imports are all strings in this case
        });
      });
    });
  });
  if (svgsToConvert.length > 0) {
    await Promise.all(
      svgsToConvert.map(async (svg) => {
        const svgFileNameWithoutExtension = import_path.default.basename(
          svg.filePath,
          import_path.default.extname(svg.filePath)
        );
        const componentName = (0, import_pascalcase.default)(svgFileNameWithoutExtension);
        const newFileName = `${componentName}SVG`;
        const outputPath = import_path.default.join(
          import_path.default.dirname(svg.filePath),
          `${newFileName}.${isTS ? "tsx" : "jsx"}`
        );
        try {
          await convertSvgToReactComponent(
            svg.filePath,
            outputPath,
            componentName,
            isTS
          );
        } catch (error) {
          console.error(
            `Error converting ${svg.filePath} to React component: ${error.message}`
          );
          return;
        }
        svg.importSourcePath.value = svg.importSourcePath.value.replace(
          `${svgFileNameWithoutExtension}${import_path.default.extname(svg.filePath)}`,
          newFileName
        );
      })
    );
  }
  return root.toSource();
}
