import terminalLink from 'terminal-link'

import c from 'src/lib/colors'

export const generateDepracatedHandler = ({ newCommand, docsLink }) => {
  return () => {
    try {
      console.log(c.warning('\n' + 'WARNING: deprecated command'))
      console.log('Please use the new command: ' + c.green(`${newCommand} \n`))

      console.log(
        `Also see the ${terminalLink('Redwood CLI Reference', docsLink)}`
      )
    } catch (e) {
      console.log(c.error(e.message))
    }
  }
}
