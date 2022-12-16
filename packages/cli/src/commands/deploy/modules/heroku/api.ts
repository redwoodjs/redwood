import type { IHerokuContext } from './interfaces'

export class HerokuApi {
  static async apps({ spawn }: IHerokuContext) {
    return await spawn('heroku apps --json', {
      stdin: 'inherit',
      stderr: 'inherit',
    })
  }

  static async create({ appName, spawn }: IHerokuContext): Promise<string> {
    try {
      await spawn('heroku plugins:install @heroku-cli/plugin-manifest')
      const output = await spawn(`heroku apps:create ${appName} --manifest`)
      return output.toString()?.split(' | ')[0]
    } catch (err: any) {
      if (err.stderr.includes('already taken')) {
        return 'already taken'
      }
      throw err
    }
  }

  static async destroy({ spawn, appName }: IHerokuContext): Promise<string> {
    const out = await spawn(
      `heroku apps:destroy ${appName} --confirm ${appName}`
    )
    return out.toString()
  }

  static async whoami({ spawn }: IHerokuContext): Promise<string> {
    try {
      const out = await spawn('heroku auth:whoami')
      return out.toString()
    } catch (err: any) {
      if (err.stderr.includes('not logged in')) {
        return ''
      }
      throw err
    }
  }

  static async login({ spawn }: IHerokuContext): Promise<string> {
    const output = (await spawn('heroku auth:login', {
      stderr: 'inherit',
      stdin: 'inherit',
      stdout: 'pipe',
      reject: false,
    })) as string
    const email =
      output.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || []
    return email[0] || ''
  }

  static async logout({ spawn }: IHerokuContext): Promise<void> {
    await spawn('heroku auth:logout')
  }

  static async reauth(ctx: IHerokuContext): Promise<string> {
    await HerokuApi.logout(ctx)
    const email = await HerokuApi.login(ctx)
    return email
  }

  static async addRemote({ appName, spawn }: IHerokuContext) {
    await spawn(`heroku git:remote -a ${appName}`)
  }

  static async push({ spawn }: IHerokuContext) {
    await spawn('git push heroku main', {
      stdio: 'inherit',
    })
  }

  static async followLogs({ appName, spawn }: IHerokuContext) {
    await spawn(`heroku logs --tail --app ${appName}`, {
      stdio: 'inherit',
    })
  }
}
