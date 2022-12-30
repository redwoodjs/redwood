export const HerokuApi = {
  apps: jest.fn(),
  create: jest.fn(),
  destroy: jest.fn(),
  whoami: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  push: jest.fn(),
  addRemote: jest.fn(),
  followLogs: jest.fn(),
}

export const HEROKU_ERRORS = {
  APP_CREATE_FAIL: 'mock create fail error',
}
