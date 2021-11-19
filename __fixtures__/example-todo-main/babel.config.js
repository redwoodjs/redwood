// This is added as a test for prebuild;
// check: packages/internal/**/build_api.test.ts
module.exports = {
  plugins: [
    [
      'babel-plugin-auto-import',
      {
        declarations: [
          {
            // import kitty from 'kitty-purr'
            default: 'kitty',
            path: 'kitty-purr',
          },
        ],
      },
    ],
  ]
}
