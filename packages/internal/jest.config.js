module.exports = {
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/fixtures/', 'dist'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testTimeout: 15000,
}
