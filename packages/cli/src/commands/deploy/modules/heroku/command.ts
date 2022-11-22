import execa, { ExecaReturnValue } from 'execa'

export async function spawnInteractive(
  command: string,
  options?: execa.Options
): Promise<ExecaReturnValue> {
  return spawnShell(command, {
    stdio: 'inherit',
    cleanup: true,
    shell: true,
    ...options,
  })
}

export async function spawnShell(command: string, opts?: execa.Options) {
  return execa.command(command, {
    ...opts,
  })
}

export async function binDoesExist(bin: string): Promise<boolean> {
  try {
    const { stdout, stderr } = await spawnShell(`which ${bin}`)
    if (stderr || /not found/.test(stdout)) {
      return false
    }
    return true
  } catch (err) {
    return false
  }
}
