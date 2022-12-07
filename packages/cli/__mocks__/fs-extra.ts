export default {
  ensureDirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readFileSync: jest.fn().mockReturnValue('filecontents'),
  writeFileSync: jest.fn(),
}
