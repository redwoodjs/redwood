import fs from 'fs'
import path from 'path'

import tmp from 'tmp'
import { getPaths } from '@redwoodjs/internal'

const SCHEMA_FILENAME = 'schema.prisma'
const REAL_SCHEMA_PATH = path.join(getPaths().api.db, SCHEMA_FILENAME)
const PROTOCOL_TO_PROVIDER_MAP = {
  file: 'sqlite',
  postgres: 'postgresql',
  mysql: 'mysql',
}

// gets the name of the ENV var out of the schema, if present. ie: DB_HOST
const getEnvVar = (schema) => {
  const matches = schema.match(/url *= *env\(['"](.*?)['"]\)/)

  return matches && matches[1]
}

// gets the actual string that's set in the environment. ie: file:///dev.db
const getHost = (schema) => {
  const envVarMatch = getEnvVar(schema)

  return envVarMatch && process.env[envVarMatch]
}

// gets the provider name that prisma wants based on the db connection string. ie: sqlite
const getProvider = (host) => {
  const protocol = host.split(':')[0]

  return protocol ? PROTOCOL_TO_PROVIDER_MAP[protocol] : null
}

// reads api/prisma/schema.prisma and dynamically sets the provider based on what you have set in
// your ENV, then writes out the schema to a tmp file, returning the path to said file
export const generateTempSchema = () => {
  const tempSchemaPath = tmp.tmpNameSync({
    prefix: 'schema',
    postfix: '.prisma',
  })
  let schema = fs.readFileSync(REAL_SCHEMA_PATH).toString()
  const host = getHost(schema)

  if (host) {
    const provider = getProvider(host)

    if (provider) {
      schema = schema.replace('redwood', provider)
      console.info(`Using ${provider} provider as set in DB_HOST`)
    } else {
      throw `Error: Unable to determine provider from host "${host}". Make sure your db host protocol (the part before ://) is one of: [file, postgres, mysql]\n`
    }
  }
  fs.writeFileSync(tempSchemaPath, schema)

  return tempSchemaPath
}
