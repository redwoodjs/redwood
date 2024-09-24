import { Metadata } from '@redwoodjs/web/Metadata'

import EditBlogPostCell from 'src/components/EditBlogPostCell'

import './EditBlogPostPage.css'

const EditBlogPostPage = ({ slug }) => {
  return (
    <div className="edit-blog-post-page">
      <Metadata title="EditBlogPost" description="EditBlogPost page" />

      <h1>EditBlogPostPage</h1>
      <EditBlogPostCell slug={slug} />
    </div>
  )
}

export default EditBlogPostPage
