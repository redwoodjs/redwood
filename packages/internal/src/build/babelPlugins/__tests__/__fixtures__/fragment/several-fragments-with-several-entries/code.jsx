VoteButtons.fragments = {
  entry: gql`
    fragment VoteButtonsFragment on FeedEntry {
      score
      vote {
        choice
      }
    }
  `,
  voter: gql`
    fragment VoterFragment on FeedEntry {
      voter {
        id
        name
      }
    }
  `,
};

AnotherVoteButtons.fragments = {
  entry: gql`
    fragment AnotherVoteButtonsFragment on FeedEntry {
      score
      vote {
        choice
      }
    }
  `,
  voter: gql`
    fragment AnotherVoterFragment on FeedEntry {
      voter {
        id
        name
      }
    }
  `,
};
