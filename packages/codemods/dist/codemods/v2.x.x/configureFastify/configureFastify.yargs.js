"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.handler = exports.description = exports.command = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _fetch = require("@whatwg-node/fetch");
var _fastGlob = _interopRequireDefault(require("fast-glob"));
var _tasuku = _interopRequireDefault(require("tasuku"));
var _projectConfig = require("@redwoodjs/project-config");
var _prettify = _interopRequireDefault(require("../../../lib/prettify"));
var _runTransform = _interopRequireDefault(require("../../../lib/runTransform"));
const command = exports.command = 'configure-fastify';
const description = exports.description = '(v2.x.x->v2.x.x) Updates api side’s server.config.js to configure Fastify';
const handler = () => {
  (0, _tasuku.default)('Configure Fastify', async ({
    setOutput
  }) => {
    const [API_SERVER_CONFIG_PATH] = _fastGlob.default.sync('server.config.{js,ts}', {
      cwd: (0, _projectConfig.getPaths)().api.base,
      absolute: true
    });
    if (_fs.default.existsSync(API_SERVER_CONFIG_PATH)) {
      await (0, _runTransform.default)({
        transformPath: _path.default.join(__dirname, 'configureFastify.js'),
        targetPaths: [API_SERVER_CONFIG_PATH]
      });

      // The transform generates two extra semicolons for some reason:
      //
      // ```js
      // module.exports = { config };;
      // ```
      //
      // They don't show up in tests cause we run prettier. Let's do the same here.
      _fs.default.writeFileSync(API_SERVER_CONFIG_PATH, await (0, _prettify.default)(_fs.default.readFileSync(API_SERVER_CONFIG_PATH, 'utf-8')));
      setOutput('All done!');
    } else {
      const res = await (0, _fetch.fetch)('https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/api/server.config.js');
      const text = await res.text();
      const NEW_API_SERVER_CONFIG_PATH = _path.default.join((0, _projectConfig.getPaths)().api.base, 'server.config.js');
      _fs.default.writeFileSync(NEW_API_SERVER_CONFIG_PATH, await (0, _prettify.default)(text));
      setOutput('Done! No server.config.js found, so we updated your project to use the latest version.');
    }
  });
};
exports.handler = handler;