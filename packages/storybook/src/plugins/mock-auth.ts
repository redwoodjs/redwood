import type { PluginOption } from 'vite'

export function mockAuth(): PluginOption {
  return {
    name: 'mock-@redwoodjs/auth',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (id.includes('web/src/auth')) {
        // remove any existing import of `createAuth` without affecting
        // anything else.
        // this regex defines 3 capture groups, where the second is
        // `createAuth` — we want to remove that one.
        code = code.replace(
          /(import\s*{\s*[^}]*)(\bcreateAuth\b)([^}]*})/,
          '$1$3',
        )
        // Add import to mocked `createAuth` at the top of the file.
        code =
          "import { createAuthentication as createAuth } from '@redwoodjs/testing/dist/web/mockAuth.js'\n" +
          code
      }
      return code
    },
  }
}
