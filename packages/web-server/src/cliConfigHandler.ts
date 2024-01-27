import type { ParsedOptions } from './types'
import { serveWeb } from './webServer'

export async function handler(options: ParsedOptions) {
  try {
    await serveWeb(options)
  } catch (error) {
    process.exitCode ||= 1
    console.error(`Error: ${(error as Error).message}`)
  }
}
