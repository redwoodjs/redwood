import chalk from 'chalk'

/**
 * To keep a consistent color/style palette between cli packages, such as
 * @redwood/cli and @redwood/create-redwood-app, please keep them compatible
 * with one and another. We'll might split up and refactor these into a
 * separate package when there is a strong motivation behind it.
 *
 * Current files:
 *
 * - packages/cli/src/lib/colors.js (this file)
 * - packages/create-redwood-app/src/create-redwood-app.js
 */
export default {
  error: chalk.bold.red,
  warning: chalk.keyword('orange'),
  success: chalk.greenBright,
  info: chalk.grey,

  bold: chalk.bold,
  underline: chalk.underline,

  green: chalk.green,

  header: chalk.bold.underline.hex('#e8e8e8'),
  cmd: chalk.hex('#808080'),
  redwood: chalk.hex('#ff845e'),
  love: chalk.redBright,
}
