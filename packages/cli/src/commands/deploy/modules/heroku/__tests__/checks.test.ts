import { checkHerokuInstalled } from '../checks'

// jest.mock('execa')

describe('check for heroku', () => {
  it('checks for heroku', async () => {
    await checkHerokuInstalled('foo', {
      title: 'bar',
      task: () => jest.fn(),
    })
    // const actual = await checkHerokuInstalled({ foo: 'bar' }, { baz: 'qux' })
  })
})
