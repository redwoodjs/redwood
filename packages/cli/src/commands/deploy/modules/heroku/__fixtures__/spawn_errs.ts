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
