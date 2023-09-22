/* eslint-env node */
// @ts-check

import path from 'node:path'

import cache from '@actions/cache'
import core from '@actions/core'
import { exec } from '@actions/exec'

import {
  createCacheKeys,
  createExecWithEnvInCwd,
} from '../actionsLib.mjs'

import { main } from './setUpRscProject.mjs'

const rscProjectPath = path.join(
  path.dirname(process.cwd()),
  'rsc-project'
)

const {
  dependenciesKey,
  distKey
} = await createCacheKeys({ baseKeyPrefix: 'rsc-project', distKeyPrefix: 'rsc' })

const execInProject = createExecWithEnvInCwd(rscProjectPath)

main(rscProjectPath, core, dependenciesKey, distKey, cache, exec, execInProject)
