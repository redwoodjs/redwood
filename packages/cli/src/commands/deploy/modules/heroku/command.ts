import execa, { ExecaReturnValue } from 'execa'

export async function executeCommand(
  command: string,
  opts = {}
): Promise<ExecaReturnValue> {
  return execa.command(command, opts)
}

export async function binDoesExist(bin: string): Promise<boolean> {
  try {
    const { stdout, stderr } = await executeCommand(`which ${bin}`)
    if (stderr || /not found/.test(stdout)) {
      return false
    }
    return true
  } catch (err) {
    return false
  }
}
