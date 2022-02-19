import password from 'secure-random-password'

const DEFAULT_LENGTH = 64

export const generateSecret = (length = DEFAULT_LENGTH) => {
  return password.randomPassword({
    length,
    characters: [password.lower, password.upper, password.digits],
  })
}

export const command = 'secret'
export const description =
  'Generates a secret key using a cryptographically-secure source of entropy'

export const builder = (yargs) =>
  yargs.option('length', {
    description: 'Length of the generated secret',
    type: 'integer',
    required: false,
    default: DEFAULT_LENGTH,
  })

export const handler = ({ length }) => {
  if (!process.stdout.isTTY) {
    // If the output is being piped we only print the secret, no
    // information messages. This makes it easier to programmatically use the
    // output.
    // Using stdout.write here to not get the newline that console.log always
    // adds
    process.stdout.write(generateSecret(length))
    return
  }

  console.info('')
  console.info(`  ${generateSecret(length)}`)
  console.info('')
  console.info(
    "If you're using this with dbAuth, set a SESSION_SECRET environment variable to this value."
  )
  console.info('')
  console.info('Keep it secret, keep it safe!')
}
