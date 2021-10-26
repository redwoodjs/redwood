import fg from 'fast-glob'

const isTSProject =
  fg.sync('api/tsconfig.json').length > 0 ||
  fg.sync('web/tsconfig.json').length > 0

export default isTSProject
