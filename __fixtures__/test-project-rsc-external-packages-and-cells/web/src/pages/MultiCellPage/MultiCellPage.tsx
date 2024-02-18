import { Assets } from '@redwoodjs/vite/assets'
import { ProdRwRscServerGlobal } from '@redwoodjs/vite/rwRscGlobal'

import { updateRandom } from 'src/components/RandomNumberServerCell/actions'
import RandomNumberServerCell from 'src/components/RandomNumberServerCell/RandomNumberServerCell'
import { UpdateRandomButton } from 'src/components/RandomNumberServerCell/UpdateRandomButton'

import './MultiCellPage.css'

// TODO (RSC) Something like this will probably be needed
// const RwRscGlobal = import.meta.env.PROD ? ProdRwRscServerGlobal : DevRwRscServerGlobal;

globalThis.rwRscGlobal = new ProdRwRscServerGlobal()

const MultiCellPage = () => {
  return (
    <div className="multi-cell-page">
      {/* TODO (RSC) <Assets /> should be part of the router later */}
      <Assets />
      <div className="multi-cell-page-grid">
        <RandomNumberServerCell />
        <RandomNumberServerCell />
        <RandomNumberServerCell global />
        <RandomNumberServerCell global />
      </div>
      <h3>Update Random Number (client)</h3>
      <UpdateRandomButton />
      <h3>Update Random Number (server)</h3>
      <form action={updateRandom}>
        <button type="submit">Update</button>
      </form>
    </div>
  )
}

export default MultiCellPage
