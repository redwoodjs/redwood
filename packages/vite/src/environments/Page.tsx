import React from 'react'

import { Route } from '@redwoodjs/router/Route'
import { Router } from '@redwoodjs/router/RscRouter'


export function Page() {
  return (
    <Router>
      <Route path='/' page={() => <>Hello world</>} name='home'/>
    </Router>
    )
}