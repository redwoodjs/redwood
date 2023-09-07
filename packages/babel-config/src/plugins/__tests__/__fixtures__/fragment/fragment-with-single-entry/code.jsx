const VoteButtons = (props) => {
  return (
    <div>{JSON.stringify(props)}</div>
  )
}

VoteButtons.fragments = {
  entry: gql`
    fragment VoteButtonsFragment on FeedEntry {
      score
      vote {
        choice
      }
    }
  `,
};

export default VoteButtons
