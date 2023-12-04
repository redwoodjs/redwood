import { createRoot } from 'react-dom/client'

import { Route, Router, Set } from '@redwoodjs/router'
import { serve } from '@redwoodjs/vite/client'
import { FatalErrorBoundary } from '@redwoodjs/web'

import NavigationLayout from './layouts/NavigationLayout/NavigationLayout'
import FatalErrorPage from './pages/FatalErrorPage/FatalErrorPage'
import NotFoundPage from './pages/NotFoundPage/NotFoundPage'

const redwoodAppElement = document.getElementById('redwood-app')

const AboutPage = serve('AboutPage')
const HomePage = serve('HomePage')

const root = createRoot(redwoodAppElement)

const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <Router>
        <Set wrap={NavigationLayout}>
          <Route path="/" page={HomePage} name="home" />
          <Route path="/about" page={AboutPage} name="about" />
        </Set>
        <Route notfound page={NotFoundPage} />
      </Router>
    </FatalErrorBoundary>
  )
}

root.render(<App />)
