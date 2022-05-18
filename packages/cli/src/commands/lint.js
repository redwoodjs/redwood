export const command = 'lint [files..]'

export const description = 'Lint files'

export async function builder(yargs) {
  const { default: terminalLink } = await import('terminal-link')

  yargs
    .positional('files', {
      description:
        'Specify file(s) or directory(ies) to lint relative to project root',
      type: 'array',
    })
    .option('fix', {
      default: false,
      description: 'Try to fix errors',
      type: 'boolean',
    })
    .epilogue(
      `Also see the ${terminalLink(
        'Redwood CLI Reference',
        'https://redwoodjs.com/docs/cli-commands#lint'
      )}`
    )
}

export async function handler(argv) {
  const { default: execa } = await import('execa')
  const { fix, files, redwoodProject } = argv

  let command = ['yarn', 'eslint', fix && '--fix'].filter(Boolean)

  /**
   * If the user passed files, we lint those.
   * Otherwise we lint both sides (if they're there).
   */
  if (files.length) {
    command.push(...files)
  } else {
    const sidesToLint = [
      redwoodProject.hasApiSide && 'api/src',
      redwoodProject.hasWebSide && 'web/src',
    ].filter(Boolean)

    command.push(...sidesToLint)
  }

  try {
    const execaChildProcess = await execa.command(command.join(' '), {
      cwd: redwoodProject.paths.base,
      stdio: 'inherit',
    })

    process.exitCode = execaChildProcess.exitCode
  } catch (e) {
    process.exitCode = e.exitCode
  }
}
