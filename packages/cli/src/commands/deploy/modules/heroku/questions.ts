import prompts from 'prompts'

import { IHerokuContext } from './interfaces'
import { Logger } from './stdio'

async function _promptWithExit(qs: any, opts = {}) {
  return prompts(qs, {
    onCancel: () => {
      Logger.out('Exiting...')
      process.exit(0)
    },
    ...opts,
  })
}

export class Questions {
  static async shouldReAuthenticate(loggedInUser: string): Promise<boolean> {
    const { useUser } = await _promptWithExit({
      type: 'confirm',
      name: 'useUser',
      message: `You are currently logged in as ${loggedInUser}. Do you want to re-authenticate?`,
      initial: false,
    })
    return useUser
  }
  static async chooseAppName({
    appName,
    defaults,
  }: IHerokuContext): Promise<string> {
    if (defaults) {
      Logger.out(`Using default app name: ${appName}`)
      return appName
    }
    const { selectedAppName } = await _promptWithExit([
      {
        type: 'text',
        name: 'selectedAppName',
        message: `Name your deployment app. [${appName}]?`,
        initial: appName,
      },
    ])
    return selectedAppName
  }

  static async nameExistsChooseOption(
    ctx: IHerokuContext
  ): Promise<'new' | 'delete'> {
    const { choice } = await _promptWithExit(
      {
        type: 'select',
        name: 'choice',
        message: `App ${ctx.appName} already exists. What would you like to do?`,
        initial: 0,
        choices: [
          {
            title: `Delete ${ctx.appName} and recreate? [default]`,
            value: 'delete',
          },
          { title: 'Select a new app name', value: 'new' },
          { title: 'Exit', value: 'exit' },
        ],
      },
      {
        onSubmit: (_: any, answer: string) => {
          if (answer === 'exit') {
            Logger.out('Exiting...')
            process.exit(0)
          }
        },
      }
    )

    return choice
  }
}
