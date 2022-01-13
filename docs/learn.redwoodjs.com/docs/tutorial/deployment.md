---
id: deployment
title: "Deployment"
sidebar_label: "Deployment"
---

Part 4 of the video tutorial picks up here:

> **Ancient Content Notice**
>
> These videos were recorded with an earlier version of Redwood and many commands are now out-of-date. If you really want to build the blog app you'll need to follow along with the text which we keep up-to-date with the latest releases.

<div class="video-container">
  <iframe src="https://www.youtube.com/embed/UpD3HyuZkvY?rel=0" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; modestbranding; showinfo=0" allowfullscreen></iframe>
</div>

The whole reason we started building Redwood was to make full-stack web apps easier to build and deploy on the Jamstack. While technically we already deployed in the previous section, it doesn't actually work yet. Let's fix that.

### The Database

We'll need a database somewhere on the internet to store our data. We've been using SQLite locally, but that's a file-based store meant for single-user. SQLite isn't really suited for the kind of connection and concurrency requirements a production website will require. For this part of this tutorial, we will use Postgres. (Prisma currently supports SQLite, Postgres and MySQL.) Don't worry if you aren't familiar with Postgres, Prisma will do all the heavy lifting. We just need to get a database available to the outside world so it can be accessed by our app.

First we'll let Prisma know that we intend to use Postgres instead of SQLite. Update the `provider` entry in `schema.prisma`:

```javascript
provider = "postgresql"
```

> **!!! Extremely Important Notice You Should Read !!!**
>
> Prisma only supports one database provider at a time, and since we can't use SQLite in production and *must* switch to Postgres or MySQL, that means we need to use the same database on our local development system after making this change. See our [Local Postgres Setup](https://redwoodjs.com/docs/local-postgres-setup) guide to get you started.

There are several hosting providers where you can quickly start up a Postgres instance:

- [Railway](https://railway.app/)
- [Heroku](https://www.heroku.com/postgres)
- [Digital Ocean](https://www.digitalocean.com/products/managed-databases)
- [AWS](https://aws.amazon.com/rds/postgresql/)

We're going to go with Railway for now because it's a) free and b) ridiculously easy to get started, by far the easiest we've found. You don't even need to create a login! The only limitation is that if you *don't* create an account, your database will be removed after seven days. But unless you *really* procrastinate that should be plenty of time to get through the rest of the tutorial!

Head over to Railway and click **Get Started**:

![image](https://user-images.githubusercontent.com/300/107562787-1fa2e380-6b95-11eb-90ba-02fea7925a05.png)

Now just follow the prompts. First, Cmd+k/Ctrl+k (depending on your OS):

![image](https://user-images.githubusercontent.com/300/107562945-495c0a80-6b95-11eb-9ba8-a294669d6cb4.png)

And now pick **Provision PostgreSQL**:

![image](https://user-images.githubusercontent.com/300/107562989-5c6eda80-6b95-11eb-944e-34b0ad49f4ea.png)

And believe it or not, we're done! Now we just need the connection URL. Click on **PostgreSQL** at the left, and then the **Connect** tab. Copy the Database URL snippet, the one that starts with `postgresql://`:

![image](https://user-images.githubusercontent.com/300/107562577-da7eb180-6b94-11eb-8731-e86a1c7127af.png)

 That's it for the database setup! Now to let Netlify know about it.

### Netlify

Go back to the main site page in Netlify and then to **Site settings** at the top, and then **Build & Deploy** > **Environment**. Click **Edit Variables** and this is where we'll paste the database connection URI we got from Railway (note the **Key** is "DATABASE_URL"). After pasting the value, append `?connection_limit=1` to the end. The URI will have the following format: `postgres://<user>:<pass>@<url>/<db>?connection_limit=1`.

![Adding ENV var](https://user-images.githubusercontent.com/300/83188236-3e834780-a0e4-11ea-8cfa-790c2e335a92.png)

> **Connection limit**
>
> When configuring a database, you'll want to append `?connection_limit=1` to the URI. This is [recommended by Prisma](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/deployment#recommended-connection-limit) when working with relational databases in a Serverless context.

Make sure to click the **Save** button. Now go over to the **Deploys** tab in the top nav and open the **Trigger deploy** dropdown on the right, then finally choose **Deploy site**:

![Trigger deploy](https://user-images.githubusercontent.com/300/83187760-835aae80-a0e3-11ea-9733-ff54969bba1f.png)

With a little luck (and SCIENCE) it will complete successfully! You can click the **Preview** button at the top of the deploy log page, or go back and click the URL of your Netlify site towards the top:

![Netlify URL](https://user-images.githubusercontent.com/300/83187909-bef57880-a0e3-11ea-97dc-e557248acd3a.png)

Did it work? If you see "Empty" under the About and Contact links then it did! Yay! You're seeing "Empty" because you don't have any posts in your brand new production database so head to `/admin/posts` and create a couple, then go back to the homepage to see them.

> If you view a deploy via the **Preview** button notice that the URL contains a hash of the latest commit. Netlify will create one of these for every push to `main` but will only ever show this exact commit, so if you deploy again and refresh you won't see any changes. The real URL for your site (the one you get from your site's homepage in Netlify) will always show the latest successful deploy. See [Branch Deploys](#branch-deploys) below for more info.

If the deploy failed, check the log output in Netlify and see if you can make sense of the error. If the deploy was successful but the site doesn't come up, try opening the web inspector and look for errors. Are you sure you pasted the entire Postgres connection string correctly? If you're really, really stuck head over to the [Redwood Community](https://community.redwoodjs.com) and ask for help.

### Branch Deploys

Another neat feature of Netlify is _Branch Deploys_. When you create a branch and push it up to your repo, Netlify will build that branch at a unique URL so that you can test your changes, leaving the main site alone. Once your branch is merged to `main` then a deploy at your main site will run and your changes will show to the world. To enable Branch Deploys go to **Site settings** > **Build & deploy** > **Continuous Deployment** and under the **Deploy contexts** section click **Edit settings** and change **Branch deploys** to "All". You can also enable _Deploy previews_ which will create them for any pull requests against your repo.

![Netlify settings screenshot](https://user-images.githubusercontent.com/30793/90886476-c1016780-e3b2-11ea-851a-3014257484fd.png)

> You also have the ability to "lock" the `main` branch so that deploys do not automatically occur on every push—you need to manually tell Netlify to deploy the latest, either by going to the site or using the [Netlify CLI](https://cli.netlify.com/).

### Database Concerns

#### Connections

In this tutorial, your serverless functions will be connecting directly to the Postgres database. Because Postgres has a limited number of concurrent connections it will accept, this does not scale—imagine a flood of traffic to your site which causes a 100x increase in the number of serverless function calls. Netlify (and behind the scenes, AWS) will happily spin up 100+ serverless Lambda instances to handle the traffic. The problem is that each one will open it's own connection to your database, potentially exhausting the number of available connections. The proper solution is to put a connection pooling service in front of Postgres and connect to that from your lambda functions. To learn how to do that, see the [Connection Pooling](https://redwoodjs.com/docs/connection-pooling) guide.

#### Security

Your database will need to be open to the world because you never know what IP address a serverless function will have when it runs. You could potentially get the CIDR block for ALL IP addresses that your hosting provider has and only allow connections from that list, but those ranges usually change over time and keeping them in sync is not trivial. As long as you keep your DB username/password secure you should be safe, but we understand this is not the ideal solution.

As this form of full-stack Jamstack gains more prominence we're counting on database providers to provide more robust, secure solutions that address these issues. Our team is working closely with several of them and will hopefully have good news to share in the near future!

