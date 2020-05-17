import React from 'react'

const routes = {}

export const Router = ({ children }) => {
  for (let route of React.Children.toArray(children)) {
    const { name } = route.props
    routes[name] = jest.fn(() => name)
  }

  return <></>
}

export { routes }
