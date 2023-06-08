import yargs from 'yargs'

import { generateSecret, handler, builder } from './../secret.js'

describe('generateSecret', () => {
  it('contains only uppercase letters, lowercase letters, and digits', () => {
    const secret = generateSecret()

    expect(secret).toMatch(/^[A-Za-z0-9]{64}$/)
  })

  it('can optionally accept a length', () => {
    const secret = generateSecret(16)

    expect(secret.length).toEqual(16)
  })

  it('prints nothing but the secret when setting the --raw flag', () => {
    const realLog = console.log
    const realInfo = console.info
    const realWrite = process.stdout.write

    let output = ''

    console.log = (...args) => (output += args.join(' ') + '\n')
    console.info = (...args) => (output += args.join(' ') + '\n')
    process.stdout.write = (str) => (output += str)

    const { raw, length } = yargs
      .command('secret', false, builder, handler)
      .parse('secret --raw')

    console.log = realLog
    console.info = realInfo
    process.stdout.write = realWrite

    expect(raw).toBeTruthy()
    expect(output).toMatch(new RegExp(`^[A-Za-z0-9]{${length}}\n$`))
  })
})
