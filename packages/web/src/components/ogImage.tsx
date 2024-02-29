import { useLocation } from '@redwoodjs/router'

export type OgImageUrlOptions = {
  extension?: 'png' | 'jpg' | 'jpeg' | 'gif'
  width?: number
  height?: number
}

const OGIMAGE_DEFAULTS = {
  extension: 'png',
  width: 1200,
  height: 630,
}

export const useOgImageUrl = (options?: OgImageUrlOptions) => {
  const { origin, pathname, searchParams } = useLocation()
  const ext = options?.extension || OGIMAGE_DEFAULTS.extension
  const output = [origin, `.${ext}`]

  // special case if we're at the root, image is available at /index.ext
  if (pathname === '/') {
    output.splice(1, 0, '/index')
  }

  if (options?.width && options.width !== OGIMAGE_DEFAULTS.width) {
    searchParams.append('width', options.width.toString())
  }
  if (options?.height && options.height !== OGIMAGE_DEFAULTS.height) {
    searchParams.append('height', options.height.toString())
  }

  // only append search params if there are any, so we don't up with a trailing `?`
  if (searchParams.size) {
    output.push(`?${searchParams}`)
  }

  return output.join('')
}
