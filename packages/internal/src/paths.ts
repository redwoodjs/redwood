import path from 'path'

import {
  getConfig,
  getConfigPath,
  getConfigSides,
  getSideConfig,
} from './config'
import { TargetEnum } from './config'

export interface NodeTargetPaths {
  base: string
  db: string
  dbSchema: string
  src: string
  functions: string
  graphql: string
  lib: string
  services: string
}

export interface BrowserTargetPaths {
  base: string
  src: string
  routes: string
  pages: string
  components: string
  layouts: string
  config: string
}

export interface Paths {
  base: string
  sides: {
    [side: string]: NodeTargetPaths | BrowserTargetPaths
  }
}

const mapNodePaths = (sidePath: string): NodeTargetPaths => {
  return {
    base: sidePath,
    src: path.join(sidePath, 'src'),
    functions: path.join(sidePath, 'src/functions'),
    graphql: path.join(sidePath, 'src/graphql'),
    lib: path.join(sidePath, 'src/lib'),
    services: path.join(sidePath, 'src/services'),
    db: path.join(sidePath, 'prisma'),
    dbSchema: path.join(sidePath, 'prisma/schema.prisma'),
  }
}

const mapBrowserPaths = (sidePath: string): BrowserTargetPaths => {
  return {
    base: sidePath,
    src: path.join(sidePath, 'src'),
    routes: path.join(sidePath, 'src/Routes.js'),
    pages: path.join(sidePath, 'src/pages'),
    components: path.join(sidePath, 'src/components'),
    layouts: path.join(sidePath, 'src/layouts'),
    config: path.join(sidePath, 'src/config'),
  }
}

/**
 * Absolute paths for the directory structure of a Redwood project based
 * on the `redwood.toml` file.
 */
export const getPaths = (): Paths => {
  // The Redwood config file denotes the base directory of a Redwood project.
  const base = path.dirname(getConfigPath())

  const configSides = getConfigSides()
  // Redwood supports different targets for sides. They have different directory
  // structures, so we map the side based on the "target" parameter.
  const sides = Object.keys(configSides).reduce((acc, key) => {
    const side = configSides[key]
    let paths
    switch (side.target) {
      case TargetEnum.NODE:
        paths = mapNodePaths(path.join(base, side.path))
        break
      case TargetEnum.BROWSER:
        paths = mapBrowserPaths(path.join(base, side.path))
        break
      default:
        throw new Error(
          `Woah there! "${key}" has a target that is is not currently supported:\n${JSON.stringify(
            side,
            undefined,
            2
          )}`
        )
    }
    return {
      [key]: paths,
      ...acc,
    }
  }, {})

  return {
    base,
    sides,
  }
}

export const getSidePaths = (
  name: string
): NodeTargetPaths | BrowserTargetPaths => {
  const paths = getPaths()
  if (!paths.sides[name]) {
    throw new Error(
      `A side named "${name}" does not exist? Is it in your redwood.toml configuration?`
    )
  }
  return paths.sides[name]
}
