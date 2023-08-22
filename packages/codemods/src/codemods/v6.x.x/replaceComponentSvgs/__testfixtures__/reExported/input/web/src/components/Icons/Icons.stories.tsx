// Pass props to your component by passing an `args` object to your story
//
// ```jsx
// export const Primary: Story = {
//  args: {
//    propName: propValue
//  }
// }
// ```
//
// See https://storybook.js.org/docs/react/writing-stories/args.

import type { Meta, StoryObj } from '@storybook/react'

import Icons from './Icons'

const meta: Meta<typeof Icons> = {
  component: Icons,
}

export default meta

type Story = StoryObj<typeof Icons>

export const Primary: Story = {}
