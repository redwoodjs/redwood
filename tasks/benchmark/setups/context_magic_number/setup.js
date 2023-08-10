#!/usr/bin/env node
/* eslint-env node, es6*/

const path = require('path')

const fs = require('fs-extra')

const REDWOOD_PROJECT_DIRECTORY = process.argv.slice(2)[0]

function main() {
  // Copy over SDL
  fs.copyFileSync(
    path.join('.', 'templates', 'benchmark.sdl.ts'),
    path.join(
      REDWOOD_PROJECT_DIRECTORY,
      'api',
      'src',
      'graphql',
      'benchmark.sdl.ts'
    )
  )

  // Copy over the service
  const benchmarkServicePath = path.join(
    REDWOOD_PROJECT_DIRECTORY,
    'api',
    'src',
    'services',
    'benchmarks'
  )
  fs.mkdirSync(benchmarkServicePath)
  fs.copyFileSync(
    path.join('.', 'templates', 'benchmarks.ts'),
    path.join(benchmarkServicePath, 'benchmarks.ts')
  )

  // Copy over the function
  const benchmarkFunctionPath = path.join(
    REDWOOD_PROJECT_DIRECTORY,
    'api',
    'src',
    'functions'
  )
  fs.copyFileSync(
    path.join('.', 'templates', 'func.ts'),
    path.join(benchmarkFunctionPath, 'func.ts')
  )
}
main()
