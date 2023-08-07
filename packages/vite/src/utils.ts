import { getPaths } from '@redwoodjs/project-config'

export function stripQueryStringAndHashFromPath(url: string) {
  return url.split('?')[0].split('#')[0]
}

// Check CWD: make sure its the web/ directory
// Without this Postcss can misbehave, and its hard to trace why.
export function ensureProcessDirWeb(webDir: string = getPaths().web.base) {
  if (process.cwd() !== webDir) {
    console.error('⚠️  Warning: CWD is ', process.cwd())
    console.warn('~'.repeat(50))
    console.warn(
      'The cwd must be web/. Please use `yarn rw <command>` or run the command from the web/ directory.'
    )
    console.log(`Changing cwd to ${webDir}....`)
    console.log()

    process.chdir(webDir)
  }
}
