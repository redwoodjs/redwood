/* eslint-env node */
// @ts-check

import path from 'node:path'

import core from '@actions/core'
import { exec } from '@actions/exec'

import { createExecWithEnvInCwd } from '../actionsLib.mjs'

import { main } from './setUpRscProject.mjs'

const rscProjectPath = path.join(path.dirname(process.cwd()), 'rsc-project')

const execInProject = createExecWithEnvInCwd(rscProjectPath)

main(rscProjectPath, core, exec, execInProject)
