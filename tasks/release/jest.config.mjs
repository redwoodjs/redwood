export default {
  verbose: true,
  setupFiles: ['<rootDir>/jest.setup.mjs'],
  // ESM-specific settings:
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['<rootDir>/__tests__/*.test.mjs'],
}
