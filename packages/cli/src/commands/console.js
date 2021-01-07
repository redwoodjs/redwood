import execa from 'execa'

export const command = 'console'
export const aliases = ['c']
export const description = 'Launch an interactive Redwood shell (experimental)'

export const handler = () => {
  execa.commandSync(`node --experimental-repl-await ${__dirname}/asyncRepl.js`, {
    stdio: 'inherit',
  })
}
