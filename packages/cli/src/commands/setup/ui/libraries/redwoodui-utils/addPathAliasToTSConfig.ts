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
  pathAliasToAdd: PathAlias,
  tsConfig: string,
) => {
  // add path alias to tsconfig.json
  const tsConfigJson = JSON.parse(tsConfig)
  console.log('tsConfigJson', tsConfigJson)
  const { paths } = tsConfigJson.compilerOptions || {}
  console.log('paths', paths)
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
  console.log('newContent', newContent)
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
  const tsConfigJson = JSON.parse(tsConfig)
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
