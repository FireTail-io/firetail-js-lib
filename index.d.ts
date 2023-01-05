// Type definitions for firetail-api
// Project: https://www.npmjs.com/package/@public.firetail.io/firetail-api
// Definitions by: Brian Shannon <http://github.com/codemeasandwich>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

// How to ref the module that is exported ?
// How to name a "@public.firetail.io/firetail-api" ?
// How to conntent it to the libs packageJson OR is it just based on the name above?

type operation = {
  [key: string]:operation | function
}

type basic = {
  user:string,
  pass:string
}
type oauth2 = {
  authorization:string,
  scopes:object
}
type jwt_key = {
  authorization:string
}

function overRideError(err: object): object
function decodedJwt(headers:object):object
function authCallback(payload:basic|oauth2|jwt_key):boolean|object

interface firetailOpts {
  dev?:Boolean,
  specificationDir?:String,
  addApi:String,
  overRideError?:overRideError,
  operations?:operation,
  decodedJwt?:decodedJwt,
  authCallbacks:{
    [key: string]:authCallback
  }
}

function firetailSetup(firetailOpts):function

export = firetailSetup;
