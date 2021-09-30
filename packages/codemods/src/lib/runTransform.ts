/**
 * A simple wrapper around the jscodeshift CLI.
 *
 * @see jscodeshift CLI's usage {@link https://github.com/facebook/jscodeshift#usage-cli}
 * @see prisma/codemods {@link https://github.com/prisma/codemods/blob/main/utils/runner.ts}
 * @see react-codemod {@link https://github.com/reactjs/react-codemod/blob/master/bin/cli.js}
 */
import path from 'path'

import execa from 'execa'

const getExecaArgs = () => {
  if (process.platform === 'win32') {
    return {
      command: 'yarn jscodeshift',
      cmdArgs: [],
    }
  } else {
    /**
     * We can't run jscodeshift with yarn (like `yarn jscodeshift -t ...`) on macos/linux
     *
     * @see {@link https://github.com/facebook/jscodeshift/issues/424}
     *
     * But on Windows, yarn jscodeshift does
     */
    const jscodeshiftExecutable = path.resolve(
      __dirname,
      '../../node_modules/.bin/jscodeshift'
    )

    return {
      command: 'node',
      cmdArgs: [jscodeshiftExecutable],
    }
  }
}

export interface RunTransform {
  /**
   * Path to the transform.
   */
  transformPath: string
  /**
   * Path(s) to the file(s) to transform. Can also be a directory.
   */
  targetPaths: string[]
  parser?: 'babel' | 'ts' | 'tsx'
  /**
   * jscodeshift options and transform options.
   */
  options?: Record<string, any>
}

export const runTransform = ({
  transformPath,
  targetPaths,
  parser = 'tsx',
  options = {},
}: RunTransform) => {
  /**
   * Transforms `{ key: val }` to `'--key=val'`
   */
  const flags = Object.entries(options).map((key, val) => `--${key}=${val}`)

  const { command, cmdArgs } = getExecaArgs()

  try {
    execa.sync(
      command,
      [
        ...cmdArgs,
        `--parser=${parser}`,
        process.env.NODE_ENV === 'test' ? '--babel' : '--no-babel',
        '--ignore-pattern=**/node_modules/**',
        // Putting flags here lets them override all the defaults.
        ...flags,
        '-t',
        transformPath,
        ...targetPaths,
      ],
      {
        stdio: 'inherit',
      }
    )
  } catch (e: any) {
    console.error('Transform Error', e.message)

    throw new Error('Failed to invoke transform')
  }
}

export default runTransform
