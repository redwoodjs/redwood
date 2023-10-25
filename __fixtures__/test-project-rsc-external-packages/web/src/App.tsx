// import { RscForm } from '@tobbe.dev/rsc-test'

import { Assets } from '@redwoodjs/vite/assets'
import { ProdRwRscServerGlobal } from '@redwoodjs/vite/rwRscGlobal'

// @ts-expect-error no types
import styles from './App.module.css'
import { onSend } from './chat'
import { Counter } from './Counter'
// TODO (RSC): Switch to RscForm from @tobbe.dev as commented above
import { Form as RscForm } from './Form'

import './App.css'

globalThis.rwRscGlobal = new ProdRwRscServerGlobal()

const App = ({ name = 'Anonymous' }) => {
  return (
    <>
      <Assets />
      <div style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}>
        <h1 className={styles.title}>Hello {name}!!</h1>
        <RscForm onSend={onSend} />
        <Counter />
      </div>
    </>
  )
}

export default App
