# Firetail JS Library

Frustrated with a lack of quality service level API tool? Firetail is here to help! firetail-JS is a middleware for **Express** and **Node** development. This document will cover setup and configuration. You can also find a complete working example, in the [sample](./sample) folder.

[![codecov](https://codecov.io/gh/FireTail-io/firetail-js-lib/branch/main/graph/badge.svg?token=BN44NPKV8H)](https://codecov.io/gh/FireTail-io/firetail-js-lib)

## What is Firetail Middleware?
Firetail is a Middleware that intercept Http/Rest requests based on [OpenAPI Specification](https://www.openapis.org/) (formerly known as Swagger Spec) of your API described in [YAML format](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#format). Firetail allows you to write an OpenAPI specification, then maps the endpoints to your Node functions. You can describe your REST API in as much detail as you want; then Firetail guarantees that it will work as you specified.

## Firetail Features
 * Validates requests and endpoint parameters automatically, based on your specification
 * Setup firetail configuration in your package.json or in your app at runtime
 * Helpful developer error messages
 * Automatically filter out sensitive values from responses based on your definitions
 * Can use Express **routes** or use dynamic functions with the `operation ID`

# How to Use

### Prerequisites
```Node v14+```
```Express v4+```

### Installing It
In your command line, type:

```
$ npm install --save firetail-js
```

### a HelloWorld
Place your API YAML inside the root path of your application. Then run:

```js
// ========== Lets import what we are going to need
const express = require('express')
const firetailSetup = require("firetail-js")
// ========== Create our server
const app = express()

// ========== setup request Body stash
app.use(
  express.raw({
    inflate: true, limit: '50mb', type: () => true, 
  }))

// ========== firetail options
const firetailOpts = { dev:true, addApi: "./swagger.yaml" }

// ========== install the firetail middleware
app.use(firetailSetup(firetailOpts))

// ========== Add the end-point you want
//...
app.get('/', (req, res) => {
  res.send("FireTail sample")
})
//... They should match whats in your YAML

const port = 3001
// ========== Start our server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
```

# Configuration options
  * `addApi`[String], 
  * `overRideError`[Function], 
  * `operations`[Object], 
  * `dev`[Boolean], 
  * `decodedJwt`[Function], 
  * `securities[Object]`, 
  * `specificationDir`[String], 
  * `customBodyDecoders`[Function]
