import { fragmentRegistry } from '@redwoodjs/web/apollo'
export const VoteButtons_Fragment_Entry = gql`
  fragment VoteButtonsFragment on FeedEntry {
    score
    vote {
      choice
    }
  }
`
fragmentRegistry.register(VoteButtons_Fragment_Entry)
