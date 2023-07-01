export function stripQueryStringAndHashFromPath(url: string) {
  return url.split('?')[0].split('#')[0]
}
