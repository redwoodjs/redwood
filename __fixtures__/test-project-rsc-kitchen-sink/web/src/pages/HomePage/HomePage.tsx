import { RscForm } from '@tobbe.dev/rsc-test'

import { Counter } from '../../components/Counter/Counter'

import { onSend } from './actions'
import styles from './HomePage.module.css'

import './HomePage.css'

const HomePage = ({ name = 'Anonymous' }) => {
  return (
    <div className="home-page">
      <div style={{ border: '3px red dashed', margin: '1em', padding: '1em' }}>
        <h1 className={styles.title}>Hello {name}!!</h1>
        <RscForm onSend={onSend} />
        <Counter />
      </div>
    </div>
  )
}

export default HomePage
