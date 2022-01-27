/* eslint-env node, es2021 */
import c from 'ansi-colors'
import boxen from 'boxen'
import prompts from 'prompts'

export const ASK = c.bgBlue(c.black('  ASK  '))
export const CHECK = c.bgYellow(c.black(' CHECK '))
export const FIX = c.bgRed(c.black('  FIX  '))
export const OK = c.bgGreen(c.black('  O K  '))
// https://stackoverflow.com/questions/38760554/how-to-print-cross-mark-or-check-mark-in-tcl
export const HEAVY_X = c.red('\u2716')
export const HEAVY_CHECK = c.green('\u2714')

/**
 * Wrapper around `prompts` to exit on crtl c.
 *
 * @template Name
 * @param {import('prompts').PromptObject<Name>} promptsObject
 * @param {import('prompts').Options} promptsOptions
 */
export function exitOnCancelPrompts(promptsObject, promptsOptions) {
  return prompts(promptsObject, {
    ...promptsOptions,
    onCancel: () => process.exit(1),
  })
}

/**
 * Wrapper around confirm type `prompts`.
 *
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export async function confirm(message) {
  const answer = await exitOnCancelPrompts({
    type: 'confirm',
    name: 'confirm',
    message,
  })

  return answer.confirm
}

/**
 * @param {string} message
 */
export function rocketBoxen(message) {
  return boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: {
      bottomLeft: '🚀',
      bottomRight: '🚀',
      horizontal: '—',
      topLeft: '🚀',
      topRight: '🚀',
      vertical: '🚀',
    },
  })
}
