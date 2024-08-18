"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.default = transform;
require("core-js/modules/es.array.push.js");
var _endsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/ends-with"));
var _filter = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/filter"));
var _find = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/find"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _startsWith = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/starts-with"));
var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/promise"));
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _promises = _interopRequireDefault(require("fs/promises"));
var _path = _interopRequireDefault(require("path"));
var _core = require("@svgr/core");
var _pascalcase = _interopRequireDefault(require("pascalcase"));
var _projectConfig = require("@redwoodjs/project-config");
/**
 * @param svgFilePath Full path to the existing svg file
 * @param outputPath Full path to the output file
 * @param componentName Name of the React component to generate inside the output file
 * @param typescript Whether to generate TypeScript code
 */
async function convertSvgToReactComponent(svgFilePath, outputPath, componentName, typescript) {
  const svgContents = await _promises.default.readFile(svgFilePath, 'utf-8');
  const jsCode = await (0, _core.transform)(svgContents, {
    jsxRuntime: 'automatic',
    plugins: ['@svgr/plugin-jsx'],
    typescript
  }, {
    componentName: componentName
  });
  await _promises.default.writeFile(outputPath, jsCode);
  console.log();
  console.log(`SVG converted to React component: ${outputPath}`);
}
async function transform(file, api) {
  var _context, _context2, _context3;
  const j = api.jscodeshift;
  const root = j(file.source);

  // If the input file is TypeScript, we'll generate TypeScript SVG components
  const isTS = (0, _endsWith.default)(_context = file.path).call(_context, '.tsx');

  // Find all import declarations with "*.svg" import
  const svgImports = (0, _filter.default)(_context2 = (0, _find.default)(root).call(root, j.ImportDeclaration)).call(_context2, path => {
    const importPath = path.node.source.value;
    return (0, _endsWith.default)(importPath).call(importPath, '.svg');
  });

  // This is if you directly export from svg:
  // e.g. export { default as X } from './X.svg'
  const svgNamedExports = (0, _filter.default)(_context3 = (0, _find.default)(root).call(root, j.ExportNamedDeclaration)).call(_context3, path => {
    var _context4;
    const source = path.value.source;
    return Boolean(source && typeof source.value === 'string' && (0, _endsWith.default)(_context4 = source.value).call(_context4, '.svg'));
  });
  const svgsToConvert = [];
  const importOrExportStatementsWithSvg = [...svgImports.paths(), ...svgNamedExports.paths()];
  // Process each import declaration
  (0, _forEach.default)(importOrExportStatementsWithSvg).call(importOrExportStatementsWithSvg, declaration => {
    const specifiers = declaration.node.specifiers;

    // Process each import specifier
    specifiers?.forEach(specifier => {
      var _context5;
      // The name of the improted SVG, assigned based on whether you are
      // importing or exporting directly
      let svgName = '';
      if (specifier.type === 'ExportSpecifier') {
        svgName = specifier.exported.name;
      } else if (specifier.type === 'ImportDefaultSpecifier') {
        if (!specifier.local) {
          // Un-freaking-likely, skip if it happens
          return;
        }
        svgName = specifier.local.name;
      }
      const sourcePath = declaration.node.source?.value;
      if (!sourcePath) {
        // Note sure how this is possible.... but TS tells me to do this
        // I guess because most export statements don't have a source?
        return;
      }
      const currentFolder = _path.default.dirname(file.path);
      let pathToSvgFile = _path.default.resolve(currentFolder, sourcePath);
      if ((0, _startsWith.default)(sourcePath).call(sourcePath, 'src/')) {
        pathToSvgFile = sourcePath.replace('src/', (0, _projectConfig.getPaths)().web.src + '/');
      }

      // Find the JSX elements that use the default import specifier
      // e,g, <MySvg />
      const svgsUsedAsComponent = root.findJSXElements(svgName);

      // Used as a render prop
      // <Component icon={MySvg} />
      const svgsUsedAsRenderProp = (0, _find.default)(root).call(root, j.JSXExpressionContainer, {
        expression: {
          type: 'Identifier',
          name: svgName
        }
      });

      // a) exported from another file e.g. export { default as MySvg } from './X.svg'
      // b) imported from another file e.g. import MySvg from './X.svg', then exported export { MySvg }
      const svgsReexported = (0, _filter.default)(_context5 = (0, _find.default)(root).call(root, j.ExportSpecifier)).call(_context5, path => {
        return path.value.local?.name === svgName || path.value.exported.name === svgName;
      });

      // Concat all of them, and loop over once
      const selectedSvgs = [...svgsUsedAsComponent.paths(), ...svgsUsedAsRenderProp.paths(), ...svgsReexported.paths()];
      (0, _forEach.default)(selectedSvgs).call(selectedSvgs, () => {
        svgsToConvert.push({
          filePath: pathToSvgFile,
          importSourcePath: declaration.node.source // imports are all strings in this case
        });
      });
    });
  });
  if (svgsToConvert.length > 0) {
    // if there are any svgs used as components, or render props, convert the svg to a react component
    await _promise.default.all((0, _map.default)(svgsToConvert).call(svgsToConvert, async svg => {
      const svgFileNameWithoutExtension = _path.default.basename(svg.filePath, _path.default.extname(svg.filePath));
      const componentName = (0, _pascalcase.default)(svgFileNameWithoutExtension);
      const newFileName = `${componentName}SVG`;

      // The absolute path to the new file
      const outputPath = _path.default.join(_path.default.dirname(svg.filePath), `${newFileName}.${isTS ? 'tsx' : 'jsx'}`);
      try {
        await convertSvgToReactComponent(svg.filePath, outputPath, componentName, isTS);
      } catch (error) {
        console.error(`Error converting ${svg.filePath} to React component: ${error.message}`);

        // Don't proceed if SVGr fails
        return;
      }

      // If SVGr is successful, change the import path
      // '../../bazinga.svg' -> '../../BazingaSVG'
      // Use extname, incase ext casing does not match
      svg.importSourcePath.value = svg.importSourcePath.value.replace(`${svgFileNameWithoutExtension}${_path.default.extname(svg.filePath)}`, newFileName);
    }));
  }
  return root.toSource();
}