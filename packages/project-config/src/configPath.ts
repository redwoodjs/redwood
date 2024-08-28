import { findUp } from './findUp.js'

const CONFIG_FILE_NAME = 'redwood.toml'

/**
 * Search the parent directories for the Redwood configuration file.
 */
const getConfigPathCache = new Map<string, string>()
export const getConfigPath = (
  cwd: string = process.env.RWJS_CWD ?? process.cwd(),
): string => {
  if (getConfigPathCache.has(cwd)) {
    return getConfigPathCache.get(cwd) as string
  }
  const configPath = findUp(CONFIG_FILE_NAME, cwd)
  if (!configPath) {
    throw new Error(
      `Could not find a "${CONFIG_FILE_NAME}" file, are you sure you're in a Redwood project?`,
    )
  }
  getConfigPathCache.set(cwd, configPath)
  return configPath
}
