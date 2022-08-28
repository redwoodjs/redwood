import type { ComponentMeta } from '@storybook/react'

import AboutPage from './AboutPage'

export const generated = () => {
  return <AboutPage />
}

export default {
  title: 'Pages/AboutPage',
  component: AboutPage,
} as ComponentMeta<typeof AboutPage>
