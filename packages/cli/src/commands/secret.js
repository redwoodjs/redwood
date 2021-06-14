import password from 'secure-random-password'

export const command = 'secret'
export const description =
  'Generates a secret string using a cryptographically-secure source of entropy'

export const builder = (yargs) => yargs

export const handler = () => {
  const secret = password.randomPassword({
    length: 64,
    characters: [password.lower, password.upper, password.digits],
  })

  console.info('')
  console.info(`  ${secret}`)
  console.info('')
  console.info(
    "If you're using this with dbAuth, set a SESSION_SECRET environment variable to this value."
  )
  console.info('')
  console.info('Keep it secret, keep it safe!')
}
