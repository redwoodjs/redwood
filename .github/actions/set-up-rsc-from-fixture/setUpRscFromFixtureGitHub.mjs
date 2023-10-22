/* eslint-env node */
// @ts-check

import path from 'node:path'

import core from '@actions/core'

import { createExecWithEnvInCwd } from '../actionsLib.mjs'

import { main } from './setUpRscFromFixture.mjs'

const rsaProjectPath = path.join(path.dirname(process.cwd()), 'rsa-project')

const execInProject = createExecWithEnvInCwd(rsaProjectPath)

main(rsaProjectPath, core, execInProject)
