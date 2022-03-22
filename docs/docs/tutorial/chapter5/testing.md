# Introduction to Testing

Let's run the test suite to make sure everything is working as expected (you can keep the dev server running and start this in a second terminal window):

```bash
yarn rw test
```

The `test` command starts a persistent process which watches for file changes and automatically runs any tests associated with the changed file(s) (changing a component *or* its tests will trigger a test run).

Since we just started the suite, and we haven't changed any files yet, it may not actually run any tests at all. Hit `a` to tell it run **a**ll tests and we should get a passing suite:

![image](https://user-images.githubusercontent.com/300/153299412-ba191f0b-27bf-4e56-8d23-fb462a4c69c9.png)

If you continued with your own repo from chapters 1-4, you may see some failures here: we made a lot of changes to the pages, components and cells we generated, but didn't update the tests to reflect the changes we made. (Another reason to start with the [example repo](#using-the-example-repo)!)

To switch back to the default mode where test are **o**nly run for changed files, press `o` now (or quit and restart `yarn rw test`).

This is always what we want to aim for—all green in that left column. In fact best practices tell us you should not even commit any code to your repo unless the test suite passes locally. Not everyone adheres to this policy quite as strictly as others...*&lt;cough, cough&gt;*

We've got an excellent document on [Testing](../../testing.md) which you should definitely read if you're brand new to testing, especially the [Terminology](../../testing.md#terminology) and [Redwood and Testing](../../testing.md#redwood-and-testing) sections.
