import fs from 'fs'
import path from 'path'

import { load } from 'cheerio'
import task, { TaskInnerAPI } from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'

export const command = 'check-react-root'
export const description = '(v5.x.x->v5.x.x) Converts world to bazinga'

export const handler = () => {
  task('Check React Root', async ({ setOutput }: TaskInnerAPI) => {
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
          'React expects to control this DOM node completely. Either move the children 1) outside the react root or 2) into your App component',
          '',
        ].join('\n')
      )
    }

    reactRoot.text('')

    fs.writeFileSync(indexHTMLFilepath, indexHTML.html())

    setOutput('All done! Run `yarn rw lint --fix` to prettify your code')
  })
}
