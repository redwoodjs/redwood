// used by cli `rw test` command
// note: roodDir is a workaround for jest working directory weirdness
module.exports = {
  resolver: 'jest-directory-named-resolver',
  rootDir: process.cwd(),
}
