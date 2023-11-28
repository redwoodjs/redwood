// Exported for testing.
export const enableSourceMapsOption = '--enable-source-maps'

/**
 * Gets the NODE_OPTIONS environment variable from `process.env`, appending `--enable-source-maps` if it's not already there.
 * See https://nodejs.org/api/cli.html#node_optionsoptions.
 *
 * @returns {string}
 */
export function getNodeOptions() {
  const { NODE_OPTIONS } = process.env

  if (!NODE_OPTIONS) {
    return `NODE_OPTIONS=${enableSourceMapsOption}`
  }

  if (NODE_OPTIONS.includes(enableSourceMapsOption)) {
    return NODE_OPTIONS
  }

  return `${NODE_OPTIONS} ${enableSourceMapsOption}`
}
