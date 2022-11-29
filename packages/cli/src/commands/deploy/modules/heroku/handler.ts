import process from 'process'
import rdl from 'readline'

import { colors, getPaths } from '../../../../lib'

import { checkSystemRequirements } from './checks'
import { IHerokuContext, IYargs } from './interfaces'
import { Logger } from './logger'
import {
  authHerokuTask,
  copyHerokuTemplatesTask,
  configureDeploymentTask,
  createHerokuAppTask,
  nukeHerokuAppTask,
} from './setup'

import { SPINNER_ANIMATIONS } from './spinners'

export async function herokuHandler(yargs: IYargs) {
  try {
    const s = spinner('Setting up heroku deployment')
    const context = _createContext(yargs)
    // s.setPrompt('Checking system requirements...')
    // s.prompt()
    // await checkSystemRequirements()
    // s.setPrompt('Authenticating with Heroku...')
    // s.prompt()
    // await authHerokuTask()
    // s.setPrompt('Copying templates...')
    // s.prompt()
    // await copyHerokuTemplatesTask(context)
    // s.setPrompt('Configuring deployment...')
    // const configuredContext = await configureDeploymentTask(context)
    // s.setPrompt('Creating Heroku app...')
    // s.prompt()
    // await createHerokuAppTask(configuredContext)
    // s.setPrompt('Deploying to Heroku...')
    // s.prompt()
    // await nukeHerokuAppTask(configuredContext)
    // s.close()
  } catch (err: any) {
    console.error(colors.error(err.message))
    process.exit(1)
  }
}

function _createContext(yargs: IYargs): IHerokuContext {
  return {
    paths: getPaths(),
    logger: new Logger(yargs.debug),
    defaults: yargs.defaults,
    nuke: yargs.nuke,
  }
}

class Spinner {
  _spinner: rdl.Interface
  constructor() {
    this._spinner = rdl.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  private spin() {
    
  }
}


// creates a simple spinner with changing text
function spinner(message: string) {
  const s = rdl.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  ;(async () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      for (const animation of SPINNER_ANIMATIONS['growVertical'].frames) {
        s.setPrompt(`${animation} ${message}`)
        s.prompt()
        await sleep(100)
      }
    }
  })()
  return s
}

function sleep(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time))
}
