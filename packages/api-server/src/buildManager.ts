import chalk from 'chalk'
import { debounce } from 'lodash'

import {
  buildApi,
  cleanApiBuild,
  rebuildApi,
} from '@redwoodjs/internal/dist/build/api'

export type BuildAndRestartOptions = {
  rebuild?: boolean
  clean?: boolean
}

// We want to delay execution when multiple files are modified on the filesystem,
// this usually happens when running RedwoodJS generator commands.
// Local writes are very fast, but writes in e2e environments are not,
// so allow the default to be adjusted with an env-var.
//
class BuildManager {
  private shouldRebuild: boolean
  private shouldClean: boolean
  private debouncedBuild: ReturnType<typeof debounce>
  private buildFn: (options: BuildAndRestartOptions) => Promise<void>

  constructor(buildFn: (options: BuildAndRestartOptions) => Promise<void>) {
    this.shouldRebuild = true
    this.shouldClean = false
    this.buildFn = buildFn
    this.debouncedBuild = debounce(
      async (options: BuildAndRestartOptions) => {
        // Use flags with higher precedence to determine if we should rebuild or clean
        await this.buildFn({
          ...options,
          rebuild: this.shouldRebuild,
          clean: this.shouldClean,
        })
        this.shouldRebuild = true
        this.shouldClean = false
      },
      process.env.RWJS_DELAY_RESTART
        ? parseInt(process.env.RWJS_DELAY_RESTART, 10)
        : 500,
    )
  }

  // Wrapper method to handle options and set precedence flags.
  // If we ever see a `rebuild: false` option while debouncing, we never want to rebuild.
  // If we ever see a `clean: true` option, we always want to clean.
  async build(options: BuildAndRestartOptions) {
    if (options.rebuild === false) {
      this.shouldRebuild = false
    }
    if (options.clean) {
      this.shouldClean = true
    }

    await this.debouncedBuild(options)
  }

  cancelRunningBuilds() {
    this.debouncedBuild.cancel()
  }
}

export async function build(options: BuildAndRestartOptions) {
  const buildTs = Date.now()
  console.log(chalk.dim.italic('Building...'))

  if (options.clean) {
    await cleanApiBuild()
  }

  if (options.rebuild) {
    await rebuildApi()
  } else {
    await buildApi()
  }

  console.log(chalk.dim.italic('Took ' + (Date.now() - buildTs) + ' ms'))
}

const buildManager = new BuildManager(build)
export { BuildManager, buildManager }
