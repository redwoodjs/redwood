import chalk from 'chalk'
import terminalLink from 'terminal-link'

const link = (topicId, isTerminal = false) => {
  const communityLink = `https://community.redwoodjs.com/t/${topicId}`
  if (isTerminal) {
    return terminalLink(communityLink, communityLink)
  } else {
    return communityLink
  }
}

export const getEpilogue = (
  command,
  description,
  topicId,
  isTerminal = false
) =>
  `This is an experimental feature to: ${description}.\n\nPlease find documentation and links to provide feedback for ${command} at:\n -> ${link(
    topicId,
    isTerminal
  )}`

export const getTaskEpilogue = (command, description, topicId) => {
  console.log(
    `${chalk.hex('#ff845e')(
      `------------------------------------------------------------------\n 🧪 ${chalk.green(
        'Experimental Feature'
      )} 🧪\n------------------------------------------------------------------`
    )}`
  )
  console.log(getEpilogue(command, description, topicId, false))

  console.log(
    `${chalk.hex('#ff845e')(
      '------------------------------------------------------------------'
    )}\n`
  )
}
