/* eslint-env node, es2021 */

import c from 'ansi-colors'
import prompts from 'prompts'

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
 * @typedef {{ name: string, exitIfNo: boolean, exitCode: string }} ConfirmOptions
 * @param {string} message
 * @param {ConfirmOptions} options
 * @returns {Promise<boolean>}
 */
export async function confirm(
  message,
  { name = 'confirmed', exitIfNo = false, exitCode = 1 } = {}
) {
  const answer = await exitOnCancelPrompts({
    type: 'confirm',
    name,
    message,
  })

  if (answer[name]) {
    return true
  }

  if (exitIfNo) {
    process.exit(exitCode)
  }

  return false
}

/**
 * @param {string} message
 * @param {Array<() => Promise<any>>} runs
 * @param {{ name: string, exitIfNo: boolean, exitCode: string }} options
 */
export async function confirmRuns(
  message,
  runs,
  { name = 'confirmed', exitIfNo = false, exitCode = 1 } = {}
) {
  const confirmed = await confirm(message, { name, exitIfNo, exitCode })

  if (!confirmed) {
    return false
  }

  if (!Array.isArray(runs)) {
    const res = await runs()
    return res ?? true
  }

  const runResults = []

  for (const run of runs) {
    const runResult = await run()
    runResults.push(runResult)
  }

  return runResults
}

// ------------------------

export const ASK = c.bgBlue(c.black('  ASK  '))
export const CHECK = c.bgYellow(c.black(' CHECK '))
export const FIX = c.bgRed(c.black('  FIX  '))
export const OK = c.bgGreen(c.black('  O K  '))
/**
 * See {@link https://stackoverflow.com/questions/38760554/how-to-print-cross-mark-or-check-mark-in-tcl}
 */
export const HEAVY_X = c.red('\u2716')
export const HEAVY_CHECK = c.green('\u2714')

/**
 * @param {string} prefix
 */
function makeStringFormatter(prefix) {
  return function formatter(strings, ...values) {
    const message = strings.reduce(
      (string, nextString, i) =>
        (string += nextString + c.green(values[i] ?? '')),
      ''
    )

    return `${prefix} ${message}`
  }
}

export const ask = makeStringFormatter(ASK)
export const check = makeStringFormatter(CHECK)
export const fix = makeStringFormatter(`${HEAVY_X} ${FIX}`)
export const ok = makeStringFormatter(`${HEAVY_CHECK} ${OK}`)
