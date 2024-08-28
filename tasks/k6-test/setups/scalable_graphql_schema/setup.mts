#!/usr/bin/env node
/* eslint-env node, es6*/

import path from 'node:path'
import url from 'node:url'

import fs from 'fs-extra'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const validForTests = ['scalable_graphql_schema']

export const startupGracePeriod = 8000

export function setup({ projectPath }: { projectPath: string }) {
  const modelCount = 1024
  const dataCount = 64
  // TODO: Have generic field count
  // TODO: Have generic relation count

  const definitionTemplate = fs.readFileSync(
    path.join(__dirname, 'templates', 'definition.sdl.ts'),
    {
      encoding: 'utf-8',
    },
  )

  const implementationTemplate = fs.readFileSync(
    path.join(__dirname, 'templates', 'implementation.ts'),
    {
      encoding: 'utf-8',
    },
  )

  // Copy over SDL for a relation
  fs.copyFileSync(
    path.join(__dirname, 'templates', 'relation.sdl.ts'),
    path.join(projectPath, 'api', 'src', 'graphql', 'relation.sdl.ts'),
  )

  for (let i = 0; i < modelCount; i++) {
    // Generate fake model
    const typeName = `T${i}`
    const queryName = `t${i}`

    // Generate fake data
    const data: any[] = []
    for (let j = 0; j < dataCount; j++) {
      data.push({
        id: j,
        name: `name${j}`,
        email: `email${j}`,
        phone: `phone${j}`,
        address: `address${j}`,
        verified: j % 2 === 0,
        tags: [`tagA`, `tagB`, `tagC`],

        typeName: typeName,
      })
    }

    const specificDefinition = definitionTemplate
      .replace(/__TYPE_NAME__/g, typeName)
      .replace(/__QUERY_NAME__/g, queryName)
    fs.writeFileSync(
      path.join(projectPath, 'api', 'src', 'graphql', `${typeName}.sdl.ts`),
      specificDefinition,
    )

    const specificImplementation = implementationTemplate
      .replace(/__TYPE_NAME__/g, typeName)
      .replace(/__QUERY_NAME__/g, queryName)
      .replace(/__DATA__/g, JSON.stringify(data))
    fs.mkdirSync(
      path.join(projectPath, 'api', 'src', 'services', `${typeName}`),
    )
    fs.writeFileSync(
      path.join(
        projectPath,
        'api',
        'src',
        'services',
        `${typeName}`,
        `${typeName}.ts`,
      ),
      specificImplementation,
    )
  }
}
