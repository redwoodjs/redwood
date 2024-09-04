import React from 'react'

import { a } from 'virtual:redwoodjs-not-found-page'

import { Like } from '../Like.jsx'

import { Links } from './Links.jsx'

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      {a}
      <Links />
      <Like />
    </div>
  )
}
