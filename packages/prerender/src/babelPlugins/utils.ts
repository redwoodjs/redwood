import fs from 'fs'

import mime from 'mime-types'

// These functions are in a seprate file so that they can be mocked with jest

// Its possible for sourceRoot to be undefined in the tests..
// Not sure if possible in actually running builds
export function convertToDataUrl(assetPath: string) {
  try {
    const base64AssetContents = fs.readFileSync(assetPath as string, 'base64')
    const mimeType = mime.lookup(assetPath as string)
    return `data:${mimeType};base64,${base64AssetContents}`
  } catch (e) {
    console.warn(`Could not read file ${assetPath} for conversion to data uri`)
    return ''
  }
}
