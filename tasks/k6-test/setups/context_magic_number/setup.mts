#!/usr/bin/env node
/* eslint-env node, es6*/

import path from 'node:path'
import url from 'node:url'

import fs from 'fs-extra'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const validForTests = ['context_functions', 'context_graphql']

export function setup({ projectPath }: { projectPath: string }) {
  // Copy over SDL
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'benchmark.sdl.ts'),
    path.join(projectPath, 'api', 'src', 'graphql', 'benchmark.sdl.ts'),
  )

  // Copy over the service
  const benchmarkServicePath = path.join(
    projectPath,
    'api',
    'src',
    'services',
    'benchmarks',
  )
  fs.mkdirSync(benchmarkServicePath)
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'benchmarks.ts'),
    path.join(benchmarkServicePath, 'benchmarks.ts'),
  )

  // Copy over the function
  const benchmarkFunctionPath = path.join(
    projectPath,
    'api',
    'src',
    'functions',
  )
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'func.ts'),
    path.join(benchmarkFunctionPath, 'func.ts'),
  )
}
