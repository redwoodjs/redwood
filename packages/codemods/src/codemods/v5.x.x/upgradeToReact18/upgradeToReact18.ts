import fs from 'fs'
import path from 'path'

import { load } from 'cheerio'
import execa from 'execa'
import type { TaskInnerAPI } from 'tasuku'

import getRWPaths from '../../../lib/getRWPaths'

function checkAndTransformReactRoot(taskContext: TaskInnerAPI) {
  const indexHTMLFilepath = path.join(getRWPaths().web.src, 'index.html')

  const indexHTML = load(fs.readFileSync(indexHTMLFilepath, 'utf-8'))

  const reactRoot = indexHTML('#redwood-app')
  const reactRootChildren = reactRoot.children()

  if (reactRootChildren.length) {
    let reactRootHTML = reactRoot.html()

    if (!reactRootHTML) {
      throw new Error(
        `Couldn't get HTML in react root (div with id="redwood-app")`
      )
    }

    reactRootHTML = reactRootHTML
      .replace('<!-- Please keep the line below for prerender support. -->', '')
      .replace('&lt;%= prerenderPlaceholder %&gt;', '')
      .split('\n')
      .filter((line) => line.match(/\S/))
      .join('\n')

    taskContext.setWarning(
      [
        `The react root (<div id="redwood-app"></div>) in ${indexHTMLFilepath} has children:`,
        '',
        reactRootHTML,
        '',
        'React expects to control this DOM node completely. This codemod has moved the children outside the react root,',
        'but consider moving them into a layout.',
      ].join('\n')
    )
  }

  indexHTML('body').append(reactRootChildren)
  reactRoot.text('')

  fs.writeFileSync(indexHTMLFilepath, indexHTML.html())
}

async function upgradeReactDepsTo18() {
  const redwoodProjectPaths = getRWPaths()

  const webPackageJSONPath = path.join(
    redwoodProjectPaths.web.base,
    'package.json'
  )

  const webPackageJSON = JSON.parse(
    fs.readFileSync(webPackageJSONPath, 'utf-8')
  )

  const latestReactVersion = '18.2.0'

  for (const requiredReactDep of ['react', 'react-dom']) {
    if (!Object.hasOwn(webPackageJSON.dependencies, requiredReactDep)) {
      throw new Error(
        `Couldn't find ${requiredReactDep} in web/package.json dependencies`
      )
    }

    webPackageJSON.dependencies[requiredReactDep] = latestReactVersion
  }

  fs.writeFileSync(webPackageJSONPath, JSON.stringify(webPackageJSON, null, 2))

  await execa.command('yarn install', {
    cwd: redwoodProjectPaths.base,
  })
}

export { checkAndTransformReactRoot, upgradeReactDepsTo18 }
