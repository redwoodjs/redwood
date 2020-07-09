import { RWProject } from '../model'
import { VSCodeWindowMethods } from '../x/vscode'
import { YargsStyleArgs } from '../x/yargs'
import { build } from './command_builder'
import { run } from './command_runner'
import { VSCodeWindowUI } from './ui'

export async function buildAndRunWithVSCodeUI(opts: {
  args: YargsStyleArgs
  project: RWProject
  vscodeWindowMethods: VSCodeWindowMethods
}) {
  const { args, project, vscodeWindowMethods } = opts
  const ui = new VSCodeWindowUI(opts.vscodeWindowMethods)
  const cmd = await build({ args, project, ui })
  if (!cmd) return
  await run({ cmd, project, vscodeWindowMethods })
}
