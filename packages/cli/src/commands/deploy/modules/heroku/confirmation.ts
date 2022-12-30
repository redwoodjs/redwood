import prompts from 'prompts'

import { colors } from '../../../../lib'

import { type IHerokuContext } from './ctx'
import {
  createReadyMessage,
  createActionsMessages,
  createBoxen,
} from './messages'
import { PREDEPLOY_CHOICES } from './predeploy'
import { writeStdout } from './stdio'

export async function confirmationStep(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  if (ctx.defaults) {
    writeStdout(
      createBoxen(colors.blue('Skipping feedback. Using defaults'), '🤖')
    )
    return ctx
  }

  _validateSystem(ctx)

  const readyMessage = createReadyMessage(ctx)
  const listOfActions = createActionsMessages(ctx)

  _readyDialogs(ctx.appName, readyMessage, listOfActions)

  const choice = await _chooseRunPath(ctx)
  if (choice === 'quit') {
    _quit()
  }

  if (choice === 'run') {
    return ctx
  }

  if (choice === 'manual') {
    const updatedCtx = _generateIndividual(ctx)
    return updatedCtx
  }

  throw new Error('Invalid choice')
}

function _quit(): void {
  writeStdout(
    createBoxen('No prob. Come back when you are ready!', 'Goodbye! 👋')
  )
  process.exit(0)
}

function _validateSystem({ prereqs }: IHerokuContext): void {
  if (!prereqs?.isDarwin) {
    writeStdout(
      createBoxen('Error', '😢 Only Macs are supported at this time.')
    )
    process.exit(0)
  }
  return
}

async function _readyDialogs(
  appName: string,
  message: string,
  listOfActions: string
): Promise<void> {
  writeStdout(createBoxen(message, 'Current status'))
  writeStdout(createBoxen(listOfActions, `📝 Changes to make for [${appName}]`))
  return
}

async function _chooseRunPath(_ctx: IHerokuContext): Promise<string> {
  const { value } = await prompts({
    type: 'select',
    name: 'value',
    message: 'Select the steps you want to run',
    choices: [
      { title: 'Deploy with defaults', value: 'run' },
      { title: 'Manual configuration. No deployment', value: 'manual' },
      { title: 'Quit', value: 'quit' },
    ],
    initial: 0,
  })

  return value
}

async function _generateIndividual(
  ctx: IHerokuContext
): Promise<IHerokuContext> {
  const choices = PREDEPLOY_CHOICES.map((s) => ({
    title: s.title,
    description: s.description,
    selected: s.enabled,
    value: s.step,
  }))
  const { selectedSteps } = await prompts({
    type: 'multiselect',
    name: 'selectedSteps',
    message: 'Select components to install',
    choices,
    min: 1,
    instructions: false,
  })

  return {
    ...ctx,
    predeploySteps: ctx.predeploySteps.map((s) => {
      const selected = selectedSteps.includes(s.step)
      return { ...s, enabled: selected }
    }),
  }
}
