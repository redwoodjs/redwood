import fs from 'fs'
import path from 'path'

import { load } from 'cheerio'

import getRWPaths from '../../../lib/getRWPaths'

export function checkReactRoot() {
  const indexHTMLFilepath = path.join(
    getRWPaths().web.base,
    'src',
    'index.html'
  )

  const indexHTML = load(fs.readFileSync(indexHTMLFilepath, 'utf-8'))

  const reactRoot = indexHTML('#redwood-app')
  const reactRootChildren = reactRoot.children()

  if (reactRootChildren.length) {
    console.log(
      [
        `The react root (<div id="redwood-app"></div>) in ${indexHTMLFilepath} has children:`,
        reactRoot.html(),
        'React expects to control this DOM node completely. This codemod has moved the children outside the react root',
        'but consider moving them into a layout.',
        '',
      ].join('\n')
    )
  }

  indexHTML('body').append(reactRootChildren)
  reactRoot.text('')

  fs.writeFileSync(indexHTMLFilepath, indexHTML.html())
}
