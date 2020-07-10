import { resolve } from 'path'
import { RWProject } from '../model'
import { DefaultHost } from '../ide'
import { build } from './command_builder'
import { CLIUI } from './ui'

/**
 * example usage of the interactive CLI
 */
async function test() {
  const ui = new CLIUI()
  const projectRoot = resolve(__dirname, '../../fixtures/example-todo-master')
  const host = new DefaultHost()
  const project = new RWProject({ projectRoot, host })
  const cmd = await build({ project, ui, args: {} })
  console.log(`cmd = ${cmd}`)
}

test()
