import boxen from 'boxen'
import terminalLink from 'terminal-link'
import { v4 as uuidv4 } from 'uuid'

import {
  recordTelemetryAttributes,
  recordTelemetryError,
} from '@redwoodjs/cli-helpers'
import { errorTelemetry } from '@redwoodjs/telemetry'

import { shutdownTelemetry } from '../telemetry'

const DEFAULT_WARNING_EPILOGUE = [
  'Need help?',
  ` - Not sure about something or need advice? Reach out on our ${terminalLink(
    'Forum',
    'https://community.redwoodjs.com/'
  )}`,
  ` - Think you've found a bug? Open an issue on our ${terminalLink(
    'GitHub',
    'https://github.com/redwoodjs/redwood'
  )}`,
].join('\n')

const DEFAULT_ERROR_EPILOGUE = DEFAULT_WARNING_EPILOGUE

// export async function exitWithMessage(message, options) { }
// export async function exitWithWarning(warning, options) { }

export async function exitWithError(
  error,
  { exitCode, message, epilogue, includeEpilogue, includeReferenceCode } = {
    includeEpilogue: true,
    includeReferenceCode: true,
  }
) {
  // Determine the correct error message
  const errorMessage =
    message ?? error.stack ?? (error.toString() || 'Unknown error')

  // Generate a unique reference code for the error which can be used to look up
  // the error in telemetry if needed and if the user chooses to share it
  const errorReferenceCode = uuidv4()

  // Generate and print a nice message to the user
  const content = [
    errorMessage,
    includeEpilogue && `\n${'-'.repeat(process.stderr.columns - 8)}\n`,
    includeEpilogue && (epilogue ?? DEFAULT_ERROR_EPILOGUE),
    includeReferenceCode &&
      ` - Here's your unique error reference: '${errorReferenceCode}'`,
  ]
    .filter(Boolean)
    .join('\n')
  console.error(
    boxen(content, {
      padding: 1,
      borderColor: 'red',
      title: `Error`,
      titleAlignment: 'left',
    })
  )

  // Record the error in telemetry
  recordTelemetryError(error ?? new Error(errorMessage))
  recordTelemetryAttributes({ errorReferenceCode })
  await shutdownTelemetry()

  // Legacy telemetry
  errorTelemetry(process.argv, error?.message)

  process.exit(exitCode ?? error?.exitCode ?? 1)
}
