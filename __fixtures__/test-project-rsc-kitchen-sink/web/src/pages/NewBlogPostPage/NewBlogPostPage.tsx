import { Metadata } from '@redwoodjs/web/Metadata'

import { savePost } from 'src/lib/actions'

import './NewBlogPostPage.css'

const NewBlogPostPage = () => {
  return (
    <div className="new-blog-post-page">
      <Metadata title="NewBlogPost" description="NewBlogPost page" />

      <h1>NewBlogPostPage</h1>
      <form action={savePost}>
        <label htmlFor="author">
          Author
          <input type="text" name="author" id="author" />
        </label>
        <label htmlFor="body">
          Body
          <textarea name="body" id="body"></textarea>
        </label>
        <button type="submit">Save</button>
      </form>
    </div>
  )
}

export default NewBlogPostPage
