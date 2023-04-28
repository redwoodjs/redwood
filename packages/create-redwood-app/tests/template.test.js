/* eslint-env node, es2022 */

import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { test } from 'node:test'

const TEMPLATE_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../template'
)

const EXPECTED_FILES = [
  '/.editorconfig',
  '/.env',
  '/.env.defaults',
  '/.env.example',
  '/.nvmrc',
  '/.vscode/extensions.json',
  '/.vscode/launch.json',
  '/.vscode/settings.json',
  '/.yarn/releases/yarn-3.5.0.cjs',
  '/.yarnrc.yml',
  '/README.md',
  '/api/db/schema.prisma',
  '/api/jest.config.js',
  '/api/package.json',
  '/api/server.config.js',
  '/api/src/directives/requireAuth/requireAuth.test.ts',
  '/api/src/directives/requireAuth/requireAuth.ts',
  '/api/src/directives/skipAuth/skipAuth.test.ts',
  '/api/src/directives/skipAuth/skipAuth.ts',
  '/api/src/functions/graphql.ts',
  '/api/src/graphql/.keep',
  '/api/src/lib/auth.ts',
  '/api/src/lib/db.ts',
  '/api/src/lib/logger.ts',
  '/api/src/services/.keep',
  '/api/tsconfig.json',
  '/gitignore.template',
  '/graphql.config.js',
  '/jest.config.js',
  '/package.json',
  '/prettier.config.js',
  '/redwood.toml',
  '/scripts/.keep',
  '/scripts/seed.ts',
  '/scripts/tsconfig.json',
  '/web/jest.config.js',
  '/web/package.json',
  '/web/public/README.md',
  '/web/public/favicon.png',
  '/web/public/robots.txt',
  '/web/src/App.tsx',
  '/web/src/Routes.tsx',
  '/web/src/components/.keep',
  '/web/src/index.css',
  '/web/src/index.html',
  '/web/src/layouts/.keep',
  '/web/src/pages/FatalErrorPage/FatalErrorPage.tsx',
  '/web/src/pages/NotFoundPage/NotFoundPage.tsx',
  '/web/tsconfig.json',
].sort()

// If you add, move, or remove a file from the create-redwood-app template,
// you'll have to update this test.
test("the file structure hasn't unintentionally changed", () => {
  // Sort because files are not always reported in the same order as the list
  assert.deepStrictEqual(walk(TEMPLATE_PATH).sort(), EXPECTED_FILES)
})

/**
 * Get all the files in a directory.
 *
 * @param {string} dir
 * @returns string[]
 */
function walk(dir) {
  /** @type {string[]} */
  let files = []

  const fileList = fs.readdirSync(dir)

  fileList.forEach((file) => {
    file = path.join(dir, file)

    const stat = fs.statSync(file)

    if (!stat) {
      throw new Error(`Failed to get stats for ${file}`)
    }

    if (stat.isDirectory()) {
      // Recurse into directory
      files = files.concat(walk(file))
    } else {
      // It's a file
      files.push(file)
    }
  })

  return files.map((file) =>
    file.replace(TEMPLATE_PATH, '').split(path.sep).join(path.posix.sep)
  )
}
