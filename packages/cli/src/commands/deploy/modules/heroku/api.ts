import { type IHerokuContext, COMMAND_RESPONSES } from './interfaces'
import { spawn, spawnFollow } from './stdio'

export class Heroku {
  static async create(appName: string): Promise<string> {
    try {
      const output = await spawn(`heroku apps:create ${appName} --manifest`)
      return output?.split(' | ')[0]
    } catch (err: any) {
      if (err.stderr.includes(COMMAND_RESPONSES.create)) {
        return 'already taken'
      }
      throw err
    }
  }

  static async destroy(appName: string): Promise<string> {
    const out = await spawn(
      `heroku apps:destroy ${appName} --confirm ${appName}`
    )
    return out
  }

  static async whoami() {
    try {
      const out = await spawn('heroku auth:whoami')
      return out
    } catch (err: any) {
      if (err.stderr.includes(COMMAND_RESPONSES.whoami)) {
        return ''
      }
      throw err
    }
  }

  static async login(): Promise<string> {
    const output = await spawn('heroku auth:login', {
      stderr: 'inherit',
      stdin: 'inherit',
      stdout: 'pipe',
      reject: false,
    })
    const email =
      output.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || []
    return email[0] || ''
  }

  static async logout(): Promise<void> {
    await spawn('heroku auth:logout')
  }

  static async reauth(): Promise<string> {
    await Heroku.logout()
    const email = await Heroku.login()
    return email
  }

  static async addRemote({ appName }: IHerokuContext) {
    await spawn(`heroku git:remote -a ${appName}`)
  }

  static async push() {
    await spawnFollow('git push heroku main')
  }

  static async followLogs(ctx: IHerokuContext) {
    await spawnFollow(`heroku logs --tail --app ${ctx.appName}`)
  }
}
