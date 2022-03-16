import EditContactCell from 'src/components/Contact/EditContactCell'

type ContactPageProps = {
  id: number
}

const EditContactPage = ({ id }: ContactPageProps) => {
  return <EditContactCell id={id} />
}

export default EditContactPage
