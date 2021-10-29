import fg from 'fast-glob'

import getRWPaths from './getRWPaths'

const isTSProject =
  fg.sync(`${getRWPaths().base}/**/tsconfig.json`, {
    ignore: ['**/node_modules/**'],
  }).length > 0

export default isTSProject
