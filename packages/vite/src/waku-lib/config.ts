// TODO (RSC) Take ownership of this file and move it out ouf the waku-lib folder
import type { ConfigEnv, UserConfig } from 'vite'
import { resolveConfig as viteResolveConfig } from 'vite'

export interface FrameworkConfig {
  indexHtml?: string // relative to root
  entriesJs?: string // relative to root
  outPublic?: string // relative to build.outDir
  rscPrefix?: string // defaults to "RSC/"
}

export interface ExtendedUserConfig extends UserConfig {
  framework?: FrameworkConfig
}

export function defineConfig(
  config:
    | ExtendedUserConfig
    | Promise<ExtendedUserConfig>
    | ((env: ConfigEnv) => ExtendedUserConfig)
    | ((env: ConfigEnv) => Promise<ExtendedUserConfig>)
) {
  return config
}

export const configFileConfig = process.env.CONFIG_FILE
  ? { configFile: process.env.CONFIG_FILE }
  : {}

export async function resolveConfig(command: 'build' | 'serve') {
  const origConfig = await viteResolveConfig(configFileConfig, command)
  const framework: Required<FrameworkConfig> = {
    indexHtml: 'index.html',
    entriesJs: 'entries.js',
    outPublic: 'public',
    rscPrefix: 'RSC/',
    ...(origConfig as { framework?: FrameworkConfig }).framework,
  }
  const config = { ...origConfig, framework }
  return config
}
