import chalk from 'chalk'
import execa from 'execa'

import { getPaths } from '../../../../lib'

const DEFAULT_EXECA_OPTS = {
  cwd: getPaths().base,
  cleanup: true,
  stripFinalNewline: true,
}

export async function spawn(command: string, opts = {}): Promise<string> {
  try {
    const [bin, ...args] = command.split(' ')
    const out = await execa(bin, args, { ...DEFAULT_EXECA_OPTS, ...opts })
    console.debug('SUCCESS: ' + command)
    console.debug(JSON.stringify(out, null, 2))
    return out.stdout
  } catch (err) {
    console.debug('ERROR: ' + command)
    console.debug(JSON.stringify(err, null, 2))
    throw err
  }
}

export async function spawnFollow(command: string): Promise<void> {
  const [bin, ...args] = command.split(' ')
  const child = execa(bin, args, {
    ...DEFAULT_EXECA_OPTS,
  })
  child.stdout?.pipe(process.stdout)
  child.stderr?.pipe(process.stderr)
  await child
  return
}

export const underline = (msg: string) => chalk.underline(msg)
export const blue = (msg: string) => chalk.blueBright(msg)
export const green = (msg: string) => chalk.greenBright(msg)
export const grey = (msg: string) => chalk.grey(msg)
export const red = (msg: string) => chalk.redBright(msg)
export const yellow = (msg: string) => chalk.yellowBright(msg)

export function createLogger(debug = false) {
  return {
    log: (...args: any) => console.log(args),
    info: (msg: string) => console.log(`🔍 ${green(msg)}`),
    debug: (msg: string) => debug && console.debug(`🦄 ${grey(msg)}`),
    error: (msg: string) => console.error(`❌ ${red(msg)}`),
  }
}
