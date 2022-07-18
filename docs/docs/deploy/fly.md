# Deploy to Fly.io


Fly.io allows you to run your full stack apps (and databases!) all over the world. No ops required. A simple Redwood app can run permanently (no time limits) on the Fly free tier with a 1GB Postgresql database, or a 1GB dedicated storage volume for SQLite.

## FLy.io tl;dr Deploy

If you simply want to experience the Fly.io deployment process, including a Postgres or SQLite database, you can do the following:
1. Create a new redwood project: `yarn create redwood-app ./fly-redwood-deploy`
2. Run `yarn rw setup deploy fly`. If you haven't gotten setup on Fly.io yet, this command will point you to the right place.
3. Run `fly launch`. This command will prompt you for some settings, and ask if you want to launch a Postgresql database. If you haven't setup your app locally for Postgresql, just reply 'no' and you'll get started with SQLite.
4. follow the [Fly.io Redwood Deploy Docs](https://fly.io/docs/getting-started/redwood/) for detailed instructions
