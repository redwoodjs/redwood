#!/usr/bin/env node
/* eslint-env node, es2021 */
/**
 * This is a temporary utility.
 */
import path from 'node:path'
import { $, cd } from 'zx'

const projectPath = process.argv?.[2] ?? process.env.RWJS_CWD
const projectWebPath = path.join(projectPath, 'web')
const projectApiPath = path.join(projectPath, 'api')

// rw
cd(projectPath)
await $`yarn rw --help`
cd(projectWebPath)
await $`yarn rw --help`
cd(projectApiPath)
await $`yarn rw --help`

// build
cd(projectPath)
await $`yarn rw build`
cd(projectWebPath)
await $`yarn rw build`
cd(projectApiPath)
await $`yarn rw build`

// check
cd(projectPath)
await $`yarn rw check`
cd(projectWebPath)
await $`yarn rw check`
cd(projectApiPath)
await $`yarn rw check`

// console
// cd(projectPath)
// await $`yarn rw console`
// cd(projectWebPath)
// await $`yarn rw console`
// cd(projectApiPath)
// await $`yarn rw console`

// data-migrate
cd(projectPath)
await $`yarn rw data-migrate install`

// generate
cd(projectPath)
await $`yarn rw g page home /`
cd(projectWebPath)
await $`yarn rw g page about`
cd(projectApiPath)
await $`yarn rw g page contact`

// destroy
cd(projectPath)
await $`yarn rw d page home /`
cd(projectWebPath)
await $`yarn rw d page about`
cd(projectApiPath)
await $`yarn rw d page contact`

// exec
cd(projectPath)
await $`yarn rw g script bazinga`
cd(projectPath)
await $`yarn rw exec bazinga`

cd(projectWebPath)
await $`yarn rw g script bazingaWeb`
cd(projectWebPath)
await $`yarn rw exec bazingaWeb`

cd(projectApiPath)
await $`yarn rw g script bazingaApi`
cd(projectApiPath)
await $`yarn rw exec bazingaApi`

// info
cd(projectPath)
await $`yarn rw info`
cd(projectWebPath)
await $`yarn rw info`
cd(projectApiPath)
await $`yarn rw info`

// prerender
cd(projectPath)
await $`yarn rw prerender`
cd(projectWebPath)
await $`yarn rw prerender`
cd(projectApiPath)
await $`yarn rw prerender`

// prisma
cd(projectPath)
await $`yarn rw prisma`
cd(projectWebPath)
await $`yarn rw prisma`
cd(projectApiPath)
await $`yarn rw prisma`
