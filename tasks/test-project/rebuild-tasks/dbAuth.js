const fs = require('fs')
const path = require('path')

const execa = require('execa')

const {
  execAndStreamRedwoodCommand,
  updatePkgJsonScripts,
  getExecaOptions,
} = require('./util')

async function runDBAuthTask(task, OUTPUT_PROJECT_PATH) {
  // Temporarily disable postinstall script
  updatePkgJsonScripts({
    projectPath: OUTPUT_PROJECT_PATH,
    scripts: {
      postinstall: '',
    },
  })

  const dbAuthSetupPath = path.join(
    OUTPUT_PROJECT_PATH,
    'node_modules',
    '@redwoodjs',
    'auth-dbauth-setup'
  )

  // At an earlier step we run `yarn rwfw project:copy` which gives us
  // auth-dbauth-setup@3.2.0 currently. We need that version to be a canary
  // version for auth-dbauth-api and auth-dbauth-web package installations
  // to work. So we remove the current version and add a canary version
  // instead.

  fs.rmSync(dbAuthSetupPath, { recursive: true, force: true })

  await execAndStreamRedwoodCommand(
    task,
    ['setup', 'auth', 'dbAuth', '--force', '--no-webauthn'],
    OUTPUT_PROJECT_PATH
  )

  // Restore postinstall script
  updatePkgJsonScripts({
    projectPath: OUTPUT_PROJECT_PATH,
    scripts: {
      postinstall: 'yarn rwfw project:copy',
    },
  })

  const subprocess = execa(
    'yarn',
    ['rwfw', 'project:copy'],
    getExecaOptions(OUTPUT_PROJECT_PATH)
  )
  task.streamFromExeca(subprocess, {
    boxen: { title: 'yarn rwfw project:copy' },
  })
  await subprocess

  await execAndStreamRedwoodCommand(
    task,
    [
      'generate',
      'dbAuth',
      '--no-webauthn',
      '--username-label=username',
      '--password-label=password',
    ],
    OUTPUT_PROJECT_PATH
  )

  // update directive in contacts.sdl.ts
  const pathContactsSdl = `${OUTPUT_PROJECT_PATH}/api/src/graphql/contacts.sdl.ts`
  const contentContactsSdl = fs.readFileSync(pathContactsSdl, 'utf-8')
  const resultsContactsSdl = contentContactsSdl
    .replace(
      'createContact(input: CreateContactInput!): Contact! @requireAuth',
      `createContact(input: CreateContactInput!): Contact @skipAuth`
    )
    .replace(
      'deleteContact(id: Int!): Contact! @requireAuth',
      'deleteContact(id: Int!): Contact! @requireAuth(roles:["ADMIN"])'
    ) // make deleting contacts admin only
  fs.writeFileSync(pathContactsSdl, resultsContactsSdl)

  // update directive in posts.sdl.ts
  const pathPostsSdl = `${OUTPUT_PROJECT_PATH}/api/src/graphql/posts.sdl.ts`
  const contentPostsSdl = fs.readFileSync(pathPostsSdl, 'utf-8')
  const resultsPostsSdl = contentPostsSdl.replace(
    /posts: \[Post!\]! @requireAuth([^}]*)@requireAuth/,
    `posts: [Post!]! @skipAuth
post(id: Int!): Post @skipAuth`
  ) // make posts accessible to all

  fs.writeFileSync(pathPostsSdl, resultsPostsSdl)

  // Update src/lib/auth to return roles, so tsc doesn't complain
  const libAuthPath = `${OUTPUT_PROJECT_PATH}/api/src/lib/auth.ts`
  const libAuthContent = fs.readFileSync(libAuthPath, 'utf-8')

  const newLibAuthContent = libAuthContent
    .replace(
      'select: { id: true }',
      'select: { id: true, roles: true, email: true}'
    )
    .replace(
      'const currentUserRoles = context.currentUser?.roles',
      'const currentUserRoles = context.currentUser?.roles as string | string[]'
    )
  fs.writeFileSync(libAuthPath, newLibAuthContent)

  // update requireAuth test
  const pathRequireAuth = `${OUTPUT_PROJECT_PATH}/api/src/directives/requireAuth/requireAuth.test.ts`
  const contentRequireAuth = fs.readFileSync(pathRequireAuth).toString()
  const resultsRequireAuth = contentRequireAuth.replace(
    /const mockExecution([^}]*){} }\)/,
    `const mockExecution = mockRedwoodDirective(requireAuth, {
context: { currentUser: { id: 1, roles: 'ADMIN', email: 'b@zinga.com' } },
})`
  )
  fs.writeFileSync(pathRequireAuth, resultsRequireAuth)

  // add fullName input to signup form
  const pathSignupPageTs = `${OUTPUT_PROJECT_PATH}/web/src/pages/SignupPage/SignupPage.tsx`
  const contentSignupPageTs = fs.readFileSync(pathSignupPageTs, 'utf-8')
  const usernameFields = contentSignupPageTs.match(
    /\s*<Label[\s\S]*?name="username"[\s\S]*?"rw-field-error" \/>/
  )?.[0]
  const fullNameFields = usernameFields
    ?.replace(/\s*ref=\{usernameRef}/, '')
    ?.replaceAll('username', 'full-name')
    ?.replaceAll('Username', 'Full Name')

  const newContentSignupPageTs = contentSignupPageTs
    .replace(
      '<FieldError name="password" className="rw-field-error" />',
      '<FieldError name="password" className="rw-field-error" />\n' +
        fullNameFields
    )
    // include full-name in the data we pass to `signUp()`
    .replace(
      'password: data.password',
      "password: data.password, 'full-name': data['full-name']"
    )

  fs.writeFileSync(pathSignupPageTs, newContentSignupPageTs)

  // set fullName when signing up
  const pathAuthTs = `${OUTPUT_PROJECT_PATH}/api/src/functions/auth.ts`
  const contentAuthTs = fs.readFileSync(pathAuthTs).toString()
  const resultsAuthTs = contentAuthTs.replace(
    '// name: userAttributes.name',
    "fullName: userAttributes['full-name']"
  )

  fs.writeFileSync(pathAuthTs, resultsAuthTs)
}

module.exports = {
  runDBAuthTask,
}
