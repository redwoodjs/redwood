/**
 * A simple wrapper around the jscodeshift CLI.
 *
 * @see {@link https://github.com/facebook/jscodeshift#usage-cli}
 * @see {@link https://github.com/prisma/codemods/blob/main/utils/runner.ts}
 */
import execa from 'execa'

export interface RunTransform {
  transformPath: string
  targetPaths: string[]
}

export const runTransform = ({
  transformPath,
  targetPaths,
  ...rest
}: RunTransform) => {
  /**
   * Transforms `{ key: val }` to `'--key=val'`
   */
  const options = Object.entries(rest)
    .map((key, val) => `--${key}=${val}`)
    .join(' ')

  execa.sync(
    `yarn jscodeshift -t ${transformPath} ${targetPaths.join(',')} ${options}`
  )
}

export default runTransform
