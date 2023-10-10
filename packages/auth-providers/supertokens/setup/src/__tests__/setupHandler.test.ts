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
}

import fs from 'fs'

import { addRoutingLogic } from '../setupHandler'

describe('addRoutingLogic', () => {
  it('modifies the Routes.{jsx,tsx} file', () => {
    mockFS.__setMockFiles({
      'Routes.tsx':
        "// In this file, all Page components from 'src/pages' are auto-imported.\n" +
        `
import { Router, Route } from '@redwoodjs/router'

import { useAuth } from './auth'

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

    addRoutingLogic.task()

    expect(mockFS.readFileSync('Routes.tsx')).toMatchInlineSnapshot(`
          "// In this file, all Page components from 'src/pages' are auto-imported.

          import { canHandleRoute, getRoutingComponent } from 'supertokens-auth-react/ui'

          import { Router, Route } from '@redwoodjs/router'

          import { useAuth, PreBuiltUI } from './auth'

          const Routes = () => {
            if (canHandleRoute(PreBuiltUI)) {
              return getRoutingComponent(PreBuiltUI)
            }

            return (
              <Router useAuth={useAuth}>
                <Route path="/login" page={LoginPage} name="login" />
                <Route path="/signup" page={SignupPage} name="signup" />
                <Route notfound page={NotFoundPage} />
              </Router>
            )
          }

          export default Routes
          "
      `)
  })

  it('handles a Routes.{jsx,tsx} file with a legacy setup', () => {
    mockFS.__setMockFiles({
      'Routes.tsx':
        "// In this file, all Page components from 'src/pages' are auto-imported.\n" +
        `
import SuperTokens from 'supertokens-auth-react'

import { Router, Route } from '@redwoodjs/router'

import { useAuth } from './auth'

const Routes = () => {
  if (SuperTokens.canHandleRoute()) {
    return SuperTokens.getRoutingComponent()
  }

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

    addRoutingLogic.task()

    expect(mockFS.readFileSync('Routes.tsx')).toMatchInlineSnapshot(`
      "// In this file, all Page components from 'src/pages' are auto-imported.



      import { canHandleRoute, getRoutingComponent } from 'supertokens-auth-react/ui'

      import { Router, Route } from '@redwoodjs/router'

      import { useAuth, PreBuiltUI } from './auth'

      const Routes = () => {
        if (canHandleRoute(PreBuiltUI)) {
          return getRoutingComponent(PreBuiltUI)
        }

        

        return (
          <Router useAuth={useAuth}>
            <Route path="/login" page={LoginPage} name="login" />
            <Route path="/signup" page={SignupPage} name="signup" />
            <Route notfound page={NotFoundPage} />
          </Router>
        )
      }

      export default Routes
      "
    `)
  })
})
