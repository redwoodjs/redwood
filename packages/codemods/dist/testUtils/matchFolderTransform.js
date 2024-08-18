"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.matchFolderTransform = void 0;
var _map = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/map"));
var _forEach = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/for-each"));
var _path = _interopRequireDefault(require("path"));
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _fsExtra = _interopRequireDefault(require("fs-extra"));
var _vitest = require("vitest");
var _runTransform = _interopRequireDefault(require("../lib/runTransform"));
var _index = require("./index");
const matchFolderTransform = async (transformFunctionOrName, fixtureName, {
  removeWhitespace = false,
  targetPathsGlob = '**/*',
  useJsCodeshift = false
} = {}) => {
  const tempDir = (0, _index.createProjectMock)();

  // Override paths used in getPaths() utility func
  process.env.RWJS_CWD = tempDir;

  // Looks up the path of the caller
  const testPath = _vitest.expect.getState().testPath;
  if (!testPath) {
    throw new Error('Could not find test path');
  }
  const fixtureFolder = _path.default.join(testPath, '../../__testfixtures__', fixtureName || '');
  const fixtureInputDir = _path.default.join(fixtureFolder, 'input');
  const fixtureOutputDir = _path.default.join(fixtureFolder, 'output');

  // Step 1: Copy files recursively from fixture folder to temp
  _fsExtra.default.copySync(fixtureInputDir, tempDir, {
    overwrite: true
  });
  const GLOB_CONFIG = {
    absolute: false,
    dot: true,
    ignore: ['redwood.toml', '**/*.DS_Store'] // ignore the fake redwood.toml added for getPaths
  };

  // Step 2: Run transform against temp dir
  if (useJsCodeshift) {
    if (typeof transformFunctionOrName !== 'string') {
      throw new Error('When running matchFolderTransform with useJsCodeshift, transformFunction must be a string (file name of jscodeshift transform)');
    }
    const transformName = transformFunctionOrName;
    const transformPath = require.resolve(_path.default.join(testPath, '../../', `${transformName}.ts`));
    const targetPaths = _fastGlob.default.sync(targetPathsGlob, {
      ...GLOB_CONFIG,
      cwd: tempDir
    });

    // So that the transform can use getPaths() utility func
    // This is used inside the runTransform function
    process.env.RWJS_CWD = tempDir;
    await (0, _runTransform.default)({
      transformPath,
      targetPaths: (0, _map.default)(targetPaths).call(targetPaths, p => _path.default.join(tempDir, p))
    });
  } else {
    if (typeof transformFunctionOrName !== 'function') {
      throw new Error('transformFunction must be a function, if useJsCodeshift set to false');
    }
    const transformFunction = transformFunctionOrName;
    await transformFunction();
  }
  const transformedPaths = _fastGlob.default.sync(targetPathsGlob, {
    ...GLOB_CONFIG,
    cwd: tempDir
  });
  const expectedPaths = _fastGlob.default.sync(targetPathsGlob, {
    ...GLOB_CONFIG,
    cwd: fixtureOutputDir
  });

  // Step 3: Check output paths
  (0, _vitest.expect)(transformedPaths).toEqual(expectedPaths);

  // Step 4: Check contents of each file
  (0, _forEach.default)(transformedPaths).call(transformedPaths, transformedFile => {
    const actualPath = _path.default.join(tempDir, transformedFile);
    const expectedPath = _path.default.join(fixtureOutputDir, transformedFile);
    (0, _vitest.expect)(actualPath).toMatchFileContents(expectedPath, {
      removeWhitespace
    });
  });
  delete process.env.RWJS_CWD;
};
exports.matchFolderTransform = matchFolderTransform;