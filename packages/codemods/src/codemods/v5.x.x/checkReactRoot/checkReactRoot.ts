import fs from 'fs'
import path from 'path'

import { load } from 'cheerio'
import execa from 'execa'

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

export function updateReactDeps() {
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

  execa.commandSync('yarn install', {
    cwd: redwoodProjectPaths.base,
    stdio: 'inherit',
  })
}
