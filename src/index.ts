// @ts-check

const SwaggerParser = require("@apidevtools/swagger-parser");
const defaultOpts = require("../config.json");

interface Options {
    yamlPath: String | Function;
    overRideError: Function;
}

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup({yamlPath, overRideError}: Options) : Function{

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
  
  return middleware.bind({yamlPathSt, apiSpecPr})
} // END fileTaileSetup

//=====================================================
//========================================== middleware
//=====================================================

function middleware(req, res, next) {

  const { yamlPathSt, apiSpecPr } = this 
  
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

  const errorHandler = err => {
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

  res.send = (...args) => {
    data.resBody = args[0]
    return stashFnCalls.send(...args)
  }
  res.json = (...args) => {
    data.resBody = args[0]
    return stashFnCalls.json(...args)
  }
  res.end = (...args) => {
    data.finishedAt = new Date()
    try {
    // TODO: may need to buffer the responce..
    // as we can override the responce with out
    // warning about app sending data down the wire
        after(specificScama, data)
        return stashFnCalls.end(...args)
    } catch(err) {
        errorHandler(err);
    }
  } // END res.end
  
//++++++++++++++++++++++++++++++++++ get ref for scama
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  
  apiSpecPr.then(paths => {
    specificScama = before(paths[data.url] || null, data)
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

    const contentType = headers["Content-Type"]
    
//++++++++++++++++++++++ check body is the right shape
//++++++++++++++++++++++++++++++++++++++++++++++++++++
    const { reqBody } = data

//++++++++++++++++++ check accept type can be returned
//++++++++++++++++++++++++++++++++++++++++++++++++++++

    const { accept } = headers
    
    return scamaVerb
    
} // END before

//=====================================================
//=========================== validate AFTER controller
//=====================================================

function after(specificScama, data){

    const { statusCode, accept, resBody } = data
    
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