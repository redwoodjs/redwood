# RedwoodJS: The Tutorial

Welcome to Redwood! If you haven't yet, check out the [Redwood README](https://github.com/redwoodjs/redwood/blob/main/README.md) to get a little background on why we created Redwood and the problems it's meant to solve. Redwood brings several existing technologies together for the first time into what we think is the future of database-backed single page applications.

:::info Sign up for tutorial reminders

There's a new JavaScript framework coming out every week, we know it can be hard to keep up. If you'd like some non-spammy emails reminding you to go through the tutorial, give us your email below:

<MailchimpForm />

:::

In this tutorial we're going to build a blog engine. In reality a blog is probably not the ideal candidate for a Redwood app: blog articles can be stored in a CMS and statically generated to HTML files and served as flat files from a CDN (the classic [Jamstack](https://jamstack.org/) use case). But as most developers are familiar with a blog, and it uses all of the features we want to demonstrate, we decided to build one anyway.

If you went through an earlier version of this tutorial you may remember it being split into parts 1 and 2. That was an artifact of the fact that most features demonstrated in part 2 didn't exist in the framework when part 1 was written. Once they were added we created part 2 to contain just those new features. Now that everything is integrated and working well we've moved each section into logically grouped chapters.

## Callouts

You'll find some callouts throughout the text to draw your attention:

:::tip

They might look like this...

:::

:::caution

or sometimes like this...

:::

:::danger

or maybe even like this!

:::

It's usually something that goes into more detail about a specific point, refers you to further reading, or calls out something important you should know. Here comes one now:

:::info

This tutorial assumes you are using version 5.0.0 or greater of RedwoodJS.

:::

Let's get started!

export const MailchimpForm = () => (
  <>
    <div id="mc_embed_signup">
      <form
        action="https://thedavidprice.us19.list-manage.com/subscribe/post?u=0c27354a06a7fdf4d83ce07fc&amp;id=a94da1950a"
        method="post"
        name="mc-embedded-subscribe-form"
        target="_blank"
      >
        <div style={{ position: 'absolute', left: '-5000px' }} aria-hidden="true">
          <input
            type="text"
            name="b_0c27354a06a7fdf4d83ce07fc_a94da1950a"
            tabIndex="-1"
            defaultValue=""
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justify: 'center' }}>
          <input
            type="email"
            defaultValue=""
            placeholder="Email Address"
            required={true}
            name="EMAIL"
            style={{  width: '100%', padding: '0.75rem', border: '1px solid #cccccc', borderRadius: '0.25rem', fontSize: '100%' }}
          />
          <input
            type="submit"
            value="Subscribe"
            name="subscribe"
            style={{ cursor: 'pointer', marginLeft: '0.5rem', padding: '0.8rem 2rem', fontSize: '100%', fontWeight: 'bold', color: '#ffffff', backgroundColor: '#4cb3d4', border: 'none', borderRadius: '0.25rem' }}
          />
        </div>
      </form>
    </div>
  </>
)

