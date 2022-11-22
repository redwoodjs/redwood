import { spawnInteractive, binDoesExist } from './command'
import { IListrContext, IListrTask } from './interfaces'

export async function setupHeroku(_ctx: IListrContext, _task: IListrTask) {
  const hasHeroku = await binDoesExist('heroku')
  if (!hasHeroku) {
    throw new Error('Heroku CLI not found')
  }
  await _loginToHeroku()
}

async function _loginToHeroku() {
  const { stdout, stderr } = await spawnInteractive('heroku login')
  console.log('out from login', stdout)
  console.error('err from login', stderr)
}
