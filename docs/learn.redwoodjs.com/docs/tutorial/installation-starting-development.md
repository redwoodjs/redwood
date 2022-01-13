---
id: installation-starting-development
title: "Installation & Starting Development"
sidebar_label: "Installation & Starting Development"
---

We'll use yarn ([yarn](https://yarnpkg.com/en/docs/install) is a requirement) to create the basic structure of our app:

    yarn create redwood-app ./redwoodblog

You'll have a new directory `redwoodblog` containing several directories and files. Change to that directory and let's create the database, and then start the development server:

    cd redwoodblog
    yarn redwood dev

A browser should automatically open to http://localhost:8910 and you will see the Redwood welcome page:

![Redwood Welcome Page](https://user-images.githubusercontent.com/300/73012647-97a43d00-3dcb-11ea-8554-42df29c36e4a.png)

> Remembering the port number is as easy as counting: 8-9-10!

### First Commit

Now that we have the skeleton of our Redwood app in place, it's a good idea to save the current state of the app as your first commit...just in case.

    git init
    git add .
    git commit -m 'First commit'

