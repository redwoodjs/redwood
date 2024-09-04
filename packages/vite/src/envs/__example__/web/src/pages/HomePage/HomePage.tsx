import React from 'react'

const HomePage = () => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'monospace',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            borderRight: '1px solid black',
            paddingRight: '2em',
            marginRight: '2em',
          }}
        >
          <h1>200</h1>
        </div>
        <div>
          <h1>Welcome home</h1>
        </div>
      </div>
    </div>
  )
}

export default HomePage
