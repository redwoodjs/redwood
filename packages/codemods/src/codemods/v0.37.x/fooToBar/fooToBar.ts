import type { FileInfo, API } from 'jscodeshift'
import type yargs from 'yargs'

import runTransform from '../../lib/runTransform'
import type { RunTransform } from '../../lib/runTransform'

module.exports = function (file: FileInfo, api: API) {
  const j = api.jscodeshift

  return j(file.source)
    .findVariableDeclarators('foo')
    .renameTo('bar')
    .toSource()
}

/**
 * For yargs.
 */
export const command = 'fooToBar'
export const description = ''
export const builder = (yargs: yargs.Argv) => {
  yargs.option('targetPath', {
    describe: 'Path to the file to run the transformation on',
    required: true,
    type: 'array',
  })
  yargs.option('renamedTo', {
    describe: 'Whatever you want to rename to',
    required: true,
    type: 'array',
  })
}

export const handler = ({
  targetPaths,
  ...rest
}: {
  targetPaths: Pick<RunTransform, 'targetPaths'>
}) => {
  // @TODO pass URL to this file on github as transformPath
  runTransform({ transformPath: __filename, targetPaths, variables: rest })
}
