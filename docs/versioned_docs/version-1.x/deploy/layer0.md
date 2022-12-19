# Deploy to Layer0

[Layer0](https://layer0.co) extends the capabilities of a traditional CDN by not only hosting your static content, but also providing server-side rendering for progressive web applications as well as caching both your APIs and HTML at the network edge to provide your users with the fastest browsing experience.

## Layer0 Deploy Setup

In order to deploy your RedwoodJS project to Layer0, the project must first be initialized with the Layer0 CLI.

1. In your project, run the command `yarn rw setup deploy layer0`.
2. Verify the changes to your project, commit and push to your repository.
3. Deploy your project to Layer0
  1. If this is your first time deploying to Layer0, the interactive CLI will prompt to authenticate using your browser. You can start the deploy by running `yarn rw deploy layer0`.
  2. If you are deploying from a **non-interactive** environment, you will need to create an account on [Layer0 Developer Console](https://app.layer0.co) first and setup a [deploy token](https://docs.layer0.co/guides/deploy_apps#section_deploy_from_ci). Once the deploy token is created, save it as a secret to your environment. You can start the deploy by running `yarn rw deploy layer0 --token=XXX`.
4. Follow the link in the output to view your site live once deployment has completed!

For more information on deploying to Layer0, check out the [documentation](https://docs.layer0.co).
