#!/usr/bin/env node
/* eslint-env node, es2021 */
import path from 'node:path'
import { $, cd } from 'zx'

process.env.FORCE_COLOR = '1'

const frameworkPath = path.resolve('../../', process.cwd())
const frameworkCorePath = path.join(frameworkPath, 'packages', 'core')
const frameworkWebPath = path.join(frameworkPath, 'packages', 'web')
const frameworkApiPath = path.join(frameworkPath, 'packages', 'api')

const projectPath = process.argv[2] ?? process.env.RWJS_CWD
const projectWebPath = path.join(projectPath, 'web')
const projectApiPath = path.join(projectPath, 'api')

// Core
console.log('-'.repeat(80))
cd(frameworkCorePath)
await $`rm -rf dist`
await $`yarn build`
await $`yarn pack`
await $`tar -xzf ./package.tgz`
cd(projectPath)
await $`yarn add -D ${path.join(frameworkCorePath, 'package')}`
await $`yarn bin`

// Web
console.log('-'.repeat(80))
cd(frameworkWebPath)
await $`rm -rf dist`
await $`yarn build`
await $`yarn pack`
await $`tar -xzf ./package.tgz`
cd(projectWebPath)
await $`yarn add ${path.join(frameworkWebPath, 'package')}`
await $`yarn bin`

// Api
console.log('-'.repeat(80))
cd(frameworkApiPath)
await $`rm -rf dist`
await $`yarn build`
await $`yarn pack`
await $`tar -xzf ./package.tgz`
cd(projectApiPath)
await $`yarn add ${path.join(frameworkApiPath, 'package')}`
await $`yarn bin`

// Dist files
console.log('-'.repeat(80))
cd(frameworkPath)
// So that rwfw works
const rwfw = path.join('cli', 'dist', 'rwfw.js')
await $`cp ${path.join(frameworkPath, 'packages', rwfw)} ${path.join(
  projectPath,
  'node_modules',
  '@redwoodjs',
  rwfw
)}`
// So that building prisma works
const generatePrismaClientPath = path.join(
  'cli',
  'dist',
  'lib',
  'generatePrismaClient.js'
)
await $`cp ${path.join(
  frameworkPath,
  'packages',
  generatePrismaClientPath
)} ${path.join(
  projectPath,
  'node_modules',
  '@redwoodjs',
  generatePrismaClientPath
)}`
