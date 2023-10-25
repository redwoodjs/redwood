/* eslint-env node */
// @ts-check

import path from 'node:path'

import core from '@actions/core'

import { createExecWithEnvInCwd, setUpRscTestProject } from '../actionsLib.mjs'

const testProjectAndFixtureName = 'test-project-rsa'
const testProjectPath = path.join(
  path.dirname(process.cwd()),
  testProjectAndFixtureName
)
const execInProject = createExecWithEnvInCwd(testProjectPath)

setUpRscTestProject(
  testProjectPath,
  testProjectAndFixtureName,
  core,
  execInProject
)
