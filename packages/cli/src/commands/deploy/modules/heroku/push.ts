import { Heroku } from './api'
import { IHerokuContext } from './interfaces'

export async function pushStep(ctx: IHerokuContext): Promise<IHerokuContext> {
  await Heroku.addRemote(ctx)
  await Heroku.push()
  return ctx
}
