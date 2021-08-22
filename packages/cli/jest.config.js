module.exports = {
  testMatch: ['**/*.test.[jt]s?(x)'],
  testPathIgnorePatterns: ['/fixtures/', '/dist/'],
  transform: {
    '^.+\\.js$': [
      'esbuild-jest',
      {
        format: 'cjs',
        target: 'node14',
        sourcemap: true,
        loaders: {
          '.test.js': 'js',
        },
      },
    ],
  },
}
