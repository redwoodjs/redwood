"use strict";

var _Object$defineProperty = require("@babel/runtime-corejs3/core-js/object/define-property");
var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault").default;
_Object$defineProperty(exports, "__esModule", {
  value: true
});
exports.createUserModelTask = exports.apiPackages = void 0;
_Object$defineProperty(exports, "extraTask", {
  enumerable: true,
  get: function () {
    return _setupData.extraTask;
  }
});
exports.webPackages = exports.notes = exports.noteGenerate = void 0;
var _path = _interopRequireDefault(require("path"));
var _cliHelpers = require("@redwoodjs/cli-helpers");
var _shared = require("./shared");
var _setupData = require("./setupData");
// copy some identical values from dbAuth provider

// required packages to install on the web side
const webPackages = exports.webPackages = ['@simplewebauthn/browser@^7'];

// required packages to install on the api side
const apiPackages = exports.apiPackages = ['@simplewebauthn/server@^7'];
const createUserModelTask = exports.createUserModelTask = {
  title: 'Creating model `User`...',
  task: async ctx => {
    const hasUserModel = await (0, _shared.hasModel)('User');
    if (hasUserModel && !ctx.force) {
      throw new Error('User model already exists');
    }
    (0, _shared.addModels)(`
model User {
  id                  Int       @id @default(autoincrement())
  email               String    @unique
  hashedPassword      String
  salt                String
  resetToken          String?
  resetTokenExpiresAt DateTime?
  webAuthnChallenge   String? @unique
  credentials         UserCredential[]
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model UserCredential {
  id         String  @id
  userId     Int
  user       User    @relation(fields: [userId], references: [id])
  publicKey  Bytes
  transports String?
  counter    BigInt
}
`);
  }
};

// any notes to print out when the job is done
const notes = exports.notes = [`${_cliHelpers.colors.warning('Done! But you have a little more work to do:')}\n`, 'You will need to add a couple of fields to your User table in order', 'to store a hashed password, salt, reset token, and to connect it to', 'a new UserCredential model to keep track of any devices used with', 'WebAuthn authentication:', '', '  model User {', '    id                  Int @id @default(autoincrement())', '    email               String  @unique', '    hashedPassword      String', '    salt                String', '    resetToken          String?', '    resetTokenExpiresAt DateTime?', '    webAuthnChallenge   String? @unique', '    credentials         UserCredential[]', '  }', '', '  model UserCredential {', '    id         String  @id', '    userId     Int', '    user       User    @relation(fields: [userId], references: [id])', '    publicKey  Bytes', '    transports String?', '    counter    BigInt', '  }', '', 'If you already have existing user records you will need to provide', 'a default value for `hashedPassword` and `salt` or Prisma complains, so', 'change those to: ', '', '  hashedPassword String @default("")', '  salt           String @default("")', '', 'If you expose any of your user data via GraphQL be sure to exclude', '`hashedPassword` and `salt` (or whatever you named them) from the', 'SDL file that defines the fields for your user.', '', "You'll need to let Redwood know what fields you're using for your", "users' `id` and `username` fields. In this case we're using `id` and", '`email`, so update those in the `authFields` config in', `\`${_shared.functionsPath}/auth.js\`. This is also the place to tell Redwood if`, 'you used a different name for the `hashedPassword`, `salt`,', '`resetToken` or `resetTokenExpiresAt`, fields:`', '', '  authFields: {', "    id: 'id',", "    username: 'email',", "    hashedPassword: 'hashedPassword',", "    salt: 'salt',", "    resetToken: 'resetToken',", "    resetTokenExpiresAt: 'resetTokenExpiresAt',", "    challenge: 'webAuthnChallenge'", '  },', '', "To get the actual user that's logged in, take a look at `getCurrentUser()`", `in \`${_shared.libPath}/auth.js\`. We default it to something simple, but you may`, 'use different names for your model or unique ID fields, in which case you', 'need to update those calls (instructions are in the comment above the code).', '', 'Finally, we created a SESSION_SECRET environment variable for you in', `${_path.default.join((0, _cliHelpers.getPaths)().base, '.env')}. This value should NOT be checked`, 'into version control and should be unique for each environment you', 'deploy to. If you ever need to log everyone out of your app at once', 'change this secret to a new value and deploy. To create a new secret, run:', '', '  yarn rw generate secret', ''];
const noteGenerate = exports.noteGenerate = ['', 'Need simple Login, Signup, Forgot Password pages and WebAuthn prompts?', "We've got a generator for those as well:", '', '  yarn rw generate dbAuth'];