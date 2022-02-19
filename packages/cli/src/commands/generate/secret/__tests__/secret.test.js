import { generateSecret, handler } from './../secret.js'

describe('generateSecret', () => {
  it('contains only uppercase letters, lowercase letters, and digits', () => {
    const secret = generateSecret()

    expect(secret).toMatch(/^[A-Za-z0-9]{64}$/)
  })

  it('can optionally accept a length', () => {
    const secret = generateSecret(16)

    expect(secret.length).toEqual(16)
  })

  it('only prints the secret when stdout is not a tty', () => {
    const realLog = console.log
    const realInfo = console.info
    const realWrite = process.stdout.write
    const realIsTty = process.stdout.isTTY

    let output = ''

    console.log = (...args) => (output += args.join(' ') + '\n')
    console.info = (...args) => (output += args.join(' ') + '\n')
    process.stdout.write = (str) => (output += str)
    process.stdout.isTTY = false

    handler({})

    expect(output).toMatch(/^[A-Za-z0-9]{64}$/)

    console.log = realLog
    console.info = realInfo
    process.stdout.write = realWrite
    process.stdout.isTTY = realIsTty
  })
})
