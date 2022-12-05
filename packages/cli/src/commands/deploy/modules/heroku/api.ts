import type { HerokuApps } from './interfaces'
import { spawn, Logger } from './stdio'

export class Heroku {
  static async allApps(): Promise<HerokuApps> {
    const output = await spawn('heroku apps --json')
    return JSON.parse(output)
  }

  static async appByName(appName: string): Promise<string> {
    return spawn(`heroku apps:info ${appName}`)
  }

  static async createApp(appName: string): Promise<string> {
    const buildpacks =
      '-b heroku/nodejs -b https://github.com/heroku/heroku-buildpack-nginx'
    const addons = '--addons heroku-postgresql'
    const output = await spawn(
      `heroku apps:create ${addons} ${buildpacks} ${appName}`
    )

    if (output.includes('already taken')) {
      return 'already taken'
    }
    Logger.out('Heroku app created.')
    return output?.split(' | ')[0]
  }

  static async deleteApp(appName: string): Promise<void> {
    await spawn(`heroku apps:destroy ${appName} --confirm ${appName}`)
  }

  static async currentUser() {
    return spawn('heroku auth:whoami')
  }

  static async login(): Promise<string> {
    const output = await spawn('heroku auth:login')
    const email =
      output.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || []
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

  static async push() {
    Logger.out('Pushing to Heroku...')
    await spawn('git push heroku master')
  }
}
