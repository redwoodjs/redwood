#!/bin/bash

# This script is for reference / debugging.

HEROKU_APP=APP_NAME

# yarn create redwood-app dev-redwood-app --typescript --no-yarn-install --overwrite --git
# cd $HEROKU_APP

heroku apps:destroy $HEROKU_APP --confirm $HEROKU_APP
heroku create $HEROKU_APP --manifest
heroku addons:create heroku-postgresql --app $HEROKU_APP
heroku buildpacks:add heroku/nodejs --app $HEROKU_APP
heroku buildpacks:add heroku-community/nginx --app $HEROKU_APP
heroku config:set YARN2_SKIP_PRUNING=true --app $HEROKU_APP

git add .
git commit -am "Add Heroku app"

heroku git:remote --app $HEROKU_APP
git push heroku main

heroku logs --tail --app $HEROKU_APP
