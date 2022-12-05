export const MOCK_ERR_NOT_AUTHED = {
  exitCode: 100,
  stdout: '',
  stderr: ' ›   Error: not logged in',
}

export const ERR_PAYMENT = {
  stdout: '',
  stderr:
    'Creating dev-redwood-app... !\n' +
    ' ▸    To create an app, verify your account by adding payment information.\n' +
    ' ▸    Verify now at https://heroku.com/verify Learn more at\n' +
    ' ▸    https://devcenter.heroku.com/articles/account-verification',
  exitCode: 1,
}

export const ERR_APP_NAME_TAKEN = {
  stdout: '',
  stderr:
    'Creating dev-redwood-app... !\n ▸    Name dev-redwood-app is already taken',
  exitCode: 1,
}

export const EXECA_ERR = {
  message: 'Command failed with ENOENT: unknown command spawn unknown ENOENT',
  errno: -2,
  code: 'ENOENT',
  syscall: 'spawn unknown',
  path: 'unknown',
  spawnargs: ['command'],
  originalMessage: 'spawn unknown ENOENT',
  shortMessage:
    'Command failed with ENOENT: unknown command spawn unknown ENOENT',
  command: 'unknown command',
  escapedCommand: 'unknown command',
  stdout: '',
  stderr: '',
  all: '',
  failed: true,
  timedOut: false,
  isCanceled: false,
  killed: false,
}

export const SPAWN_OK = {
  command: 'heroku auth:whoami',
  escapedCommand: 'heroku "auth:whoami"',
  exitCode: 0,
  stdout: 'ryan.lewis@codingzeal.com',
  stderr: undefined,
  failed: false,
  timedOut: false,
  isCanceled: false,
  killed: false,
}

/*
already taken:
Name dev-redwood-app is already taken

success create
{
    command: 'heroku apps:create --addons heroku-postgresql -b heroku/nodejs -b https://github.com/heroku/heroku-buildpack-nginx dev-redwood-app',
    escapedCommand: 'heroku "apps:create" --addons heroku-postgresql -b "heroku/nodejs" -b "https://github.com/heroku/heroku-buildpack-nginx" dev-redwood-app',
    exitCode: 0,
    stdout: 'https://dev-redwood-app.herokuapp.com/ | https://git.heroku.com/dev-redwood-app.git',
    stderr: undefined,
    failed: false,
    timedOut: false,
    isCanceled: false,
    killed: false
  }
*/
