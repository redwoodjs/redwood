import chalk from 'chalk'
import execa, { ExecaReturnValue } from 'execa'

import { getPaths } from '../../../../lib'

import type { ISpawnConfig } from './interfaces'

const DEFAULT_EXECA_OPTS: execa.Options = {
  cwd: getPaths().base,
  cleanup: true,
  stripFinalNewline: true,
}

export function buildSpawner(cwd: string, debug: boolean | undefined) {
  return async function (command: string, overrides = {}) {
    return await spawn(command, {
      debug,
      cwd,
      cleanup: true,
      stripFinalNewline: true,
      rawOutput: false,
      ...overrides,
    })
  }
}

export async function spawn(
  command: string,
  opts?: ISpawnConfig
): Promise<string | ExecaReturnValue> {
  // remove non execa options
  const { rawOutput, debug, ...rest } = opts || {}
  const logger = createLogger(debug)
  const popts = { ...DEFAULT_EXECA_OPTS, ...rest }
  logger.debug(grey(`spawning: ${command} with opts: ${JSON.stringify(popts)}`))
  try {
    const [bin, ...args] = command.split(' ')
    const out = await execa(bin, args, popts)
    logger.debug(grey(JSON.stringify(out, null, 2)))
    return rawOutput ? out : out.stdout
  } catch (err) {
    logger.debug(grey(JSON.stringify(err, null, 2)))
    throw err
  }
}

export const underline = (msg: string) => chalk.underline(msg)
export const blue = (msg: string) => chalk.blueBright(msg)
export const green = (msg: string) => chalk.greenBright(msg)
export const grey = (msg: string) => chalk.grey(msg)
export const red = (msg: string) => chalk.redBright(msg)
export const yellow = (msg: string) => chalk.yellowBright(msg)

export function createLogger(debug = false) {
  return {
    log: (...args: any) => console.log(...args),
    info: (msg: string) => console.log(`🔍 ${green(msg)}`),
    debug: (msg: string) => debug && console.debug(`🦄 ${grey(msg)}`),
    error: (msg: string) => console.error(`❌ ${red(msg)}`),
  }
}
