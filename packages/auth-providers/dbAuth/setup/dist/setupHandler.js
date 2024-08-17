"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.createAuthDecoderFunction = void 0;
exports.handler = handler;
var _includes = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/includes"));
require("core-js/modules/es.array.push.js");
require("core-js/modules/esnext.json.parse.js");
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _prompts = _interopRequireDefault(require("prompts"));
var _cliHelpers = require("@redwoodjs/cli-helpers");
var _setupData = require("./setupData");
var _shared = require("./shared");
var _webAuthn = require("./webAuthn.setupData");
async function handler({
  webauthn,
  createUserModel,
  generateAuthPages,
  force: forceArg
}) {
  const {
    version
  } = JSON.parse(_fs.default.readFileSync(_path.default.resolve(__dirname, '../package.json'), 'utf-8'));
  const webAuthn = await shouldIncludeWebAuthn(webauthn);
  const createDbUserModel = await shouldCreateUserModel(createUserModel);
  const generateDbAuthPages = await shouldGenerateDbAuthPages(generateAuthPages);
  const oneMoreThing = [];
  if (webAuthn) {
    if (createDbUserModel) {
      oneMoreThing.push(..._setupData.notesCreatedUserModel);
    } else {
      oneMoreThing.push(..._webAuthn.notes);
    }
    if (!generateDbAuthPages) {
      oneMoreThing.push(..._webAuthn.noteGenerate);
    }
  } else {
    if (createDbUserModel) {
      oneMoreThing.push(..._setupData.notesCreatedUserModel);
    } else {
      oneMoreThing.push(..._setupData.notes);
    }
    if (!generateDbAuthPages) {
      oneMoreThing.push(..._setupData.noteGenerate);
    }
  }
  let createDbUserModelTask = undefined;
  if (createDbUserModel) {
    if (webAuthn) {
      createDbUserModelTask = _webAuthn.createUserModelTask;
    } else {
      createDbUserModelTask = _setupData.createUserModelTask;
    }
  }
  await (0, _cliHelpers.standardAuthHandler)({
    basedir: __dirname,
    forceArg,
    provider: 'dbAuth',
    authDecoderImport: "import { createAuthDecoder } from '@redwoodjs/auth-dbauth-api'",
    webAuthn,
    webPackages: [`@redwoodjs/auth-dbauth-web@${version}`, ...(webAuthn ? _webAuthn.webPackages : [])],
    apiPackages: [`@redwoodjs/auth-dbauth-api@${version}`, ...(webAuthn ? _webAuthn.apiPackages : [])],
    extraTasks: [webAuthn ? _webAuthn.extraTask : _setupData.extraTask, createDbUserModelTask, createAuthDecoderFunction, generateDbAuthPages ? (0, _shared.generateAuthPagesTask)(createDbUserModel) : undefined],
    notes: oneMoreThing
  });
}

/**
 * Prompt the user (unless already specified on the command line) if they want
 * to enable WebAuthn support
 */
async function shouldIncludeWebAuthn(webauthn) {
  if (webauthn === null) {
    const webAuthnResponse = await (0, _prompts.default)({
      type: 'confirm',
      name: 'answer',
      message: `Enable WebAuthn support (TouchID/FaceID)? See https://redwoodjs.com/docs/auth/dbAuth#webAuthn`,
      initial: false
    });
    return webAuthnResponse.answer;
  }
  return webauthn;
}

/**
 * Prompt the user (unless already specified on the command line) if they want
 * to create a User model in their Prisma schema
 */
async function shouldCreateUserModel(createUserModel) {
  const hasUserModel = await (0, _shared.hasModel)('User');
  const modelNames = await (0, _shared.getModelNames)();
  const isNewProject = modelNames.length === 1 && modelNames[0] === 'UserExample';
  if (isNewProject) {
    return true;
  }
  if (createUserModel === null && !hasUserModel) {
    const createModelResponse = await (0, _prompts.default)({
      type: 'confirm',
      name: 'answer',
      message: 'Create User model?',
      initial: false
    });
    return createModelResponse.answer;
  }
  return createUserModel;
}

/**
 * Prompt the user (unless already specified on the command line) if they want
 * to generate auth pages. Also checks to make sure auth pages don't already
 * exist before prompting.
 */
async function shouldGenerateDbAuthPages(generateAuthPages) {
  if (generateAuthPages === null && !(0, _shared.hasAuthPages)()) {
    const generateAuthPagesResponse = await (0, _prompts.default)({
      type: 'confirm',
      name: 'answer',
      message: 'Generate auth pages (login, signup, forgotten password, etc)?',
      initial: false
    });
    return generateAuthPagesResponse.answer;
  }
  return generateAuthPages;
}
const createAuthDecoderFunction = exports.createAuthDecoderFunction = {
  title: 'Create auth decoder function',
  task: () => {
    const graphqlPath = (0, _cliHelpers.getGraphqlPath)();
    if (!graphqlPath) {
      throw new Error('Could not find your graphql file path');
    }
    const authDecoderCreation = 'const authDecoder = createAuthDecoder(cookieName)';
    const content = _fs.default.readFileSync(graphqlPath, 'utf-8');
    let newContent = content.replace('import { getCurrentUser } from', 'import { cookieName, getCurrentUser } from');
    const authDecoderCreationRegexp = new RegExp('^' + escapeRegExp(authDecoderCreation), 'm');
    if (!authDecoderCreationRegexp.test(newContent)) {
      newContent = newContent.replace('export const handler = createGraphQLHandler({', authDecoderCreation + '\n\n' + 'export const handler = createGraphQLHandler({');
    }
    if (!(0, _includes.default)(newContent).call(newContent, 'import { cookieName')) {
      throw new Error('Failed to import cookieName');
    }
    _fs.default.writeFileSync(graphqlPath, newContent);
  }
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}