import fs from 'fs'
import path from 'path'

export function rewriteWebToUsePort(webPath: string, studioPort: number) {
  const indexHtmlPath = path.join(webPath, 'index.html')
  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
  indexHtml = indexHtml.replace(
    'RWJS_STUDIO_BASE_PORT=4318',
    'RWJS_STUDIO_BASE_PORT=' + studioPort
  )
  fs.writeFileSync(indexHtmlPath, indexHtml)
}
