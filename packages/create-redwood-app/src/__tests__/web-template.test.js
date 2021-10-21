import fs from 'fs'
import path from 'path'

test('Web/src/App should contain App', () => {
  // This test is here to ensure we don't accidentally break auth setup commands
  // They rely on the presence of certain strings, so if we change them
  // packages/cli/src/commands/setup/auth/auth.js should also be changed

  const indexContent = fs
    .readFileSync(path.join(__dirname, '../../template/web/src/App.tsx'))
    .toString()

  expect(indexContent).toContain('const App = () => (')
})
