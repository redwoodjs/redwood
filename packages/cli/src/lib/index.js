import fs from 'fs'
import path from 'path'

import tmp from 'tmp'
import lodash from 'lodash/string'
import camelcase from 'camelcase'
import pascalcase from 'pascalcase'
import pluralize from 'pluralize'
import { paramCase } from 'param-case'
import { getDMMF } from '@prisma/sdk'
import { getPaths as getRedwoodPaths } from '@redwoodjs/internal'
import execa from 'execa'
import Listr from 'listr'
import VerboseRenderer from 'listr-verbose-renderer'

import c from 'src/lib/colors'

const SCHEMA_FILENAME = 'schema.prisma'
const TMP_SCHEMA_PATH = tmp.tmpNameSync({
  prefix: 'schema',
  postfix: '.prisma',
})
const REAL_SCHEMA_PATH = path.join(getRedwoodPaths().api.db, SCHEMA_FILENAME)
const PROVIDER_MAP = {
  file: 'sqlite',
  postgres: 'postgresql',
  mysql: 'mysql',
}

export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

/**
 * Returns the database schema for the given `name` database table parsed from
 * the schema.prisma of the target applicaiton. If no `name` is given then the
 * entire schema is returned.
 */
export const getSchema = async (name) => {
  const schemaPath = path.join(getPaths().api.db, 'schema.prisma')
  const metadata = await getDMMF({
    datamodel: readFile(schemaPath.toString()),
  })

  if (name) {
    const model = metadata.datamodel.models.find((model) => {
      return model.name === name
    })

    if (model) {
      return model
    } else {
      throw `No schema definition found for \`${name}\``
    }
  }

  return metadata.datamodel
}

/**
 * Returns variants of the passed `name` for usage in templates. If the given
 * name was "fooBar" then these would be:

 * pascalName: FooBar
 * singularPascalName: FooBar
 * pluralPascalName: FooBars
 * singularCamelName: fooBar
 * pluralCamelName: fooBars
 * singularParamName: foo-bar
 * pluralParamName: foo-bars
*/
const nameVariants = (name) => {
  const normalizedName = pascalcase(pluralize.singular(name))

  return {
    pascalName: pascalcase(name),
    camelName: camelcase(name),
    singularPascalName: normalizedName,
    pluralPascalName: pluralize(normalizedName),
    singularCamelName: camelcase(normalizedName),
    pluralCamelName: camelcase(pluralize(normalizedName)),
    singularParamName: paramCase(normalizedName),
    pluralParamName: paramCase(pluralize(normalizedName)),
  }
}

export const templateRoot = path.resolve(
  __dirname,
  '../commands/Generate/templates'
)

export const generateTemplate = (templateFilename, { name, ...rest }) => {
  const templatePath = path.join(templateRoot, templateFilename)
  const template = lodash.template(readFile(templatePath).toString())
  return template({
    name,
    ...nameVariants(name),
    ...rest,
  })
}

export const readFile = (target) => fs.readFileSync(target)

export const writeFile = async (
  target,
  contents,
  { overwriteExisting = false } = {}
) => {
  if (!overwriteExisting && fs.existsSync(target)) {
    throw new Error(`${target} already exists.`)
  }

  const filename = path.basename(target)
  const targetDir = target.replace(filename, '')
  fs.mkdirSync(targetDir, { recursive: true })
  fs.writeFileSync(target, contents)
}

export const bytes = (contents) => Buffer.byteLength(contents, 'utf8')

/**
 * This wraps the core version of getPaths into something that catches the exception
 * and displays a helpful error message.
 */
export const getPaths = () => {
  try {
    return getRedwoodPaths()
  } catch (e) {
    console.log(c.error(e.message))
    process.exit(0)
  }
}

/**
 * Creates a list of tasks that write files to the disk.
 *
 * @param files - {[filepath]: contents}
 */
export const writeFilesTask = (files, options) => {
  const { base } = getPaths()
  return new Listr(
    Object.keys(files).map((file) => {
      const contents = files[file]
      return {
        title: `Writing \`./${path.relative(base, file)}\`...`,
        task: () => writeFile(file, contents, options),
      }
    })
  )
}

/**
 * Update the project's routes file.
 */
export const addRoutesToRouterTask = (routes) => {
  const redwoodPaths = getPaths()
  const routesContent = readFile(redwoodPaths.web.routes).toString()
  const newRoutesContent = routes.reduce((content, route) => {
    return content.replace(/(\s*)\<Router\>/, `$1<Router>$1  ${route}`)
  }, routesContent)
  writeFile(redwoodPaths.web.routes, newRoutesContent, {
    overwriteExisting: true,
  })
}

export const runCommandTask = async (commands, { verbose }) => {
  const tasks = new Listr(
    commands.map(({ title, cmd, args, opts = {} }) => ({
      title,
      task: async () => {
        return execa(cmd, args, {
          shell: true,
          cwd: `${getPaths().base}/api`,
          stdio: verbose ? 'inherit' : 'pipe',
          extendEnv: true,
          cleanup: true,
          ...opts,
        })
      },
    })),
    {
      renderer: verbose && VerboseRenderer,
      dateFormat: false,
    }
  )

  try {
    await tasks.run()
  } catch (e) {
    console.log(c.error(e.message))
  }
}

// reads api/prisma/schema.prisma and dynamically sets the provider based on what you have set in
// your ENV, then writes out the schema to a tmp file and has prisma generate based off that
export const generateTempSchema = () => {
  let schema = fs.readFileSync(REAL_SCHEMA_PATH).toString()
  const matches = schema.match(/url *= *env\(['"](.*?)['"]\)/)

  // is `url` set to an env() var in the schema?
  if (matches) {
    const host = process.env[matches[1]]
    // is the named ENV var present?
    if (host) {
      const provider = PROVIDER_MAP[host.split(':')[0]]
      // is the provider found in the env var one we recognize?
      if (provider) {
        schema = schema.replace('redwood', provider)
        console.info(`Using ${provider} provider as set in DB_HOST`)
      } else {
        throw `Unable to determine provider from host "${host}". Make sure your db host scheme (the part before ://) is one of: [file, postgres, mysql]`
      }
    } else {
      console.info(
        `Skipping DB provider: ENV var \`${matches[1]}\` not available in environment`
      )
    }
  }
  fs.writeFileSync(TMP_SCHEMA_PATH, schema)

  return TMP_SCHEMA_PATH
}
