import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { transform } from '@babel/core'
import fg from 'fast-glob'

const cwd = path.join(fileURLToPath(import.meta.url), './template')

const jsTemplateDirPath = path.join(
  fileURLToPath(import.meta.url),
  './templateJS'
)

// Get all TS files in the template.
const filePaths = fg.sync('{api,web}/src/**/*.{ts,tsx}', { cwd })

// Transform every file in turn.
for (const filePath of filePaths) {
  const jsCode = transformFile(filePath)

  fs.writeFileSync(
    path.join(
      jsTemplateDirPath,
      filePath.replace('.tsx', '.js').replace('.ts', '.js')
    ),
    jsCode,
    'utf-8'
  )
}

/**
 * Helper for transforming TS file to JS using Babel.
 *
 * @param {string} filePath
 */
function transformFile(filePath) {
  const tsCode = fs.readFileSync(filePath, 'utf8')
  const filename = path.basename(filePath)

  const result = transform(tsCode, {
    filename,
    cwd,
    configFile: false,
    plugins: [
      [
        '@babel/plugin-transform-typescript',
        // {
        //   isTSX: true,
        //   allExtensions: true,
        // },
      ],
    ],
    // retainLines: true,
  })

  if (!result?.code) {
    throw new Error(`Failed to transform ${filePath}`)
  }

  return result.code

  // return prettify(result.code, filename.replace(/\.ts$/, '.js'))
}

// Handle config files.
// Going to have to be rewritten slightly.
// fs.copyFileSync(
//   path.join(cwd, 'api/tsconfig.json'),
//   path.join(cwd, 'api/jsconfig.json')
// )

// fs.copyFileSync(
//   path.join(cwd, 'web/tsconfig.json'),
//   path.join(cwd, 'web/jsconfig.json')
// )

// fs.copyFileSync(
//   path.join(cwd, 'scripts/tsconfig.json'),
//   path.join(cwd, 'scripts/jsconfig.json')
// )
