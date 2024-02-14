import EditEmptyUserCell from 'src/components/EmptyUser/EditEmptyUserCell'

type EmptyUserPageProps = {
  id: number
}

const EditEmptyUserPage = ({ id }: EmptyUserPageProps) => {
  return <EditEmptyUserCell id={id} />
}

export default EditEmptyUserPage
