# Firetail JS Library

Frustrated with a lack of quality service level API tool? Firetail is here to help! [![npm version](https://badge.fury.io/js/@public.firetail.io%2Ffiretail-api.svg)](https://www.npmjs.com/package/@public.firetail.io/firetail-api) is a middleware for **Express** and **Node** development. This document will cover setup and configuration. You can also find a complete working example, in the [sample](./sample) folder.

[![Code Coverage](https://github.com/FireTail-io/firetail-js-lib/actions/workflows/codecov.yml/badge.svg)](https://github.com/FireTail-io/firetail-js-lib/actions/workflows/codecov.yml)
[![codecov](https://codecov.io/gh/FireTail-io/firetail-js-lib/branch/main/graph/badge.svg?token=BN44NPKV8H)](https://codecov.io/gh/FireTail-io/firetail-js-lib)
[![License](https://img.shields.io/pypi/l/firetail.svg)](https://github.com/FireTail-io/firetail-js-lib/blob/main/LICENSE.txt)


## What is Firetail Middleware?
Firetail is a Middleware that intercept Http/Rest requests based on [OpenAPI Specification](https://www.openapis.org/) (formerly known as Swagger Spec) of your API described in [YAML format](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md#format). Firetail allows you to write an OpenAPI specification, then maps the endpoints to your Node functions. You can describe your REST API in as much detail as you want; then Firetail guarantees that it will work as you specified.

## Firetail Features
 * Validates requests and endpoint parameters automatically, based on your specification
 * Setup firetail configuration in your package.json or in your app at runtime
 * Helpful developer error messages
 * Automatically filter out sensitive values from responses based on your definitions
 * Can use Express **routes** or use dynamic functions with the `operationId`

# How to Use

### Prerequisites

[![Node v14](http://img.shields.io/badge/node-v14+-darkgreen.svg)](https://nodejs.org) with [![Express v4+](http://img.shields.io/badge/Express-v4+-darkred.svg)](https://expressjs.com) or [![AWS Lamdba](https://img.shields.io/badge/AWS-Lamdba-orange.svg)](https://aws.amazon.com/lambda/)


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

# Configuration options. Configuration can be loaded in one of three ways.
  1. Via environment variables
  2. Inside the package.json under a "firetail" attribute
  3. Pass to the middleware at runtime as a configuration object

*Note: 1 & 2 can only reference static values. Where as the 3rd option can handle static and dynamic*

⚠️ The `addApi` is the only mandatory option that must be passed!

**Static values:**  

  * `addApi`[String]: The path to your openAPI YAML - *_this can be a relative or absolute path_
  * `specificationDir`[String]: The path to the directory where you will place controllers that map to the `operationId` for each endpoints referenced in your YAML
  * `dev`[Boolean]: This indicates what are the middleware should run in developer mode. Dev mode will  ~ _Default `false`_
    1) Give helpful error messages in your rest API as well as using the developer
    2) Log event will be sent to  your terminal. Instead of the firetail SAAS platform.

**Dynamic values:**  

  * `overRideError`[Function] (err): a callback to replace the generated firetail error with a custom error you can generate specific to your platform/interfaces
  * `operations`[Object]: an object, where the keys that will match with the `operationId`s and executed in the same way an Express route would be
  * `decodedJwt`[Function] (headers), Encodes the JWT token from the header. Returning the JWT as JSON
  * `authCallbacks[Object]` Each **key** in this object maps to a function, represents a security scheme that can be used in your end-points
  * `customBodyDecoders[Object]` Each **key** in this object maps to a function. This is used to parse an unknown `content-type` into JSON so the middleware can apply the rules outlined in YAML file.

## Examples: Dynamic Configuration

### overRideError
```js
  overRideError:(firetailErr)=>{
    const { status, message } = firetailErr
    if(404 === status){
        return "Looks like your lost"
    }
    return "Something broke"
  }
```
### operations
When an End-point match is found in the YMAL file + it contains a reference to an `operationId` a corresponding function should be included in the options.

Yaml file
```yaml
paths:
  /mydata:
    get:
      operationId: app.dataLoader
```
Node file
```js
  operations:{
    app:{
        dataLoader: (req,res)=>{
            //... end-point logic
        }
    }
  }
```
### authCallbacks
For each security schema used, you will need to provide a matching named function in the security object under options

Yaml file
```yaml
components:
  securitySchemes:
    jwt:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
Node file
```js
  authCallbacks:{
    jwt:(decodedJwtAsJSON)=>{
    const { authorization } = decodedJwtAsJSON
       //... run securitie logic
       // true if authenticated
       return false // true
    }
  }
```

### customBodyDecoders
The below example, shows how you would use an XML validation with the [xml2json](https://www.npmjs.com/package/xml2json) module

Yaml file
```yaml
paths:
  /my_pet:
    get:
      summary: read a pet
      responses:
        '200':
          content:
            application/xml:
              schema:
                $ref: '#/components/schemas/Pet'
```
Node file
```js
  customBodyDecoders:{
    'application/xml': stringBody => {
        return parseXmlString.toJson(stringBody,{object:true})
    }
  }
