import { useLocation } from '@redwoodjs/router'

export type OgImageUrlOptions = {
  extension?: 'png' | 'jpg'
  width?: number
  height?: number
  quality?: number
}

export const OGIMAGE_DEFAULTS = {
  extension: 'png',
  width: 1200,
  height: 630,
  quality: 100,
}

export const useOgImage = (options?: OgImageUrlOptions) => {
  const { origin, pathname, searchParams } = useLocation()
  const ext = options?.extension || OGIMAGE_DEFAULTS.extension
  const width = options?.width
  const height = options?.height
  const quality = options?.quality
  const output = [origin, `.${ext}`]

  // special case if we're at the root, image is available at /index.ext
  if (pathname === '/') {
    output.splice(1, 0, '/index')
  }

  if (width) {
    searchParams.append('width', width.toString())
  }
  if (height) {
    searchParams.append('height', height.toString())
  }
  if (quality) {
    searchParams.append('quality', quality.toString())
  }

  // only append search params if there are any, so we don't up with a trailing `?`
  if (searchParams.size) {
    output.push(`?${searchParams}`)
  }

  return {
    url: output.join(''),
    width: width || OGIMAGE_DEFAULTS.width,
    height: height || OGIMAGE_DEFAULTS.height,
    quality: quality || OGIMAGE_DEFAULTS.quality,
    extension: ext,
    ogProps: {
      image: [
        output.join(''),
        {
          width: width || OGIMAGE_DEFAULTS.width,
          height: height || OGIMAGE_DEFAULTS.height,
        },
      ],
    },
  }
}
