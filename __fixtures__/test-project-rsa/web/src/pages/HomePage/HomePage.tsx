import { Assets } from '@redwoodjs/vite/assets'
import { ProdRwRscServerGlobal } from '@redwoodjs/vite/rwRscGlobal'

import { onSend } from './chat'
import { Form } from './Form'
// @ts-expect-error no types
import styles from './HomePage.module.css'

import './HomePage.css'

// TODO (RSC) Something like this will probably be needed
// const RwRscGlobal = import.meta.env.PROD ? ProdRwRscServerGlobal : DevRwRscServerGlobal;

globalThis.rwRscGlobal = new ProdRwRscServerGlobal()

const HomePage = ({ name = 'Anonymous' }) => {
  return (
    <div className="home-page">
      {/* TODO (RSC) <Assets /> should be part of the router later */}
      <Assets />
      <div style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}>
        <h1 className={styles.title}>Hello {name}!!</h1>
        <Form onSend={onSend} />
      </div>
    </div>
  )
}

export default HomePage
