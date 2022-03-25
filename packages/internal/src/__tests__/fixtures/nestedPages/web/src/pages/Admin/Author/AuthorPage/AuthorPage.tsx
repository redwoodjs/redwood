import AuthorCell from 'src/components/Author/AuthorCell'

type AuthorPageProps = {
  id: number
}

const AuthorPage = ({ id }: AuthorPageProps) => {
  return <AuthorCell id={id} />
}

export default AuthorPage
