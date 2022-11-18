import execa from 'execa'

export async function checkHerokuInstalled(ctx: any, task: any): Promise<void> {
  await execute('printenv')
}

export async function execute(command: string): Promise<string> {
  const { stdout, stderr } = await execa.sync(command)
  console.debug({ stderr, stdout })
  return 'foo'
}
