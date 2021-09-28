/**
 * A simple wrapper around the jscodeshift CLI.
 *
 * @see jscodeshift CLI's usage {@link https://github.com/facebook/jscodeshift#usage-cli}
 * @see prisma/codemods {@link https://github.com/prisma/codemods/blob/main/utils/runner.ts}
 * @see react-codemod {@link https://github.com/reactjs/react-codemod/blob/master/bin/cli.js}
 */
import path from 'path'

import execa from 'execa'

export interface RunTransform {
  transformPath: string
  targetPaths: string[]
  parser?: 'ts' | 'tsx' | 'js'
  options?: Record<string, any>
}

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

/**
 * Runs a transform on the given targetPath(s).
 *
 * @param transformPath Path to the transform.
 * @param targetPaths Path(s) to the file(s) to transform. Can also be a directory.
 * @param options jscodeshift options and transform options.
 */
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
        '--parser',
        parser,
        '-t',
        transformPath,
        ...targetPaths,
        ...flags,
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
