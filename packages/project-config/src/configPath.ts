import { lookItUpSync } from 'look-it-up'

const CONFIG_FILE_NAME = 'redwood.toml'

/**
 * Search the parent directories for the Redwood configuration file.
 */
export const getConfigPath = (
  cwd: string = process.env.RWJS_CWD ?? process.cwd()
): string => {
  const configPath = lookItUpSync(CONFIG_FILE_NAME, cwd)

  if (!configPath) {
    throw new Error(
      `Could not find a "${CONFIG_FILE_NAME}" file, are you sure you're in a Redwood project?`
    )
  }

  return configPath
}
