import fs from 'fs'

import tmp from 'tmp'
import { getPaths } from '@redwoodjs/internal'

const PROTOCOL_TO_PROVIDER_MAP = {
  file: 'sqlite',
  postgres: 'postgresql',
  mysql: 'mysql',
}

// gets the name of the ENV var out of the schema, if present. ie: DB_HOST
const getEnvVarName = (schema) => {
  const matches = schema.match(/url *= *env\(['"](.*?)['"]\)/)

  return matches && matches[1]
}

// gets the actual string that's set in the environment. ie: file:///dev.db
const getConnectionString = (schema) => {
  const envVarName = getEnvVarName(schema)

  return envVarName && process.env[envVarName]
}

// gets the provider name that prisma wants based on the db connection string. ie: sqlite
const getProvider = (host) => {
  const protocol = host.split(':')[0]

  return protocol ? PROTOCOL_TO_PROVIDER_MAP[protocol] : null
}

const hasRedwoodProvider = (schema) => {
  return !!schema.match(/provider *= *['"]redwood['"]/)
}

// reads api/prisma/schema.prisma and dynamically sets the provider based on what you have set in
// your ENV, then writes out the schema to a tmp file, returning the path to said file
export const generateTempSchema = () => {
  let schema = fs.readFileSync(getPaths().api.dbSchema).toString()

  // no need to continue if the schema doesn't have the "redwood" provider,
  // just return the path to the default schema in the app
  if (!hasRedwoodProvider(schema)) {
    return getPaths().api.dbSchema
  }

  const host = getConnectionString(schema)

  if (host) {
    const provider = getProvider(host)

    if (provider) {
      const tempSchemaPath = tmp.tmpNameSync({
        prefix: 'schema',
        postfix: '.prisma',
      })

      fs.writeFileSync(
        tempSchemaPath,
        schema.replace(/(['"])redwood['"]/, `$1${provider}$1`)
      )
      console.info(`Using ${provider} provider as set in DB_HOST`)

      return tempSchemaPath
    } else {
      throw new Error(
        `Unable to determine provider from host "${host}".\nMake sure your db host protocol (the part before :) is one of: [file, postgres, mysql]`
      )
    }
  }
}
