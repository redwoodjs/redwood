import EmptyUserCell from 'src/components/EmptyUser/EmptyUserCell'

type EmptyUserPageProps = {
  id: number
}

const EmptyUserPage = ({ id }: EmptyUserPageProps) => {
  return <EmptyUserCell id={id} />
}

export default EmptyUserPage
