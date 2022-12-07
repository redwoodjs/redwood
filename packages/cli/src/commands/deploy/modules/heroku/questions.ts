import prompts from 'prompts'

import { IHerokuContext } from './interfaces'
import { blue, green, grey, red, underline, yellow } from './stdio'

async function _promptWithExit(qs: any, opts = {}) {
  return prompts(qs, {
    onCancel: () => {
      console.log(red('Exiting...'))
      process.exit(0)
    },
    ...opts,
  })
}

export class Questions {
  static async shouldReAuthenticate(loggedInUser: string): Promise<boolean> {
    const message = `${green('You are currently logged in as: ')}[${blue(
      loggedInUser
    )}]\n${green('Would you like to log in as a')} ${yellow(
      'different user?'
    )}}`
    const { useUser } = await _promptWithExit({
      type: 'confirm',
      name: 'useUser',
      message,
      initial: false,
    })
    return useUser
  }
  static async chooseAppName({
    appName,
    defaults,
    logger,
  }: IHerokuContext): Promise<string> {
    if (defaults) {
      logger.debug(`Using default app name: ${appName}`)
      return appName
    }
    const { selectedAppName } = await _promptWithExit([
      {
        type: 'text',
        name: 'selectedAppName',
        message: `${green('Name your deployment app.')} ${grey(
          `Default: [${appName}]`
        )}`,
        initial: appName,
      },
    ])
    return selectedAppName
  }

  static async nameExistsChooseOption({
    logger,
    appName,
    defaults,
  }: IHerokuContext): Promise<'new' | 'delete'> {
    if (defaults) {
      logger.debug(`Deleting and creating new: ${appName}`)
      return 'delete'
    }
    const message = `${green('App')} ${blue(appName)} ${green(
      'already exists'
    )}.`
    const { choice } = await _promptWithExit(
      {
        type: 'select',
        name: 'choice',
        message,
        initial: 0,
        choices: [
          {
            title: `${green('Delete')} ${blue(appName)} ${green(
              'and recreate?'
            )} ${grey('[default]')}`,
            value: 'delete',
          },
          { title: green('Select a new app name'), value: 'new' },
          { title: red('Or exit'), value: 'exit' },
        ],
      },
      {
        onSubmit: (_: any, answer: string) => {
          if (answer === 'exit') {
            logger.log(underline('Exiting...'))
            process.exit(0)
          }
        },
      }
    )

    return choice
  }

  static async shouldInitGit({
    defaults,
    logger,
  }: IHerokuContext): Promise<boolean> {
    if (defaults) {
      logger.debug(`Should init git [yes]`)
      return true
    }
    const message = `${green('Your project is')} ${red('not')} ${green(
      'a git repo. Would you like to initialize one?'
    )} ${grey('Default [yes]')}`
    const { initGit } = await _promptWithExit({
      type: 'confirm',
      name: 'initGit',
      message,
      initial: true,
    })
    return initGit
  }

  static async shouldCommitChanges({
    defaults,
    logger,
  }: IHerokuContext): Promise<boolean> {
    if (defaults) {
      logger.debug(`Should commit [yes]`)
      return true
    }
    const message = `${green(
      'You have un commited changes. Would you like to commit them?'
    )} ${grey('Default [yes]')}`
    const { commitChanges } = await _promptWithExit({
      type: 'confirm',
      name: 'commitChanges',
      message,
      initial: true,
    })
    return commitChanges
  }

  static async shouldEditSchema(): Promise<boolean> {
    const message = `${green(
      'You dont have postgres set as your prisma db. Would you like to configure it?'
    )} ${grey('Default [yes]')}`
    const { shouldConfigure } = await _promptWithExit({
      type: 'confirm',
      name: 'shouldConfigure',
      message,
      initial: true,
    })
    return shouldConfigure
  }
}
