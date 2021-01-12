import React from 'react'

interface TestInterface {
  name?: string
}

const TestComponent = (props: TestInterface) => {
  return (
    <div>
      <h1>Hello world</h1>
      <p>This is the typescript compoenent</p>
    </div>
  )
}

export default TestComponent
