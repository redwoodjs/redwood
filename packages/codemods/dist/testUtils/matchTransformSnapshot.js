"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.matchTransformSnapshot = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _tempy = _interopRequireDefault(require("tempy"));
var _vitest = require("vitest");
var _runTransform = _interopRequireDefault(require("../lib/runTransform"));
var _index = require("./index");
const matchTransformSnapshot = async (transformName, fixtureName, parser) => {
  const tempFilePath = _tempy.default.file();

  // Looks up the path of the caller
  const testPath = _vitest.expect.getState().testPath;
  if (!testPath) {
    throw new Error('Could not find test path');
  }
  let fixturePath;
  const maybeFixturePath = _path.default.join(testPath, '../../__testfixtures__', `${fixtureName}.input`);
  for (const extension of ['ts', 'tsx', 'js', 'jsx']) {
    try {
      fixturePath = require.resolve(`${maybeFixturePath}.${extension}`);
    } catch {
      continue;
    }
  }
  if (!fixturePath) {
    throw new Error(`Could not find fixture for ${fixtureName} in ${maybeFixturePath}`);
  }
  const transformPath = require.resolve(_path.default.join(testPath, '../../', `${transformName}.ts`));

  // Step 1: Copy fixture to temp file
  _fs.default.copyFileSync(fixturePath, tempFilePath, _fs.default.constants.COPYFILE_FICLONE);

  // Step 2: Run transform against temp file
  await (0, _runTransform.default)({
    transformPath,
    targetPaths: [tempFilePath],
    parser,
    options: {
      verbose: 1,
      print: true
    }
  });

  // Step 3: Read modified file and snapshot
  const transformedContent = _fs.default.readFileSync(tempFilePath, 'utf-8');
  const expectedOutput = _fs.default.readFileSync(fixturePath.replace('.input.', '.output.'), 'utf-8');
  (0, _vitest.expect)(await (0, _index.formatCode)(transformedContent)).toEqual(await (0, _index.formatCode)(expectedOutput));
};
exports.matchTransformSnapshot = matchTransformSnapshot;