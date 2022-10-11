// @ts-check

const SwaggerParser = require("@apidevtools/swagger-parser");
const defaultOpts = require("../config.json");
const flattenObj = require("./utils/flattenObj");
const args2Arr = require("./utils/args2Arr");
const matchUrl = require("./utils/match");
const path = require('path');
const fs = require('fs')
const decodedJwt = true
interface Options {
    yamlPath: String | Function;
    overRideError: Function;
    operations: Object;
}

const errMessages = {
  dev:{
    missingJWTtoken:"No authorization token provided",
    notJWTBearer:"token dont not start with 'bearer: '",
    urlNotInYaml:({url,yamlPathSt})=>`${url} was NOT in ${yamlPathSt}`,
    badJWTFunctionOutput:`The JWT parce function did not return an oject`,
    missingArgs:"Missing required query argument.",
    unknowenArgs:"Unknowen query argument.",
    missingJWTFunction:optId=>`No function with "${optId}" could be found for parcing JWTs`,
    notFound:({url,verb,scamaForEndPoint})=>`${url} ${verb.toUpperCase()} was not found. Only "${Object.keys(scamaForEndPoint).join(",").toUpperCase()}" should be used`,
    responseContentTypeMismatch:content=>`Could not find a matching type. Available types are ${Object.keys(content)}`,
    statusCodeNotFound:({statusCode,codes})=>`StatusCode ${statusCode} was not found. Available codes are ${codes}`
  },
  prod:{
    badOptionYamlPath:yamlPath=>"yamlPath is not validate: "+JSON.stringify(yamlPath),
    default:"There was a problem with your request. Please check your API spec",
    badJWTFunctionOutput:`Could not parce JWT`,
    missingJWTFunction:`Could not parce JWT`,
    responseContentTypeMismatch:`Could not find a matching type.`
  }
} // errMessages

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup({yamlPath, overRideError, operations, dev, decodedJwt}: Options) : Function{

  //const console = {log:()=>{},warn:()=>{},error:()=>{}}
  let yamlPathSt = defaultOpts.yamlPath

//+++++++++++++++++++++++++++++++++++++++++ genMessage
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const genMessage = (key,data) =>{
    // default
    let mess = errMessages.prod[key]
    // if dev.. then dev message
    if(dev && errMessages.dev[key]){
      mess = errMessages.dev[key]
    }
//console.log(`typeof mess = ${typeof mess}`,mess)
    if("function" === typeof mess){
//console.log(` >>> `,mess(data))
      return mess(data)
    }
    return mess || errMessages.prod.default
  } // END genMessage


//++++++++++++++++++++++++++++ check user set yamlPath
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  if(yamlPath){
    if ("function" === typeof yamlPath) {
        yamlPathSt = yamlPath()
    } else if ("string" === typeof yamlPath) {
        yamlPathSt = yamlPath
    }
    if ("string" !== typeof yamlPathSt) {
      throw new Error(genMessage("badOptionYamlPath",yamlPath))//"yamlPath is not validate: "+JSON.stringify(yamlPath))
    }
    if(yamlPathSt.startsWith(".")){

      const callerFile = new Error("").stack
                                .split("\n")[2]
                                .split("(").pop()
                                .split(":")[0]

      const callerDir = path.dirname(callerFile)

      yamlPathSt = path.resolve(callerDir,yamlPathSt)
    }

  } else if (process.env && process.env.API_YAML) {
    yamlPathSt = process.env.API_YAML
  } // END else if

//++++++++++++++++++++++++++++++++++ read in yaml file
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  // TODO: Should we catch or crash if spce is not found?
  const apiSpecPr = SwaggerParser.validate(yamlPathSt)

  return middleware.bind({
    genMessage,
    decodedJwt,
    yamlPathSt,
    apiSpecPr,
    dev,
    operationsFn:flattenObj(operations || {})
  }) // END middleware.bind
} // END fileTaileSetup

//=====================================================
//========================================== middleware
//=====================================================

function middleware(req, res, next) {

  //console.log(` -X- ${req.method}:${req.originalUrl}`)
  const {
    genMessage,
    yamlPathSt,
    apiSpecPr,
    operationsFn,
    dev,
    decodedJwt
  } = this
  // .then(({paths})=>paths);

  const data = {
      yamlPathSt,
      verb: req.method.toLowerCase(),
      url: req.originalUrl.split("?")[0],
      resBody:false,
      reqBody:req.body,
      startedAt:new Date(),
      finishedAt:false,
      statusCode: res.statusCode,
      headers:req.headers,
      params: req.params,
      query:req.query,
      status:200
    }

    if(dev){
      if(data.url.startsWith("/firetail")){
        if("/firetail/apis.json" === data.url){
            apiSpecPr.then(api=>res.json(api.paths))
                     .catch(err=>{
                       console.error(err)
                       res.status(500).send(err.message||err)
                     })
            return;
        }/*
        let filePath = "index.html"
        switch(data.url){
          case "/firetail/client.js":
            filePath = "client.js"
            break;
          case "/firetail/apis.json":
            apiSpecPr.then(res.json())
                     .catch(err=>res.status(500).json(err))
            return;
            break;
        }*/
        const filePath = "/firetail/client.js" === data.url ? "client.js"
                                                            : "index.html"
        fs.readFile(
          path.resolve(__dirname,"../src/ui/",filePath),
          "utf8",
          function(err,page){
            if(err){
              data.status = 500
              res.status(500).send(err)
            }else{
              res.send(page)
            }
          }) // END fs.readFile
        return
      }
    } // END if dev


  let specificScama;

//++++++++++++++++++++++++++++++++++++++ error handler
//++++++++++++++++++++++++++++++++++++++++++++++++++++

let errorHandlerCalled = false
  const errorHandler = err => {

  //  console.error("-> "err, new Error().stack)

    if(errorHandlerCalled){
      console.error("errorHandler was already called")
      return
    }

    errorHandlerCalled = true;

    const isUI = (req.get('Referrer')||"").endsWith("/firetail")

    let defaultErrorVal = {
      firetail:"default",
      status: err.status || 500,
      message:genMessage("default"),
      error:undefined
    }

    if(err.firetail && ! err.message){
      err.message = genMessage(err.firetail,err.val)
    }

    if(dev && isUI){
      defaultErrorVal.error = {
        message:err.message,
        stack:err.stack
      }
    } else if(dev){
      defaultErrorVal.message = err.message || err
    }

    const errContent = "function" === typeof overRideError ? overRideError(err)
                                                           : defaultErrorVal

      data.status = errContent.status || defaultErrorVal.status)
    //  console.log(data)
    //  console.log(errContent.status, defaultErrorVal.status)
    res.status(errContent.status || defaultErrorVal.status)

    stashFnCalls["object" === typeof errContent ? "json"
                                                : "send"](errContent)
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



  // Convert both dates to milliseconds
  var date1_ms = data.startedAt.getTime();
  var date2_ms = data.finishedAt.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;
  //console.log(`[${data.status}] ${req.method}:${req.originalUrl} - ${difference_ms/1000}sec`)
    try {
    // TODO: may need to buffer the responce..
    // as we can override the responce with out
    // warning about app sending data down the wire
        if (specificScama) {
            after(specificScama, data, genMessage
        }
        return stashFnCalls.end.apply(res, args)
    } catch(err) {
        errorHandler(err);
    }
  } // END res.end

//++++++++++++++++++++++++++++++++++ get ref for scama
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  apiSpecPr.then(({paths,components}) => {

      const matchFound = matchUrl(data.url,Object.keys(paths))

      let scamaForEndPoint = null
      if(matchFound){
        scamaForEndPoint = paths[matchFound.path]
        // We need to set the URL params as Express only adds them later
        Object.assign(data.params,matchFound.params)
      }/*console.log()
      console.log(paths)
      console.log()*/

      // Store specificScama as its needed in the "äfter" fn
      specificScama = before({scamaForEndPoint, data, genMessage})

      security({
        scamaVerb:specificScama,
        operationsFn,
        securitySchemes:components.securitySchemes,
        headers:data.headers,
        decodedJwt,
        req,
        genMessage
      })
  /*    if(scamaForEndPoint){
          const { verb } = data
          const scamaVerb = scamaForEndPoint[verb]
          //console.log("scamaVerb",scamaVerb)
          if(scamaVerb){*/
            const { operationId } = specificScama//scamaForEndPoint[data.verb]//scamaVerb
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
    /*if (specificScama) {
      throw err
    }*/
    errorHandler(err)
  }) // END catch

} // END middleware

//=====================================================
//======================== validate security controller
//=====================================================

function security({scamaVerb, operationsFn, securitySchemes,headers, decodedJwt, req, genMessage}){
//console.log("security",arguments)
  //++++++++ check caller has the right security headers
  //++++++++++++++++++++++++++++++++++++++++++++++++++++
/*
  console.log("X check caller has the right security headers")
  console.log(1)
  console.log("->",operationsFn)
  console.log(2)*/
  try{
    if(scamaVerb.security){
  //  console.log(3,scamaVerb.security)
      scamaVerb.security.forEach(sec=> {

      //  console.log(4,sec)
        Object.keys(sec).forEach(secName=> {

          //console.log(5,secName)
          if(securitySchemes[secName]){
          //console.log(6,securitySchemes[secName])
            const optName = securitySchemes[secName]["x-bearerInfoFunc"]
            if( ! headers.authorization){
          //  console.log(6.1,"")
              throw {
                  firetail:"missingJWTtoken",
                  status:401
              } // END throw
            } // if ! headers.authorization
            else if (! headers.authorization.toLowerCase().startsWith("bearer")){
                throw {
                    firetail:"notJWTBearer",
                    status:401
                } // END throw
            }
            //console.log(7,decodedJwt)
            if("function" === typeof decodedJwt){
              req.jwt = operationsFn[optName](decodedJwt(headers))
            }else if(decodedJwt){
                const token = headers.authorization.split(" ").pop().replace(/['"]+/g, '')
                const tokenDecodablePart = token.split('.')[1];
                const decoded = Buffer.from(tokenDecodablePart, 'base64').toString();
                req.jwt = operationsFn[optName](JSON.parse(decoded),token)
            }else if("function" === typeof operationsFn[optName]){
              req.jwt = operationsFn[optName](headers)
            } else {
              //console.log("missingJWTFunction -> ",genMessage("missingJWTFunction",optName))
              throw {
                  firetail:"missingJWTFunction",
                  status:401,
                  val:optName
              }
            }
            //console.log(typeof req.jwt, req.jwt,genMessage("badJWTFunctionOutput"))
            if("object" !== typeof req.jwt){
              throw {
                  firetail:"badJWTFunctionOutput",
                  status:401
              }
            }
            //console.log(8,req.jwt)
        } // END if securitySchemes[secName]
        }) // END forEach Object.keys
      }) // END forEach scamaVerb.security
    } // END if scamaVerb.security
  }catch(err){
    if(err.firetail){
      throw err
    }
  //  console.error(err)
    throw {
      message:err.message || err,
      status: 401
    }
  }
/*
  console.log()
  console.log(scamaVerb)
  console.log()
  console.log(securitySchemes)
  console.log()*/
}

//=====================================================
//========================== validate BEFORE controller
//=====================================================

function before({scamaForEndPoint,data,genMessage}){

    const { url } = data

//+++++++ check is there us a scama for that end-point
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    if ( ! scamaForEndPoint) {
        throw {
            firetail:"urlNotInYaml",
            status:400,
            val:data
        } // END throw
    } // END if

//+++++++++++++++++++++++++++++++++++++++++ check verb
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { verb } = data

    //console.log(Object.keys(scamaForEndPoint))
    const scamaVerb = scamaForEndPoint[verb]

    if ( ! scamaVerb) {
        throw {
            firetail:"notFound",
            status:404,
            val:{url,verb,scamaForEndPoint}
        } // END throw
    } // END if ! scamaVerb

//+++++++++++++++++++++ check Content-Type if has body
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { headers } = data
    const contentType = headers["Content-Type"]

//++++++++++++++++++++++++++++ check reqest parameters
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    if(scamaVerb.parameters){

      // We have to do this because of Babel or Typescript DUG!!
      function filterParameter(parameter){
         return this.type === parameter.in;
      }

//+++++++++++++++++++++++++++++ check params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

     const { params } = data;

     const pathNametoCheck = scamaVerb.parameters
                                    //.filter(({in})=>"query" === in) // Is giving a build Error 'var  = _a.in;'
                                      .filter(filterParameter.bind({type:"path"}));

      pathNametoCheck.forEach(({name, schema}) => {
        if(schema){
          data.params[name] = checkParameters(data.params[name],schema)
        }
      })

//+++++++++++++++++++++++++++++ query params are right
//++++++++++++++++++++++++++++++++++++++++++++++++++++

      const queryNametoCheck = scamaVerb.parameters
                                        .filter(filterParameter.bind({type:"query"}))
      /*
      if(queryNamesRecived.length !== queryNametoCheck.length){
        throw new Error(`Mismatch in number of query arguments. You sent too ${
                          queryNamesRecived.length > queryNametoCheck.length ? "many" : "few"}`)
      }*/
      const { query } = data

      let queryNamesRecived = Object.keys(query)
      //console.log(queryNamesRecived)
      queryNametoCheck.forEach(({required,name, schema}) => {
        if(required && ! queryNamesRecived.includes(name)){
          console.warn(name +" was not found as a named query ")
          throw {
              firetail:"missingArgs",
              status:400
            }
          //new Error("Missing required query argument.")
        }
        queryNamesRecived = queryNamesRecived.filter( queryName => queryName !== name)
        if(! schema){
          console.warn(`No schema for query: "${name}" ~ ${url}`)
        } else if(queryNamesRecived.includes(name)){
          data.query[name] = checkParameters(query[name],schema)
        }
      }) // END foreach
      //console.log(queryNamesRecived)
      if(queryNamesRecived.length){
        console.warn(queryNamesRecived.join() +" where pass")
        throw {
            firetail:"unknowenArgs",
            status:400
          }
        // new Error("unknowen query argument.")
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
        isErr = `"${val}" in the in the range of ${schema.enum.join()}`
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
      /*  console.log(resBody)
        console.log(response.content[contentKey])
        console.log("IS validate?")*/
      } else {
          throw {
              firetail:"responseContentTypeMismatch",
              status:400,
              val:response.content
          } // END throw
      } // END inner else
    } else {
      console.warn("No 'content' entry in Yaml")
    }
  } else {
     throw {
         firetail:"statusCodeNotFound",
         status:400,
         val:{
           statusCode,
           codes:Object.keys(specificScama.responses)
         }
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
