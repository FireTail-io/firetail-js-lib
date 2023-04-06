# Firetail JS Library

Frustrated with a lack of quality service level API tool? Firetail is here to help! [![npm version](https://badge.fury.io/js/@public.firetail.io%2Ffiretail-api.svg)](https://www.npmjs.com/package/@public.firetail.io/firetail-api) is a middleware for **Express** and **Node** development. This document will cover setup and configuration. You can also find a complete working example, in the [sample](./sample) folder.

[![Code Coverage](https://github.com/FireTail-io/firetail-js-lib/actions/workflows/codecov.yml/badge.svg)](https://github.com/FireTail-io/firetail-js-lib/actions/workflows/codecov.yml)
[![codecov](https://codecov.io/gh/FireTail-io/firetail-js-lib/branch/main/graph/badge.svg?token=BN44NPKV8H)](https://codecov.io/gh/FireTail-io/firetail-js-lib)
[![License](https://img.shields.io/pypi/l/firetail.svg)](https://github.com/FireTail-io/firetail-js-lib/blob/main/LICENSE.txt)

## What is Firetail Middleware?

Firetail is a Middleware that intercept Http/Rest requests based on [OpenAPI Specification](https://www.openapis.org/) (formerly known as Swagger Spec) of your API described in [YAML format](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#format). Firetail allows you to write an OpenAPI specification, then maps the endpoints to your Node functions. You can describe your REST API in as much detail as you want; then Firetail guarantees that it will work as you specified.

## Firetail Features

-   Validates requests and endpoint parameters automatically, based on your specification
-   Setup firetail configuration in your package.json or in your app at runtime
-   Helpful developer error messages
-   Automatically filter out sensitive values from responses based on your definitions
-   Can use Express **routes** or use dynamic functions with the `operationId`
