import { cpus } from 'node:os'

import { $, glob, spinner, fs, path } from 'zx'

async function getConfigsForFiles(files: string[]) {
  const configs = new Map<string, any>()

  // Batch these in groups because running all of them in parallel is too many
  // processes to spawn at once
  const batchSize = cpus().length
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    process.stdout.write(
      `Progress: ${Math.min(i + batchSize, files.length)}/${files.length}`,
    )
    const promises = batch.map(async (file) => {
      const { stdout } = await $`yarn eslint --print-config ${file}`
      configs.set(file, JSON.parse(stdout))
    })
    await Promise.all(promises)
  }
  process.stdout.write('\n')

  return configs
}

async function main() {
  // We need to be running commands within a redwood project
  if (!process.env.RWJS_CWD) {
    throw new Error('RWJS_CWD is not set')
  }
  $.verbose = !!process.env.VERBOSE
  $.cwd = process.env.RWJS_CWD

  // Get all the files in the project
  const files = await glob('**/*.*', {
    ignore: ['node_modules', 'dist', 'yarn.lock'],
    cwd: $.cwd,
  })

  // We support a `--sample` flag to only run on a sample of the files
  if (process.argv.includes('--sample')) {
    const sampleSize = cpus().length
    console.log(`Running on a sample of ${sampleSize} files`)
    files.sort(() => Math.random() - 0.5).splice(sampleSize)
  }

  // Get the configs for the files
  console.log('Analyzing existing configs...')
  const fileExistingConfig = await getConfigsForFiles(files)

  // Tarsync the framework to the project to apply any changes
  console.log('Tarsyncing the framework to the project...')
  await spinner('yarn rwfw project:tarsync', () => $`yarn rwfw project:tarsync`)

  // Get the configs for the files again
  console.log('Analyzing updated configs...')
  const fileUpdatedConfig = await getConfigsForFiles(files)

  // Compare the configs
  const logs: string[] = []
  const logAndPrint = (message: string) => {
    console.log(message)
    logs.push(message)
  }
  for (const file of files) {
    const existingConfig = fileExistingConfig.get(file)
    const updatedConfig = fileUpdatedConfig.get(file)

    // Check for differences in the more simplistic keys
    const simpleChecks = [
      'env',
      'globals',
      'parser',
      'plugins',
      'settings',
      'ignorePatterns',
    ]
    for (const key of simpleChecks) {
      if (
        JSON.stringify(existingConfig[key]) !==
        JSON.stringify(updatedConfig[key])
      ) {
        logAndPrint(`${file} has a different ${key} config`)
      }
    }

    // Check the "rules" key for differences
    const allRuleKeys = new Set([
      ...Object.keys(existingConfig.rules),
      ...Object.keys(updatedConfig.rules),
    ])
    for (const key of allRuleKeys) {
      if (!existingConfig.rules[key]) {
        logAndPrint(`${file} has a new rule for ${key}`)
      } else if (!updatedConfig.rules[key]) {
        logAndPrint(`${file} has a removed rule for ${key}`)
      } else if (
        JSON.stringify(existingConfig.rules[key]) !==
        JSON.stringify(updatedConfig.rules[key])
      ) {
        logAndPrint(`${file} has a different rule for ${key}`)
      }
    }
  }

  // Write the output to files for later analysis
  console.log('Writing results to files...')
  const __dirname = import.meta.dirname ?? '.'
  await fs.writeJSON(
    path.join(__dirname, 'before.json'),
    Object.fromEntries(fileExistingConfig),
    { spaces: 2 },
  )
  await fs.writeJSON(
    path.join(__dirname, 'after.json'),
    Object.fromEntries(fileUpdatedConfig),
    { spaces: 2 },
  )
  await fs.writeFile(path.join(__dirname, 'log.txt'), logs.join('\n'))
}

await main()
