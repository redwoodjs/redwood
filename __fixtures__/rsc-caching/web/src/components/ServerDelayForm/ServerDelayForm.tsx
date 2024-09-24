import fs from 'node:fs'

import { formAction } from './actions'

import './ServerDelayForm.css'

const ServerDelayForm = () => {
  let delay = 0

  if (fs.existsSync('settings.json')) {
    delay = JSON.parse(fs.readFileSync('settings.json', 'utf8')).delay || 0
  }

  return (
    <div className="server-delay-form">
      <form action={formAction}>
        <label htmlFor="delay">
          <div>Delay ({delay}ms)</div>
          <input type="number" id="delay" name="delay" />
        </label>
        <button type="submit">Set</button>
      </form>
    </div>
  )
}

export default ServerDelayForm
