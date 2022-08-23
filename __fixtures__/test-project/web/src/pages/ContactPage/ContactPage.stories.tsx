import type { ComponentStory } from '@storybook/react'

import ContactPage from './ContactPage'

export const generated: ComponentStory<typeof ContactPage> = (args) => {
  return <ContactPage {...args} />
}

export default { title: 'Pages/ContactPage', component: ContactPage }
