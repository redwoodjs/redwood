import path from 'node:path'

import chokidar from 'chokidar'

import { FRAMEWORK_PATH, getOptions, IGNORED } from './lib.mjs'
import { tarsync } from './tarsync.mjs'

async function main() {
  const { projectPath, watch, verbose } = await getOptions()

  await tarsync(
    {
      projectPath,
      verbose,
    },
    'CLI invocation',
  )

  if (!watch) {
    return
  }

  let triggered = ''
  let running = false

  const watcher = chokidar.watch(path.join(FRAMEWORK_PATH, 'packages'), {
    ignored: IGNORED,
    // We don't want chokidar to emit events as it discovers paths, only as they change.
    ignoreInitial: true,
    // Debounce the events.
    awaitWriteFinish: true,
  })
  watcher.on('all', async (_event, filePath) => {
    if (!running) {
      triggered = filePath
      return
    }

    // If we're already running we don't trigger on certain files which are likely to be
    // touched by the build process itself.

    // `package.json` files are touched when we switch between esm and cjs builds.
    if (filePath.endsWith('package.json')) {
      return
    }

    triggered = filePath
  })

  const monitor = setInterval(async () => {
    if (triggered && !running) {
      const thisTrigger = triggered
      triggered = ''
      running = true
      try {
        await tarsync(
          {
            projectPath,
            verbose,
          },
          `File change: ${path.relative(FRAMEWORK_PATH, thisTrigger)}`,
        )
      } finally {
        running = false
      }
    }
  }, 100)

  let cleanedUp = false
  async function cleanUp() {
    if (cleanedUp) {
      return
    }

    await watcher.close()
    clearInterval(monitor)
    cleanedUp = true
  }

  process.on('SIGINT', cleanUp)
  process.on('exit', cleanUp)
}

main()
