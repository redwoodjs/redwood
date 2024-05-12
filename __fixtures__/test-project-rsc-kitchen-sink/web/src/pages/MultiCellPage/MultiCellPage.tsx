import { updateRandom } from 'src/components/RandomNumberServerCell/actions'
import RandomNumberServerCell from 'src/components/RandomNumberServerCell/RandomNumberServerCell'
import { UpdateRandomButton } from 'src/components/RandomNumberServerCell/UpdateRandomButton'

import './MultiCellPage.css'

const MultiCellPage = () => {
  return (
    <div className="multi-cell-page">
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
