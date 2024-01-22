import ContactCell from 'src/components/Contact/ContactCell'

type ContactPageProps = {
  id: number
}

const ContactPage = ({ id }: ContactPageProps) => {
  return <ContactCell id={id} />
}

export default ContactPage
