import ReactDOM from 'react-dom'

import App from './App'

import './index.css'
import './scaffold.css'

const rootElement = document.getElementById('redwood-app')

if (rootElement.hasChildNodes()) {
  ReactDOM.hydrate(<App />, rootElement)
} else {
  ReactDOM.render(<App />, rootElement)
}
