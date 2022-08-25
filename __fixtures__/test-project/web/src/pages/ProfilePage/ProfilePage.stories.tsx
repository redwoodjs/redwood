import type { ComponentMeta } from '@storybook/react'

import ProfilePage from './ProfilePage'

export const generated = () => {
  return <ProfilePage />
}

export default {
  title: 'Pages/ProfilePage',
  component: ProfilePage,
} as ComponentMeta<typeof ProfilePage>
