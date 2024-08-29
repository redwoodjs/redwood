'use client'

import React, { useState } from 'react'

export function Like() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count} +</button>
}
