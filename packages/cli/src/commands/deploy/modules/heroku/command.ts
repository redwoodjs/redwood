import execa, { ExecaReturnValue } from 'execa'

export async function spawnInteractive(
  command: string,
  options?: execa.Options
): Promise<ExecaReturnValue> {
  return spawnShell(command, {
    stdio: 'pipe',
    shell: true,
    ...options,
  })
}

export async function spawn(
  command: string,
  opts?: execa.Options
): Promise<string> {
  const { stdout } = await spawnShell(command, opts)
  return stdout
}

export async function spawnShell(
  command: string,
  opts?: execa.Options
): Promise<ExecaReturnValue> {
  return execa.command(command, opts)
}

export async function binDoesExist(bin: string): Promise<boolean> {
  try {
    const { stdout, stderr } = await spawnShell(`command -v ${bin}`)
    return !!stderr || !!stdout
  } catch (err) {
    return false
  }
}

export async function systemInfo() {
  const { stdout } = await spawnShell('uname -m -s')
  return stdout.split(' ')
}

export async function hasRosetta(): Promise<boolean> {
  // Internally rosetta is called 'oahd'
  const { stdout, stderr } = await spawnShell('/usr/bin/pgrep -q oahd')
  return !!stderr || !stdout
}
