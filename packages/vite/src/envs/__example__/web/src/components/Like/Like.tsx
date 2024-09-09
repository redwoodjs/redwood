'use client'

import React, { useState } from 'react'

export function Like() {
  const [counter, setCounter] = useState(0)
  return <button onClick={() => setCounter(counter + 1)}>{counter} +</button>
}
