"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.transpileApi = exports.rebuildApi = exports.cleanApiBuild = exports.buildApi = void 0;
var _esbuild = require("esbuild");
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _babelConfig = require("@redwoodjs/babel-config");
var _projectConfig = require("@redwoodjs/project-config");
var _files = require("../files");
let BUILD_CTX = null;
const buildApi = async () => {
  // Reset the build context for rebuilding
  // No need to wait for promise to resolve
  BUILD_CTX?.dispose();
  BUILD_CTX = null;
  return transpileApi((0, _files.findApiFiles)());
};
exports.buildApi = buildApi;
const rebuildApi = async () => {
  const apiFiles = (0, _files.findApiFiles)();
  if (!BUILD_CTX) {
    BUILD_CTX = await (0, _esbuild.context)(getEsbuildOptions(apiFiles));
  }
  return BUILD_CTX.rebuild();
};
exports.rebuildApi = rebuildApi;
const cleanApiBuild = async () => {
  const rwjsPaths = (0, _projectConfig.getPaths)();
  return _fsExtra.default.remove(rwjsPaths.api.dist);
};
exports.cleanApiBuild = cleanApiBuild;
const runRwBabelTransformsPlugin = {
  name: 'rw-esbuild-babel-transform',
  setup(build) {
    const rwjsConfig = (0, _projectConfig.getConfig)();
    build.onLoad({
      filter: /\.(js|ts|tsx|jsx)$/
    }, async args => {
      // @TODO Implement LRU cache? Unsure how much of a performance benefit its going to be
      // Generate a CRC of file contents, then save it to LRU cache with a limit
      // without LRU cache, the memory usage can become unbound
      const transformedCode = await (0, _babelConfig.transformWithBabel)(args.path, (0, _babelConfig.getApiSideBabelPlugins)({
        openTelemetry: rwjsConfig.experimental.opentelemetry.enabled && rwjsConfig.experimental.opentelemetry.wrapApi,
        projectIsEsm: (0, _projectConfig.projectSideIsEsm)('api')
      }));
      if (transformedCode?.code) {
        return {
          contents: transformedCode.code,
          loader: 'js'
        };
      }
      throw new Error(`Could not transform file: ${args.path}`);
    });
  }
};
const transpileApi = async files => {
  return (0, _esbuild.build)(getEsbuildOptions(files));
};
exports.transpileApi = transpileApi;
function getEsbuildOptions(files) {
  const rwjsPaths = (0, _projectConfig.getPaths)();
  const format = (0, _projectConfig.projectSideIsEsm)('api') ? 'esm' : 'cjs';
  return {
    absWorkingDir: rwjsPaths.api.base,
    entryPoints: files,
    platform: 'node',
    target: 'node20',
    format,
    allowOverwrite: true,
    bundle: false,
    plugins: [runRwBabelTransformsPlugin],
    outdir: rwjsPaths.api.dist,
    // setting this to 'true' will generate an external sourcemap x.js.map
    // AND set the sourceMappingURL comment
    // (setting it to 'external' will ONLY generate the file, but won't add the comment)
    sourcemap: true
  };
}