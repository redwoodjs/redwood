// used by cli `rw test` command
// note: rootDir is a workaround for jest working directory weirdness
module.exports = {
  resolver: 'jest-directory-named-resolver',
  rootDir: process.cwd(),
  globals: {
    __REDWOOD__API_PROXY_PATH: '/',
  },
}
