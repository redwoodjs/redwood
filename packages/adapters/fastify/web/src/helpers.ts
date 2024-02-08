/** Ensures that `path` starts and ends with a slash ('/') */
export function coerceRootPath(path: string) {
  const prefix = path.charAt(0) !== '/' ? '/' : ''
  const suffix = path.charAt(path.length - 1) !== '/' ? '/' : ''

  return `${prefix}${path}${suffix}`
}
