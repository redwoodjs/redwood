import { $, cd } from 'zx'

import type { Options } from './lib.mjs'
import {
  buildTarballs,
  FRAMEWORK_PATH,
  moveTarballs,
  updateResolutions,
  yarnInstall,
} from './lib.mjs'
import { OutputManager, Stage } from './output.mjs'

export async function tarsync(
  { projectPath, verbose }: Omit<Options, 'watch'>,
  triggeredBy: string,
) {
  const isTTY = process.stdout.isTTY
  const verboseOutput = verbose || !isTTY
  $.verbose = verboseOutput

  const outputManager = new OutputManager({
    disabled: verboseOutput,
  })
  outputManager.start({
    triggeredBy,
  })

  cd(FRAMEWORK_PATH)

  outputManager.switchStage(Stage.BUILD_PACK)
  try {
    await buildTarballs()
  } catch (error) {
    outputManager.stop(error)
    return
  }

  outputManager.switchStage(Stage.MOVE)
  try {
    await moveTarballs(projectPath)
  } catch (error) {
    outputManager.stop(error)
    return
  }

  outputManager.switchStage(Stage.RESOLUTIONS)
  try {
    await updateResolutions(projectPath)
  } catch (error) {
    outputManager.stop(error)
    return
  }

  outputManager.switchStage(Stage.YARN)
  try {
    await yarnInstall(projectPath)
  } catch (error) {
    outputManager.stop(error)
    return
  }

  outputManager.switchStage(Stage.DONE)
  outputManager.stop()
}
