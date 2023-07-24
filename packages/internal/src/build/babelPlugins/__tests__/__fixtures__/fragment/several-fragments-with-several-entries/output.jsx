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
export const VoteButtons_Fragment2_Voter = gql`
  fragment VoterFragment on FeedEntry {
    voter {
      id
      name
    }
  }
`
fragmentRegistry.register(VoteButtons_Fragment2_Voter)
export const AnotherVoteButtons_Fragment3_Entry = gql`
  fragment AnotherVoteButtonsFragment on FeedEntry {
    score
    vote {
      choice
    }
  }
`
fragmentRegistry.register(AnotherVoteButtons_Fragment3_Entry)
export const AnotherVoteButtons_Fragment4_Voter = gql`
  fragment AnotherVoterFragment on FeedEntry {
    voter {
      id
      name
    }
  }
`
fragmentRegistry.register(AnotherVoteButtons_Fragment4_Voter)
