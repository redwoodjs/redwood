import type { HerokuApps } from './interfaces'
import { spawn, Logger } from './stdio'

export class Heroku {
  static async allApps(): Promise<HerokuApps> {
    const { stdout } = await spawn('heroku apps --json')
    return JSON.parse(stdout as string)
  }

  static async appByName(appName: string): Promise<string> {
    const { stdout } = await spawn(`heroku apps:info ${appName}`)
    return stdout || ''
  }

  static async createApp(appName: string, opts = {}) {
    return spawn(`heroku apps:create ${appName}`, opts)
  }

  static async deleteApp(appName: string): Promise<void> {
    await spawn(`heroku apps:destroy ${appName} --confirm ${appName}`)
  }

  static async currentUser(): Promise<string> {
    const { stdout = '' } = await spawn('heroku auth:whoami')
    return stdout
  }

  static async login(): Promise<string> {
    const { stdout = '' } = await spawn('heroku auth:login', {
      stdio: 'inherit',
      reject: true,
    })
    const email =
      stdout.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || []
    return email[0] || ''
  }

  static async logout(): Promise<void> {
    await spawn('heroku auth:logout')
  }

  static async reauth(): Promise<string> {
    Logger.out('Re-authenticating with Heroku...')
    await Heroku.logout()
    return Heroku.login()
  }
}
