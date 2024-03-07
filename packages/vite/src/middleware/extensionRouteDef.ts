export const createExtensionRouteDef = (matchRegexString: string): RegExp => {
  if (matchRegexString.endsWith('/$')) {
    // url is something like /
    return new RegExp(matchRegexString.replace('$', 'index.*$'))
  } else {
    // url is something like /about
    return new RegExp(matchRegexString.replace('$', '.*$'))
  }
}
