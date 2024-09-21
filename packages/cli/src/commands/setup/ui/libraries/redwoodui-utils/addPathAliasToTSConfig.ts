import type { ListrTaskWrapper } from 'listr2'

import c from '../../../../../lib/colors'

interface PathAlias {
  [key: string]: string[]
}

/**
 * Adds a path alias to the tsconfig.json file.
 *
 * Before this function is called, you should have already checked whether we need to add this alias
 * or if it already exists
 */
const addPathAliasToTSConfig = (
  task: ListrTaskWrapper<any, any>,
  pathAliasToAdd: PathAlias,
  tsConfig: string,
) => {
  let tsConfigJson: any
  try {
    tsConfigJson = JSON.parse(tsConfig)
  } catch (e: any) {
    throw new Error(
      `Error parsing your web/tsconfig.json file (do you have a trailing comma somewhere, perhaps?): ${e.message}`,
    )
  }

  const { paths, baseUrl } = tsConfigJson.compilerOptions || {}

  // we also need to check baseUrl, because if it's not set, you can't use non-relative paths
  // https://www.typescriptlang.org/tsconfig#baseUrl
  if (!baseUrl) {
    tsConfigJson.compilerOptions.baseUrl = './'
    task.output = c.success(
      'For some path alises to work, you need to have baseUrl set to "./". We\'ve set it for you.',
    )
  } else {
    // if baseUrl is set, we need to print out a warning if it's not set to './'
    if (baseUrl !== './') {
      task.output = c.warning(
        `The baseUrl in your tsconfig.json file is not set to "./", and is instead set to "${baseUrl}". This may cause issues with the RedwoodUI path aliase. Please set it to "./" to avoid any issues.`,
      )
    }
    // otherwise, it's already set to the correct thing
    task.output = c.info('baseUrl already set to "./".')
  }

  if (!paths) {
    tsConfigJson.compilerOptions.paths = pathAliasToAdd
  } else {
    Object.keys(pathAliasToAdd).forEach((alias) => {
      if (paths[alias]) {
        paths[alias].push(...pathAliasToAdd[alias])
      } else {
        paths[alias] = pathAliasToAdd[alias]
      }
    })
  }

  const newContent = JSON.stringify(tsConfigJson, null, 2)
  return newContent
}

/**
 * Checks if the given path alias already exists in the tsconfig.json file.
 *
 * @param pathAliasToCheck - The path alias to check.
 * @param tsConfig - The tsconfig.json file content as a string.
 * @returns True if the path alias already exists, false otherwise.
 */
export const hasPathAliasInTSConfig = (
  pathAliasToCheck: PathAlias,
  tsConfig: string,
): boolean => {
  let tsConfigJson: any
  try {
    tsConfigJson = JSON.parse(tsConfig)
  } catch {
    return false // let the main function handle the error
  }
  const { paths } = tsConfigJson.compilerOptions || {}
  if (!paths) {
    return false
  }
  return Object.keys(pathAliasToCheck).every((alias) =>
    paths[alias]?.every((path: string) =>
      pathAliasToCheck[alias].includes(path),
    ),
  )
}

export default addPathAliasToTSConfig
