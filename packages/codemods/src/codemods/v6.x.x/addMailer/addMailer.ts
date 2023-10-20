import fs from 'fs'
import path from 'path'

import { fetch } from '@whatwg-node/fetch'
import fg from 'fast-glob'

import { getPaths } from '@redwoodjs/project-config'

export const addMailer = async () => {
  const rwPaths = getPaths()

  const isTSProject =
    fg.sync('api/tsconfig.json').length > 0 ||
    fg.sync('web/tsconfig.json').length > 0

  const templateURLPrefix = `https://raw.githubusercontent.com/redwoodjs/redwood/main/packages/create-redwood-app/template/${
    isTSProject ? 'ts' : 'js'
  }`

  // Project path to GitHub URL - null means it's a directory
  const templateFiles: Record<
    string,
    { filename: string; url: string } | null
  > = {
    [rwPaths.api.mail]: null,
    [path.join(rwPaths.api.mail, 'Example')]: null,
    [path.join(rwPaths.api.mail, 'Example')]: {
      filename: `Example.${isTSProject ? 'tsx' : 'jsx'}`,
      url: `${templateURLPrefix}/api/src/mail/Example/Example.${
        isTSProject ? 'tsx' : 'jsx'
      }`,
    },
    [rwPaths.api.lib]: null, // This will already exist but included for completeness
    [rwPaths.api.lib]: {
      filename: `mailer.${isTSProject ? 'ts' : 'js'}`,
      url: `${templateURLPrefix}/api/src/lib/mailer.${
        isTSProject ? 'ts' : 'js'
      }`,
    },
  }

  for (const [dir, content] of Object.entries(templateFiles)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    // We don't want to fetch for a directory
    if (content === null) {
      continue
    }

    const res = await fetch(content.url)
    const text = await res.text()
    fs.writeFileSync(path.join(dir, content.filename), text)
  }

  // Add the mailer dependencies
  const newDependencies = [
    '@redwoodjs/mailer-core',
    '@redwoodjs/mailer-handler-nodemailer',
    '@redwoodjs/mailer-renderer-react-email',
  ]
  const newDevDependencies = [
    '@redwoodjs/mailer-handler-in-memory',
    '@redwoodjs/mailer-handler-studio',
  ]

  const currentRedwoodVersion = JSON.parse(
    fs.readFileSync(path.join(rwPaths.base, 'package.json'), 'utf8')
  ).devDependencies['@redwoodjs/core']
  const apiPackageJSON = JSON.parse(
    fs.readFileSync(path.join(rwPaths.api.base, 'package.json'), 'utf8')
  )
  for (const dep of newDependencies) {
    if (!apiPackageJSON.dependencies[dep]) {
      apiPackageJSON.dependencies[dep] = currentRedwoodVersion
    }
  }
  for (const dep of newDevDependencies) {
    if (!apiPackageJSON.devDependencies[dep]) {
      apiPackageJSON.devDependencies[dep] = currentRedwoodVersion
    }
  }
}
