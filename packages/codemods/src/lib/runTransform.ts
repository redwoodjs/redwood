/**
 * A simple wrapper around the jscodeshift CLI.
 *
 * @see {@link https://github.com/facebook/jscodeshift#usage-cli}
 * @see {@link https://github.com/prisma/codemods/blob/main/utils/runner.ts}
 */
import path from 'path'

import execa from 'execa'

export interface RunTransform {
  transformPath: string
  targetPaths: string[]
  options?: Record<string, any>
}

const jscodeshiftExecutable = path.resolve(
  __dirname,
  '../../node_modules/.bin/jscodeshift'
)

export const runTransform = ({
  transformPath,
  targetPaths,
  options = {},
}: // ...rest
RunTransform) => {
  /**
   * Transforms `{ key: val }` to `'--key=val'`
   *
   * @todo
   * If it's empty, it's interpreted as a path.
   * Not a huge deal but it'll output "  not found", as if it couldn't find a file named " ".
   */
  const optionsString = Object.entries(options)
    .map((key, val) => `--${key}=${val}`)
    .join(' ')

  execa.sync(
    'node',
    [
      jscodeshiftExecutable,
      '-v 2',
      '-t',
      transformPath,
      targetPaths.join(' '),
      optionsString,
    ],
    {
      stdio: 'inherit',
    }
  )
}

export default runTransform
