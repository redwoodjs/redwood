import type { ComponentStory } from '@storybook/react'

import WaterfallPage from './WaterfallPage'

export const generated: ComponentStory<typeof WaterfallPage> = (args) => {
  return <WaterfallPage id={42} {...args} />
}

export default { title: 'Pages/WaterfallPage', component: WaterfallPage }
