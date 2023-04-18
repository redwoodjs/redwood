import React from 'react'

import WarningPanel from '../Components/Panels/WarningPanel'

function App() {
  return (
    <div className="flex flex-col justify-center sm:py-4 mx-auto max-w-[97.5%] md:max-w-[90%] px-6 lg:px-8">
      <WarningPanel
        warning={{
          status: 404,
          message: `Unable to find anything cool to show you.`,
        }}
      />
    </div>
  )
}

export default App
