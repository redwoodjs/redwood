import type { ComponentMeta } from '@storybook/react'

import ContactPage from './ContactPage'

export const generated = () => {
  return <ContactPage />
}

export default {
  title: 'Pages/ContactPage',
  component: ContactPage,
} as ComponentMeta<typeof ContactPage>
