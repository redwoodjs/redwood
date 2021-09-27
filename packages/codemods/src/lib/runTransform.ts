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

/**
 * We can't run jscodeshift with yarn (like `yarn jscodeshift -t ...`).
 *
 * @see {@link https://github.com/facebook/jscodeshift/issues/424}
 *
 * Prisma and React have a different way of getting around it,
 * but that didn't work for me.
 * @see {@link https://github.com/reactjs/react-codemod/blob/b34b92a1f0b8ad333efe5effb50d17d46d66588b/bin/cli.js#L20}
 *
 * This seems to work though.
 */
const jscodeshiftExecutable = path.resolve(
  __dirname,
  '../../node_modules/.bin/jscodeshift'
)

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

  execa.sync(
    'node',
    [
      jscodeshiftExecutable,
      '--parser',
      parser,
      '-t',
      transformPath,
      ...targetPaths,
      ...flags,
    ]
    // {
    //   stdio: 'inherit',
    // }
  )
}

export default runTransform
