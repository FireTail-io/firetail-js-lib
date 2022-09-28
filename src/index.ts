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
      params: req.params,
      query:req.query
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
    console.error(err)
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

      const matchFound = matchUrl(data.url,Object.keys(paths))

      let scamaForEndPoint = null
      if(matchFound){
        scamaForEndPoint = paths[matchFound.path]
        // We need to set the URL params as Express only adds them later
        Object.assign(data.params,matchFound.params)
      }

      // Store specificScama as its needed in the "äfter" fn
      specificScama = before(scamaForEndPoint, data)

  /*    if(scamaForEndPoint){
          const { verb } = data
          const scamaVerb = scamaForEndPoint[verb]
          //console.log("scamaVerb",scamaVerb)
          if(scamaVerb){*/
            const { operationId } = scamaForEndPoint[data.verb]//scamaVerb
            if(operationId){
              if(operationsFn[operationId]){
                req.params = req.params || {}
                // TODO: should this type conversion be extended to all the non-operationsFn ?
                Object.assign(req.params,data.params)
                Object.assign(req.query,data.query)
                next = ()=>operationsFn[operationId](req, res, next)
              } else {
                console.log(`No operationId match for ${operationId}`)
              }
            } // END if operationId
      /*    } // END if scamaVerb
      } */// END if scamaForEndPoint
    next()
  }) // END apiSpecPr.then
  .catch(err=> {
    // If specificScama is set then before was fine
    // and this error is coming from the app and not our problem
    if (specificScama) {
      throw err
    }
    errorHandler(err)
  }) // END catch

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
        } // END throw
    } // END if

//+++++++++++++++++++++++++++++++++++++++++ check verb
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { verb } = data

    //console.logo(Object.keys(scamaForEndPoint))
    const scamaVerb = scamaForEndPoint[verb]

    if ( ! scamaVerb) {
        throw {
            status:400,
            message:`${url} ${verb.toUpperCase()} was not found. Only "${Object.keys(scamaForEndPoint).join(",").toUpperCase()}" should be used`
        } // END throw
    } // END if ! scamaVerb

//++++++++ check caller has the right security headers
//++++++++++++++++++++++++++++++++++++++++++++++++++++

//+++++++++++++++++++++ check Content-Type if has body
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { headers } = data
    const contentType = headers["Content-Type"]


//++++++++++++++++++++++++++++ check reqest parameters
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    if(scamaVerb.parameters){

//+++++++++++++++++++++++++++++ check params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

     const { params } = data
     const pathNametoCheck = scamaVerb.parameters
                                      .filter(({in})=>"path" === in);

      pathNametoCheck.forEach(({name, schema}) => {
        if(schema){
          data.params[name] = checkParameters(data.params[name],schema)
        }
      })

//+++++++++++++++++++++++++++++ query params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      const queryNametoCheck = scamaVerb.parameters
                                        .filter(({in})=>"query" === in)
      /*
      if(queryNamesRecived.length !== queryNametoCheck.length){
        throw new Error(`Mismatch in number of query arguments. You sent too ${
                          queryNamesRecived.length > queryNametoCheck.length ? "many" : "few"}`)
      }*/
      const { query } = data

      let queryNamesRecived = Object.keys(query)
      queryNametoCheck.forEach(({required,name, schema}) => {
        if(required && ! queryNamesRecived.includes(name)){
          console.warn(name +" was not found as a named query ")
          throw new Error("Missing required query argument.")
        }
        queryNamesRecived = queryNamesRecived.filter( queryName => queryName !== name)
        if(schema){
          data.query[name] = checkParameters(data.query[name],schema)
        } else {
          console.warn(`No schema for query: "${name}" ~ ${url}`)
        }
      }) // END foreach
      if(queryNamesRecived.length){
        console.warn(queryNamesRecived.join() +" where pass")
        throw new Error("unknowen query argument.")
      }
    } // END if scamaVerb.parameters


//++++++++++++++++++++++ check body is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++
    const { reqBody } = data

//++++++++++++++++++ check accept type can be returned
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  //  const { accept } = headers

    return scamaVerb

} // END before

function checkParameters(val: string,schema){

  let isErr = ""

  /*


  Common Name	type	format	Comments
  integer	integer	int32	signed 32 bits
  long	integer	int64	signed 64 bits
  float	number	float
  double	number	double
  string	string
  byte	string	byte	base64 encoded characters
  binary	string	binary	any sequence of octets
  boolean	boolean
  date	string	date	As defined by full-date - RFC3339
  dateTime	string	date-time	As defined by date-time - RFC3339
  password	string	password	Used to hint UIs the input needs to be obscured.

  */
  switch(schema.type) {
    case "number":
    case "integer":
      let isok = true
      //format: int64
      const parcedVal = +val
      if(`${parcedVal}`!== val){
        isErr = `${val} is not a value number`
      }

      if( ! isErr
      && "minimum" in schema
      && schema.minimum > parcedVal){
        isErr = `${val} is below the minimum value`
      }

      if( ! isErr
      && "maximum" in schema
      && schema.maximum < parcedVal){
        isErr = `${val} is above the maximum value`
      }

      if( ! isErr
      && "integer" === schema.type
      && 0 < parcedVal % 1){
        isErr = `${val} is not a whole number`
      }

      if( ! isErr){
        return parcedVal
      }
      break;
    case "string":

      if( ! val){
        isErr = "No a valid string:"+JSON.stringify(val)
      }

      if( ! isErr
      &&   schema.enum
      && ! schema.enum.includes(val)){
        isErr = `"${val"} in the in the range of ${schema.enum.join()}`
      }

      if( ! isErr
      && schema.pattern){
        const patternRg = new RegExp(schema.pattern);
        if( ! patternRg.text(val)){
          isErr = `"${val}" didn't match ${schema.pattern}`
        }
      } // END pattern

      if(isok
      && schema.minLength
      && schema.minLength > val.length){
        isErr = `"${val}" is to shot.`
      }

      if(isok
      && schema.maxLength
      && schema.maxLength < val.length){
        isErr = `"${val}" is to long.`
      }

      // TODO: check schema.format //i.e. email, uuid ...

      if(! isErr){
        return val
      }

      break;
    case "boolean"
      if("string" === typeof val
      && ["false","true"].includes(val.toLowerCase()))
        return "true" === val.toLowerCase()
      break;
    case "object"

  //    break;
    case "array"
    // schema.items.type: string
  //    break;
    default:
      isErr = "Unknowen type: "+schema.type
      // code block
  }// END switch

  throw new Error(isErr)
}

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
    if(response.content){
      const contentKey = findAcceptContentKey(acceptTypes(accept),Object.keys(response.content))
      if (contentKey){
        console.log(resBody, response.content[contentKey], "IS validate?")
      } else {
          throw {
              status:400,
              message:`Could not find a matching type. Available types are ${Object.keys(response.content)}`
          } // END throw
      } // END inner else
    } else {
      console.warn("No 'content' entry in Yaml")
    }
  } else {
     throw {
         status:400,
         message:`StatusCode ${statusCode} was not found. Available codes are ${Object.keys(specificScama.responses)}`
     } // END throw
  } // END outter else

} // END after

//=====================================================
//============================================= HELPERS
//=====================================================
//======================================== accept Types
//=====================================================

function acceptTypes(acceptSt) {

  return acceptSt.split(",")
                 .map(type=>type.split(";")[0])

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
