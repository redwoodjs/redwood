import React from 'react'

import { act, render, waitFor } from '@testing-library/react'

import { navigate } from '../history'
import { Route, Router } from '../router'

const RedirectedRoutes = () => (
  <Router>
    <Route path="/simple" redirect="/redirectedSimple" name="simple" />
    <Route
      path="/redirectedSimple"
      name="redirectedSimple"
      page={() => <h1>FINDME</h1>}
    />
  </Router>
)

test('Redirected route', async () => {
  const screen = render(<RedirectedRoutes />)
  act(() => navigate('/simple'))

  await waitFor(() => screen.getByText('FINDME'))
})
