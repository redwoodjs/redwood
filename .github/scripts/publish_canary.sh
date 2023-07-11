#!/bin/bash
#
# Used in the publish-canary.yml GitHub Action workflow.

echo "//registry.npmjs.org/:_authToken=${NPM_AUTH_TOKEN}" > .npmrc

TAG='canary' && [[ "$GITHUB_REF_NAME" = 'next' ]] && TAG='next'
echo "Publishing $TAG"

args=()

if [[ "$GITHUB_REF_NAME" = 'main' ]]; then
  args+=(premajor)
fi

args+=(
  --include-merged-tags
  --canary
  --exact
  --preid "$TAG"
  --dist-tag "$TAG"
  --force-publish
  --loglevel verbose
  --no-git-reset
)

# `echo 'n'` to answer "no" to the "Are you sure you want to publish these
#   packages?" prompt.
# `|&` to pipe both stdout and stderr to grep. Mostly do this keep the github
#   action output clean.
# At the end we use awk to increase the commit count by 1, because we'll commit
#   updated package.jsons in the next step, which will increase increase the
#   final number that lerna will use when publishing the canary packages.
echo 'n' \
  | yarn lerna publish "${args[@]}" \
  |& grep '\-canary\.' \
  | tail -n 1 \
  | sed 's/.*=> //' \
  | sed 's/\+.*//' \
  | awk -F. '{ $NF = $NF + 1 } 1' OFS=. \
  > canary_version

sed "s/\"@redwoodjs\/\(.*\)\": \".*\"/\"@redwoodjs\/\1\": \"$(cat canary_version)\"/" \
  packages/create-redwood-app/templates/js/package.json > tmpfile \
  && mv tmpfile packages/create-redwood-app/templates/js/package.json
sed "s/\"@redwoodjs\/\(.*\)\": \".*\"/\"@redwoodjs\/\1\": \"$(cat canary_version)\"/" \
  packages/create-redwood-app/templates/js/api/package.json > tmpfile \
  && mv tmpfile packages/create-redwood-app/templates/js/api/package.json
sed "s/\"@redwoodjs\/\(.*\)\": \".*\"/\"@redwoodjs\/\1\": \"$(cat canary_version)\"/" \
  packages/create-redwood-app/templates/js/web/package.json > tmpfile \
  && mv tmpfile packages/create-redwood-app/templates/js/web/package.json

sed "s/\"@redwoodjs\/\(.*\)\": \".*\"/\"@redwoodjs\/\1\": \"$(cat canary_version)\"/" \
  packages/create-redwood-app/templates/ts/package.json > tmpfile \
  && mv tmpfile packages/create-redwood-app/templates/ts/package.json
sed "s/\"@redwoodjs\/\(.*\)\": \".*\"/\"@redwoodjs\/\1\": \"$(cat canary_version)\"/" \
  packages/create-redwood-app/templates/ts/api/package.json > tmpfile \
  && mv tmpfile packages/create-redwood-app/templates/ts/api/package.json
sed "s/\"@redwoodjs\/\(.*\)\": \".*\"/\"@redwoodjs\/\1\": \"$(cat canary_version)\"/" \
  packages/create-redwood-app/templates/ts/web/package.json > tmpfile \
  && mv tmpfile packages/create-redwood-app/templates/ts/web/package.json

git config user.name "GitHub Actions"
git config user.email "<>"

git commit -am "Update create-redwood-app templates to use canary packages"

args+=(--yes)
yarn lerna publish "${args[@]}"
