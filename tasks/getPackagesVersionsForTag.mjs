/* eslint-env node */
import { execSync } from 'node:child_process'
import { basename } from 'node:path'

const TAGS = ['latest', 'rc', 'next', 'canary', 'experimental']

async function main() {
  const [_nodeBinPath, scriptPath, tag = 'latest'] = process.argv

  if (['help', '-h', '--help'].includes(tag)) {
    console.log(
      [
        `yarn node tasks/${basename(scriptPath)} [tag]`,
        '',
        `Valid tags: ${TAGS.join(', ')}`,
        'If no tag is provided, defaults to latest',
      ].join('\n')
    )

    return
  }

  if (!TAGS.includes(tag)) {
    console.log(`Invalid tag. Must be one of: ${TAGS.join(', ')}`)

    process.exitCode = 1
    return
  }

  const workspaceListJson =
    '[' +
    execSync('yarn workspaces list --json', {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .join(',') +
    ']'

  const workspacePackages = JSON.parse(workspaceListJson)
    .map((workspace) => workspace.name)
    // Get rid of the root workspace, which has no name.
    .filter(Boolean)

  const namesToVersions = {}

  for (const packageName of workspacePackages) {
    try {
      const { version } = JSON.parse(
        execSync(
          `yarn npm info ${packageName}@${tag} --fields version --json`,
          {
            encoding: 'utf-8',
          }
        )
      )

      namesToVersions[packageName] = version

      console.log(`Latest @${tag} version for ${packageName}: ${version}`)
    } catch (error) {
      console.error(`Error fetching information for ${packageName}:`, error)
    }
  }
}

main()
