import execa, { type ExecaReturnValue } from 'execa'

import { getPaths, colors } from '../../../../lib'

export interface ISpawnConfig extends execa.Options {
  debug?: boolean
  rawOutput?: boolean
}

export type BuiltSpawner = (
  cmd: string,
  opts?: ISpawnConfig
) => Promise<string | ExecaReturnValue>

const DEFAULT_EXECA_OPTS: execa.Options = {
  cwd: getPaths().base,
  cleanup: true,
  stripFinalNewline: true,
}

export function buildSpawner(
  cwd: string,
  debug: boolean | undefined
): (
  command: string,
  opts?: ISpawnConfig
) => Promise<string | ExecaReturnValue> {
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
  // remove non execa options (rawOutput, debug)
  const { rawOutput, debug, ...rest } = opts || {}
  const logger = createLogger(debug)
  const popts = { ...DEFAULT_EXECA_OPTS, ...rest }
  logger.debug(`spawning: ${command} with opts: ${JSON.stringify(popts)}`)
  try {
    const [bin, ...args] = command.split(' ')
    const out = await execa(bin, args, popts)
    logger.debug(JSON.stringify(out, null, 2))
    return rawOutput ? out : out.stdout
  } catch (err) {
    logger.debug(JSON.stringify(err, null, 2))
    throw err
  }
}

interface ILogger {
  log: (...args: any) => void
  info: (msg: string) => void
  debug: (msg: string) => void
  error: (msg: string) => void
}

export function createLogger(debug = false): ILogger {
  return {
    log: (...args: any) => console.log(...args),
    info: (msg: string) => console.info(`🔍 ${colors.green(msg)}`),
    debug: (msg: string) => debug && console.debug(`🦄 ${colors.grey(msg)}`),
    error: (msg: string) => console.error(`❌ ${colors.error(msg)}`),
  }
}

export function writeStdout(output: string): void {
  process.stdout.write(output)
  return
}

export function clearStdout(output: string): void {
  writeStdout(`\x1Bc${output}`)
  return
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
