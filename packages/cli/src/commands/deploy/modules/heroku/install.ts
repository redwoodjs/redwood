import { doesHaveHeroku, doesHaveHomebrew } from './checks'
import { executeCommand } from './command'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function setupHeroku(_ctx: any, _task: any) {
  const hasHeroku = await doesHaveHeroku()
  if (!hasHeroku) {
    await doesHaveHomebrew()
    await _installHeroku()
  }
  // auth with heroku
}

async function _installHeroku() {
  try {
    // brew tap heroku/brew && brew install heroku
  } catch (err) {
    console.error(err)
  }
}

async function _tapHeroku() {
  await executeCommand('brew tap heroku/brew')
}
