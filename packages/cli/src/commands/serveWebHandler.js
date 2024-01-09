import execa from 'execa'

import { getPaths } from '@redwoodjs/project-config'

import { exitWithError } from '../lib/exit'

export const webSsrServerHandler = async () => {
  await execa('yarn', ['rw-serve-fe'], {
    cwd: getPaths().web.base,
    stdio: 'inherit',
    shell: true,
  })
}

export const webServerHandler = async (argv) => {
  try {
    await execa(
      'yarn',
      [
        'rw-web-server',
        '--port',
        argv.port,
        '--socket',
        argv.socket,
        '--api-host',
        argv.apiHost,
      ],
      {
        cwd: getPaths().base,
        stdio: 'inherit',
        shell: true,
      }
    )
  } catch (e) {
    // `@redwoodjs/web-server` uses a custom error exit code to tell this handler that an error has already been handled.
    // While any other exit code than `0` is considered an error, there seems to be some conventions around some of them
    // like `127`, etc. We chose 64 because it's in the range where there deliberately aren't any previous conventions.
    // See https://tldp.org/LDP/abs/html/exitcodes.html.
    if (e.exitCode === 64) {
      process.exitCode = 1
      return
    }

    exitWithError(e)
  }
}
