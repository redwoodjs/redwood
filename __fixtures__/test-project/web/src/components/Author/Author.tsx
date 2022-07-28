interface Props {
  author: {
    email: string
    fullName: string
  }
}

const Author = ({ author }: Props) => {
  return (
    <span>
      {author.fullName} ({author.email})
    </span>
  )
}

export default Author
