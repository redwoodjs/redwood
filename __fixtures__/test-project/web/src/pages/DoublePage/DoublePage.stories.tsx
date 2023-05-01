import type { ComponentMeta } from '@storybook/react'

import DoublePage from './DoublePage'

export const generated = () => {
  return <DoublePage />
}

export default {
  title: 'Pages/DoublePage',
  component: DoublePage,
} as ComponentMeta<typeof DoublePage>
