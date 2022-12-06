# Skeleton

## Overview

This package is intended to provide an interface to inspect the core components of a redwood project. It is intended to be used solely within the framework and should not be exposed for users to use within their individual redwood projects.

The core feature of this package is an AST based extraction of the properties of various redwood project constituents - cells, routes, etc. - with the ability to easily and efficently access variable levels of data, from fully analysed projects to only certain constituent parts. Eg. getting the fully analysed redwood project versus getting only the cells.

Currently the package uses caching of redwood projects to increase efficiency and avoid unneeded reprocessing of the AST if possible. Options to not use any cached results or force a reprocessing are provided to flexibility.

## Note
This package, including the README, is under development at this time.

## Structure package deprecation
This skeleton package will replace the introspection features of the existing structure package which is to be deprecated. Progress of replacing of structure to skeleton is documented below.

### CLI Package (100%)
1. The check command
    * Structure: Uses the diagnostics functionality to list out redwood errors/warnings.
    * Skeleton: Contains `printWarnings` and `printErrors` functions for each component and for the project as a whole. Using `printWarnings` and `printErrors` from a `RedwoodProject` (which can cascade down all project components) should be able to provide equivalent or greater diagnostic messages to the user.
    * Complete: Yes.
2. Generator/Destroy commands for obtaining GraphQL query names
    * Structure: Extracts all cells to get a list of current GraphQL query names.
    * Skeleton: Supports extracting all cells and thier GraphQL query names.
    * Complete: Yes.
2. Prerender command
    * Structure: Is used within prerender to determine all the routes.
    * Skeleton: Supports the same functionality.
    * Complete: Yes.

### Prerender Package (100%)
1. Getting all prerendered routes
    * Structure: Lists all routes with appropriate properties to filter out only prerender routes.
    * Skeleton: Has an initial route parsing implementation which could provide the necessary functionality.
    * Complete: Yes.

### Internal Package (50%)
1. babel_plugin_redwood_mock_cell_data
    * Structure: Can list all cells and their details
    * Skeleton: Supports the same functionality
    * Complete: No, can implement when skeleton is more mature.
2. Duplicate route detection
    * Structure: Can list all routes
    * Skeleton: Supports the same functionality
    * Complete: Yes.

### Telemetry Package (0%)
1. Telemetry
    * Structure: Can list all: routes, services, cells, pages and sides
    * Skeleton: Supports an initial implementation for cells, routes, pages and sides
    * Complete: No, must wait until skeleton is more mature and supports services at least.
