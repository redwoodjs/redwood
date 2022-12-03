# Skeleton

## Overview

This package is intended to provide an interface to inspect the core components of a redwood project. It is intended to be used solely within the framework and should not be exposed for users to use within their individual redwood projects.

The core requirements of this package are:
1. AST based extraction of the properties of various redwood constituents.
2. The ability to easily and efficently access variable levels of data, from fully analysed projects to only certain constituent parts. Eg. getting the fully analysed redwood project versus getting only the cells.
