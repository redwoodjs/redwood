// mock Telemetry for CLI commands so they don't try to spawn a process
jest.mock('@redwoodjs/telemetry', () => {
  return {
    errorTelemetry: () => jest.fn(),
    timedTelemetry: () => jest.fn(),
  }
})

jest.mock('@redwoodjs/cli-helpers', () => {
  return {
    getPaths: () => {
      return {
        web: {
          src: '',
          app: '',
          routes: 'Routes.tsx',
        },
        base: '',
      }
    },
    standardAuthHandler: () => jest.fn(),
  }
})

// This will load packages/auth-providers/supertokens/setup/__mocks__/fs.js
jest.mock('fs')

const mockFS = fs as unknown as Omit<jest.Mocked<typeof fs>, 'readdirSync'> & {
  __setMockFiles: (files: Record<string, string>) => void
  __getMockFiles: () => Record<string, string>
  readdirSync: () => string[]
}

import fs from 'fs'

import { extraTask } from '../setupHandler'

test('extraTask', () => {
  mockFS.__setMockFiles({
    'Routes.tsx':
      "// In this file, all Page components from 'src/pages' are auto-imported.\n" +
      `
import { Router, Route } from '@redwoodjs/router'

const Routes = () => {
  return (
    <Router useAuth={useAuth}>
      <Route path="/login" page={LoginPage} name="login" />
      <Route path="/signup" page={SignupPage} name="signup" />
      <Route notfound page={NotFoundPage} />
    </Router>
  )
}

export default Routes
`,
  })

  extraTask.task()

  expect(mockFS.readFileSync('Routes.tsx')).toMatchSnapshot()
})
