// We link to this file using "paths" in testing/tsconfig.js because TS
// doesn't support "exports" in package.json yet. When that is resolved
// this file should stay, but the config in tsconfig.json should be
// removed.
// See https://github.com/microsoft/TypeScript/issues/33079
export { RedwoodApolloProvider } from './RedwoodApolloProvider'
