// @ts-check

const SwaggerParser = require("@apidevtools/swagger-parser");
const defaultOpts = require("../config.json");
const flattenObj = require("./utils/flattenObj");
const args2Arr = require("./utils/args2Arr");
const matchUrl = require("./utils/match");

interface Options {
    yamlPath: String | Function;
    overRideError: Function;
    operations: Object;
}

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup({yamlPath, overRideError, operations}: Options) : Function{

  let yamlPathSt = defaultOpts.yamlPath

//++++++++++++++++++++++++++++ check user set yamlPath
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  if ("string" === typeof yamlPath) {
      yamlPathSt = yamlPath
  } else if ("function" === typeof yamlPath) {
      yamlPathSt = yamlPath()
  } else if (process.env && process.env.API_YAML) {
    yamlPathSt = process.env.API_YAML
  }

//++++++++++++++++++++++++++++++++++ read in yaml file
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  // TODO: Should we catch or crash if spce is not found?
  const apiSpecPr = SwaggerParser.validate(yamlPathSt)
                                 .then(({paths})=>paths);

  return middleware.bind({yamlPathSt, apiSpecPr, operationsFn:flattenObj(operations || {})})
} // END fileTaileSetup

//=====================================================
//========================================== middleware
//=====================================================

function middleware(req, res, next) {

  const { yamlPathSt, apiSpecPr, operationsFn } = this

  const data = {
      yamlPathSt,
      verb: req.method.toLowerCase(),
      url: req.originalUrl,
      resBody:false,
      reqBody:req.body,
      startedAt:new Date(),
      finishedAt:false,
      statusCode: res.statusCode,
      headers:req.headers,
      params: req.params
    }

  let specificScama;

//++++++++++++++++++++++++++++++++++++++ error handler
//++++++++++++++++++++++++++++++++++++++++++++++++++++

let errorHandlerCalled = false
  const errorHandler = err => {

    if(errorHandlerCalled){
      console.error("errorHandler was already called")
      return
    }
    errorHandlerCalled = true;
    const errContent = "function" === typeof overRideError ? overRideError(err) : err

    res.status(err.status)
    stashFnCalls["object" === typeof errContent ? "json" : "send"](errContent)
    stashFnCalls.end()
  } // END errorHandler

//+++++++++++++++++++++++++++++++++++++++++++ stash fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  const stashFnCalls = {
     end  : res.end.bind(res),
     send : res.send.bind(res),
     json : res.json.bind(res)
  } // END stashFnCalls

//+++++++++++++++++++++++++++++++++++++ hi-jack res fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  res.send = function() {
    const args = args2Arr(arguments)
    data.resBody = args[0]
    return stashFnCalls.send.apply(res, args)
  }
  res.json = function() {
    const args = args2Arr(arguments)
    data.resBody = args[0]
    return stashFnCalls.json.apply(res, args)
  }
  res.end = function() {
    const args = args2Arr(arguments)
    data.finishedAt = new Date()
    try {
    // TODO: may need to buffer the responce..
    // as we can override the responce with out
    // warning about app sending data down the wire
        if (specificScama) {
            after(specificScama, data)
        }
        return stashFnCalls.end.apply(res, args)
    } catch(err) {
        errorHandler(err);
    }
  } // END res.end

//++++++++++++++++++++++++++++++++++ get ref for scama
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  apiSpecPr.then(paths => {

//console.log(data.url,Object.keys(paths))

    const scamaForEndPoint = paths[data.url]

    specificScama = before(scamaForEndPoint || null, data)

    if(scamaForEndPoint){
        const { verb } = data
        const scamaVerb = scamaForEndPoint[verb]
        //console.log("scamaVerb",scamaVerb)
        if(scamaVerb){
          const { operationId } = scamaVerb
          if(operationId){
            if(operationsFn[operationId]){
              next = ()=>operationsFn[operationId](req, res, next)
            } else {
              console.log(`No operationId match for ${operationId}`)
            }
          }
        }
    }
    next()
  }) // END apiSpecPr.then
  .catch(err=> {
    // If specificScama is set then before was fine
    // and this error is coming from the app and not our problem
    if (specificScama) {
      throw err
    }
    errorHandler(err)
  })

} // END middleware

//=====================================================
//========================== validate BEFORE controller
//=====================================================

function before(scamaForEndPoint,data){

    const { url } = data

//+++++++ check is there us a scama for that end-point
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    if ( ! scamaForEndPoint) {
        throw {
            status:400,
            message:`${url} was NOT in ${data.yamlPathSt}`
        }
    }

//+++++++++++++++++++++++++++++++++++++++++ check verb
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { verb } = data
    const scamaVerb = scamaForEndPoint[verb]

    if ( ! scamaVerb) {
        throw {
            status:400,
            message:`${url} ${verb} was not found. Only "${Object.keys(scamaForEndPoint).join(",").toUpperCase()}" should be used`
        }
    }

//++++++++ check caller has the right security headers
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//+++++++++++++++++++++ check Content-Type if has body
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { headers } = data
    const contentType = headers["Content-Type"]

//++++++++++++++++++++++ check body is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++
    const { reqBody } = data

//++++++++++++++++++ check accept type can be returned
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  //  const { accept } = headers

    return scamaVerb

} // END before

//=====================================================
//=========================== validate AFTER controller
//=====================================================

function after(specificScama, data){

const { statusCode, headers: { accept } , resBody } = data

// check return Content-Type is in callers accept type
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//+++++++++++++++ check return data is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//++++++++++++++++++++++++ check stats code in in yaml
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const response = specificScama.responses[statusCode]

  if (response){
    const contentKey = findAcceptContentKey(acceptTypes(accept),Object.keys(response.content))
    if (contentKey){
      console.log(resBody, response.content[contentKey], "IS validate?")
    } else {
        throw {
            status:400,
            message:`Could not find a matching type. Available types are ${Object.keys(response.content)}`
        }
    }
  } else {
     throw {
         status:400,
         message:`StatusCode ${statusCode} was not found. Available codes are ${Object.keys(specificScama.responses)}`
     }
  }

} // END after

//=====================================================
//============================================= HELPERS
//=====================================================
//======================================== accept Types
//=====================================================

function acceptTypes(acceptSt) {

  return acceptSt.split(",").map(type=>type.split(";")[0])

  // TODO: Add support for "relative quality factor"
  /* The example
  ' Accept: audio/*; q=0.2, audio/basic '
  SHOULD be interpreted as "I prefer audio/basic, but send me any audio type if it is the best available after an 80% mark-down in quality."
  */
} // END acceptTypes

//=====================================================
//============================= find Accept Content Key
//=====================================================

function findAcceptContentKey(acceptTypes,acceptContent) {
    // TODO: check for "something/*"
    for (const acceptType of acceptTypes) {
      if ("*/*" === acceptType){
        return acceptContent[0]
      }
      if(acceptContent.includes(acceptType)) {
        return acceptType
      }
    } // END for
    return false
} // END findAcceptContentKey
