import UserExampleServerCell from 'src/components/UserExample/UserExampleServerCell'

type UserExamplePageProps = {
  id: number
}

const UserExamplePage = ({ id }: UserExamplePageProps) => {
  return <UserExampleServerCell id={id} />
}

export default UserExamplePage
