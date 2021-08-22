#!/usr/bin/env node
/* eslint-env node */

// EXPERIMENTAL:
// This file uses `swc` to build the Redwood framework.
// This is experimental and not intended for production because
// swc has some issues with transpilation.

import fs from 'fs'
import path from 'path'

import swc from '@swc/core'
import fg from 'fast-glob'

import { frameworkPkgJsonFiles, packageJsonName } from './lib/framework.mjs'

// TODO: Allow packages to be scoped.
const frameworkPkgs = frameworkPkgJsonFiles()

for (const pkgJsonPath of frameworkPkgs) {
  const pkgName = packageJsonName(pkgJsonPath)
  console.time('Building ' + pkgName)

  const pkgDir = path.dirname(pkgJsonPath)
  const srcDir = path.join(pkgDir, 'src')
  const dstDir = path.join(pkgDir, 'dist')

  const files = fg.sync('**/*.{js,ts,tsx}', {
    cwd: path.join(pkgDir, 'src'),
    ignore: ['**/*.test.js', '**/__tests__/**', '**/__mocks__/**', '**/*.d.ts'],
  })

  for (const p of files) {
    const outputPath = path.join(dstDir, p).replace(/\.(t|j)sx?$/, '.js')
    const oldFilename = path.basename(p)
    const newFilename = path.basename(outputPath)

    const result = swc.transformFileSync(path.join(srcDir, p), {
      root: pkgDir,
      filename: oldFilename,
      cwd: srcDir,
      outputPath,
      sourceMaps: true,
      env: {
        mode: 'usage',
      },
      jsc: {
        target: 'es2015',
        parser: {
          decorators: true,
          dynamicImport: true,
          syntax: 'typescript',
          tsx: path.extname(oldFilename) === '.tsx',
        },
      },
      module: {
        type: 'commonjs',
      },
    })

    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    const sourceMap = `\n//# sourceMappingURL=./${newFilename}.map`
    fs.writeFileSync(outputPath, result.code + sourceMap, 'utf-8')
    fs.writeFileSync(outputPath + '.map', result.map, 'utf-8')
  }

  if (pkgName === '@redwoodjs/cli') {
    const templates = fg.sync('**/*.template', {
      cwd: srcDir,
      ignore: [
        '**/*.test.js',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/*.d.ts',
      ],
    })
    for (const templatePath of templates) {
      const dest = path.join(dstDir, templatePath)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(path.join(srcDir, templatePath), dest)
    }
  }

  console.timeEnd('Building ' + pkgName)
}
