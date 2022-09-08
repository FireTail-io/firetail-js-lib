// @ts-check

const SwaggerParser = require("@apidevtools/swagger-parser");
const defaultOpts = require("../config.json");

interface Options {
    yamlPath: String | Function;
}

//=====================================================
//==================================== file Taile Setup
//=====================================================

module.exports = function fileTaileSetup({yamlPath} : Options){

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
  const apiSpecPr = SwaggerParser.validate(yamlPathSt).then(({paths})=>paths);
  
  return middleware.bind({yamlPathSt, apiSpecPr})
} // END fileTaileSetup

//=====================================================
//========================================== middleware
//=====================================================

function middleware(req, res, next) {

  const { yamlPathSt, apiSpecPr } = this 
  const { method, originalUrl } = req
  
  let finishedAt, resBody, scama;
  const startedAt = new Date()
  
//+++++++++++++++++++++++++++++++++++++++++++ stash fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  
  const end  = res.end.bind(res)
  const send = res.send.bind(res)
  const json = res.json.bind(res)
  
//++++++++++++++++++++++++++++++++++++++ call Validate
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  const callValidate = () =>{
    if (finishedAt && undefined !== scama) {
      if (scama) {
          const scamaVerb = scama[method.toLowerCase()]
          if (scamaVerb) {
            const data = {
                verb: method,
                url: originalUrl,
                resBody,
                startedAt,
                finishedAt,
                statusCode: res.statusCode,
                headers:req.headers,
                params: req.params
              }
            console.log(req.get('Content-Type'))
            validate(scamaVerb, data)
          } else {
            console.log(`${originalUrl} ${method} was not found. Only "${Object.keys(scama).join(",").toUpperCase()}" should be used`)
          }
      } else {
        console.log(originalUrl + " was NOT in " + yamlPathSt)
      }
    } // END if finishedAt && scama
  } // END callValidate
  
//+++++++++++++++++++++++++++++++++++++ hi-jack res fn
//++++++++++++++++++++++++++++++++++++++++++++++++++++

  res.send = (...args) => {
    resBody = args[0]
    return send(...args)
  }
  res.json = (...args) => {
    resBody = args[0]
    return json(...args)
  }
  res.end = (...args) => {
    finishedAt = new Date()
    callValidate()
    return end(...args)
  }
  
//++++++++++++++++++++++++++++++++++ get ref for scama
//++++++++++++++++++++++++++++++++++++++++++++++++++++
  
  apiSpecPr.then(paths => {
    scama = paths[originalUrl] || null
    callValidate()
  }) // END apiSpecPr.then
  
  next()
  
} // END middleware

//=====================================================
//============================================ validate
//=====================================================

function validate(scama, {verb, url, resBody, startedAt, statusCode, headers:{accept}}) {
  
  const response = scama.responses[statusCode]
  
  if (response){
    const contentKey = findAcceptContentKey(acceptTypes(accept),Object.keys(response.content))
    if (contentKey){
      console.log(resBody, response.content[contentKey], "IS validate?")
    } else {
      console.log(`Could not find a matching type. Available types are ${Object.keys(response.content)}`)
    }
  } else {
    console.log(`StatusCode ${statusCode} was not found. Available codes are ${Object.keys(scama.responses)}`)
  }
  
} // END validate

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