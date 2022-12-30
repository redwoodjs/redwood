import termlink from 'terminal-link'

import { HerokuApi } from './api'
import { IHerokuContext } from './ctx'
import { createBoxen } from './messages'
import { clearStdout, sleep } from './stdio'

export async function addendumStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  const isAnyStepDisabled = ctx.predeploySteps.filter((s) => !s.enabled).length
  if (isAnyStepDisabled) {
    clearStdout(
      createBoxen(
        'Finished manually adding configs\nCheckout the heroku.sh script for more info',
        '🔍'
      )
    )
    return ctx
  }
  const { appUrl = '🚀' } = ctx
  const msg = `
🚀 Handed off to heroku... 🚀
In a few moments we will follow the deploy logs.
There is no end to this... You will need to ctr-c to exit the logs.
I hope you see this message and are not just staring at the logs go by
wondering when it will end... I hope.

You can view them at any time with heroku logs --tail --app ${ctx.appName}
`
  clearStdout(createBoxen(msg, termlink(appUrl, appUrl)))
  await sleep(5000)
  HerokuApi.followLogs(ctx)
  return ctx
}
