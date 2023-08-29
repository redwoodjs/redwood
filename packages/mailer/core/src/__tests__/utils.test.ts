import { convertAddresses, extractDefaults } from '../utils'

describe('convertAddresses', () => {
  test('string passthrough', () => {
    const addresses = ['alice@example.com', 'bob@example.com']
    expect(convertAddresses(addresses)).toStrictEqual(addresses)
  })
  test('object without name', () => {
    const addresses = [
      { address: 'alice@example.com' },
      { address: 'bob@example.com' },
    ]
    expect(convertAddresses(addresses)).toStrictEqual([
      'alice@example.com',
      'bob@example.com',
    ])
  })
  test('object with name', () => {
    const addresses = [
      { address: 'alice@example.com', name: 'Alice McExampleton' },
      { address: 'bob@example.com', name: 'Bob Testinger' },
    ]
    expect(convertAddresses(addresses)).toStrictEqual([
      'Alice McExampleton <alice@example.com>',
      'Bob Testinger <bob@example.com>',
    ])
  })
})

describe('extractDefaults', () => {
  test('blank', () => {
    expect(extractDefaults({})).toStrictEqual({
      attachments: [],
      bcc: [],
      cc: [],
      from: undefined,
      headers: {},
      replyTo: undefined,
    })
  })

  test('example', () => {
    expect(
      extractDefaults({
        from: 'from@example.com',
        replyTo: 'replyTo@example.com',
        cc: ['ccOne@example.com', 'ccTwo@example.com'],
        bcc: {
          name: 'BCC Recipient',
          address: 'bcc@example.com',
        },
        headers: {
          'X-Test-Header': 'test',
        },
        attachments: [
          {
            filename: 'test.txt',
            content: 'test',
          },
        ],
      })
    ).toStrictEqual({
      attachments: [
        {
          filename: 'test.txt',
          content: 'test',
        },
      ],
      bcc: ['BCC Recipient <bcc@example.com>'],
      cc: ['ccOne@example.com', 'ccTwo@example.com'],
      from: 'from@example.com',
      headers: {
        'X-Test-Header': 'test',
      },
      replyTo: 'replyTo@example.com',
    })
  })
})

describe('constructCompleteSendOptions', () => {
  test.todo('...')
})
