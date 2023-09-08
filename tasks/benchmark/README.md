# Benchmark Task

This task is used to benchmark the performance of the Redwood api locally.

## Tests

The `tests` folder contains the k6 tests which will be executed to benchmark the api.

Please remember that these are run by the k6 program and so you can't treat them exactly like any old javascript file.

The tests should in most cases be hitting the `http://localhost:8911` endpoint as the test runner is running `yarn rw serve api` to start the api.

## Setups

The `setups` folder contains the setup scripts which will be executed before the tests are run to setup the correct environment.

These setup scripts should be in a named folder and contain a `setup.mts` file which will be executed to perform the setup. This file must export the following:
* A `setup` function which will be executed to perform the setup.
* A `validForTests` string array which contains the names of the tests which this setup is valid for.

## Running

To run the benchmark tests you can run the following command:

```bash
yarn benchmark
```

This will need the k6 program to be installed on your machine. You can find information about it here: https://k6.io/docs/getting-started/installation

Running the benchmarks will do the following:
* Create a temporary redwood test project within the `/tmp/redwood-benchmark` folder - or windows equivalent.
* Link the current state of your framework into the test project.
* Run each of the setup scripts in the `setups` folder and for each one:
  * Run the `setup` function.
  * Build the api side.
  * Start the api server.
  * Run each of the appropriate tests in the `tests` folder.
  * Stop the api server.
  * Reset the project to its original state.


**Filtering tests and setups**

You can filter the tests and setups which are run by passing command line arguments to the benchmark command.

To limit the setups which are run you can pass a list of setup names to the `--setup` argument. For example:

```bash
yarn benchmark --setup setup1 setup2
```

To limit the tests which are run you can pass a list of test names to the `--test` argument. For example:

```bash
yarn benchmark --test test1 test2
```

You can combine these like so:
```bash
yarn benchmark --setup setup1 setup2 --test test1 test2
```

By default all setups and tests will be run.
