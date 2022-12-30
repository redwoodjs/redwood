export default {
  ...jest.requireActual('fs-extra'),
  ensureDirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  readJsonSync: jest.fn(),
  writeJsonSync: jest.fn(),
  copy: jest.fn(),
  createWriteStream: jest.fn(),
  remove: jest.fn(),
  outputFile: jest.fn(),
  chmodSync: jest.fn(),
  copySync: jest.fn()
}
