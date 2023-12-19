// This file will eventually be deduplicated across the framework
// when we take the time to make architectural changes.

import chalk from 'chalk'

export default {
  error: chalk.bold.red,
  warning: chalk.keyword('orange'),
  green: chalk.green,
  bold: chalk.bold,
}
