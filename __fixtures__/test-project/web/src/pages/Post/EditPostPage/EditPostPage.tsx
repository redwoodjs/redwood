import EditPostCell from 'src/components/Post/EditPostCell'

type PostPageProps = {
  id: number
}

const EditPostPage = ({ id }: PostPageProps) => {
  return <EditPostCell id={id} />
}

export default EditPostPage
