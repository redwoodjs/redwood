#!/usr/bin/env node
/* eslint-env node, es2021 */
import path from 'node:path'
import { $, cd } from 'zx'

process.env.FORCE_COLOR = '1'

const frameworkPath = path.resolve('../../', process.cwd())
const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD
const projectWebPath = path.join(projectPath, 'web')
const projectApiPath = path.join(projectPath, 'api')

// Get yarn major version
cd(projectPath)
const { stdout } = await $`yarn --version`
const yarnMajorVersion = stdout.trim().split('.').shift()

// Core
console.log('-'.repeat(80))
cd(`${frameworkPath}/packages/core`)
await $`rm -rf dist`
await $`yarn build`
await $`yarn pack`
await $`mv package.tgz ${projectPath}`

cd(projectPath)
await $`tar -xvzf ./package.tgz`
await $`yarn add -D${yarnMajorVersion === '1' ? 'W' : ''} ./package`
await $`yarn bin`

// Web
console.log('-'.repeat(80))
cd(`${frameworkPath}/packages/web`)
await $`rm -rf dist`
await $`yarn build`
await $`yarn pack`
await $`mv package.tgz ${projectWebPath}`

cd(projectWebPath)
await $`tar -xvzf ./package.tgz`
await $`yarn add ./package`
await $`yarn bin`

// Api
console.log('-'.repeat(80))
cd(`${frameworkPath}/packages/api`)
await $`rm -rf dist`
await $`yarn build`
await $`yarn pack`
await $`mv package.tgz ${projectApiPath}`

cd(projectApiPath)
await $`tar -xvzf ./package.tgz`
await $`yarn add ./package`
await $`yarn bin`

// Dist files
console.log('-'.repeat(80))
cd(frameworkPath)
// So that rwfw works
const rwfw = 'cli/dist/rwfw.js'
await $`cp ${frameworkPath}/packages/${rwfw} ${projectPath}/node_modules/@redwoodjs/${rwfw}`
// So that building prisma works
const generatePrismaClientPath = 'cli/dist/lib/generatePrismaClient.js'
await $`cp ${frameworkPath}/packages/${generatePrismaClientPath} ${projectPath}/node_modules/@redwoodjs/${generatePrismaClientPath}`
