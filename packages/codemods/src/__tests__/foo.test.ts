import path from 'path'

import testCodemod from './utils/testCodemod'

test('Foo becomes Bar', () => {
  testCodemod(path.join(__dirname, '../lib/fooToBar.ts'), 'foo')
})
