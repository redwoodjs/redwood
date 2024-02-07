import EditUserExampleCell from 'src/components/UserExample/EditUserExampleCell'

type UserExamplePageProps = {
  id: number
}

const EditUserExamplePage = ({ id }: UserExamplePageProps) => {
  return <EditUserExampleCell id={id} />
}

export default EditUserExamplePage
