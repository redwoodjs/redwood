"use client"

import React from 'react'

type RouterContextType = {
  path?: string;
}

export const RouterContext = React.createContext<RouterContextType>(undefined!);

export function useRouter() {
  return React.use(RouterContext)
}