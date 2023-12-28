import { useLocation } from './location'
import { useLocationMatch } from './useMatch'

interface UsePathMatchOptions {
  paramValues?: Record<string, any>
}

/**
 * Will match the current location against the given path, making any
 * replacements as provided in the options.
 *
 * @param path The path as defined in your Routes file
 * @param options {UsePathMatchOptions}
 * @param options.paramValues An map of param names and their values
 */
export function usePathMatch(
  path: string,
  options?: UsePathMatchOptions
): boolean
/**
 * @param url The url to match against
 * @param path The path as defined in your Routes file
 * @param options {UsePathMatchOptions}
 * @param options.paramValues An map of param names and their values
 */
export function usePathMatch(
  url: string,
  path: string,
  options?: UsePathMatchOptions
): boolean
export function usePathMatch(
  urlOrPath: string,
  pathOrOptions?: string | UsePathMatchOptions,
  opts?: UsePathMatchOptions
): boolean {
  const location = useLocation()

  const url = typeof pathOrOptions !== 'string' ? location.pathname : urlOrPath
  const path = typeof pathOrOptions === 'string' ? pathOrOptions : urlOrPath
  const options = typeof pathOrOptions !== 'string' ? pathOrOptions : opts

  const match = useLocationMatch({ pathname: url }, path)

  if (!match.match) {
    return false
  }

  const paramValues = Object.entries(options?.paramValues || {})

  if (paramValues.length > 0) {
    if (!isMatchWithParams(match) || !match.params) {
      return false
    }

    // If paramValues were given, they must all match
    return paramValues.every(([key, value]) => {
      return match.params[key] === value
    })
  }

  return true
}

function isMatchWithParams(match: unknown): match is { params: any } {
  return match !== null && typeof match === 'object' && 'params' in match
}
