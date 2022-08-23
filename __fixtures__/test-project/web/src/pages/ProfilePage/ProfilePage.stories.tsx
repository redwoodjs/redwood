import type { ComponentStory } from '@storybook/react'

import ProfilePage from './ProfilePage'

export const generated: ComponentStory<typeof ProfilePage> = (args) => {
  return <ProfilePage {...args} />
}

export default { title: 'Pages/ProfilePage', component: ProfilePage }
