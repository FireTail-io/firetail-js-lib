const SwaggerParser = require("@apidevtools/swagger-parser");

let yamlPathSt = "./api.yaml"

module.exports = function fileTaileSetup({apiYaml}){
  if ("string" === typeof yamlPath) {
      yamlPathSt = yamlPath
  } else if ("function" === typeof yamlPath) {
      yamlPathSt = yamlPath()
  } else if (process.env && process.env.API_YAML) {
    yamlPathSt = process.env.API_YAML
  }
  // TODO: Should we catch or crash if spce is not found?
  apiSpecPr = SwaggerParser.validate(yamlPathSt).then(({paths})=>paths);
  
  return middleware
} // END fileTaileSetup

function middleware(req, res, next) {
  
  const { method, originalUrl } = req
  
  let finishedAt, resBody, scama;
  const startedAt = new Date()
  
  const end  = res.end.bind(res)
  const send = res.send.bind(res)
  const json = res.json.bind(res)
  
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
  apiSpecPr.then(paths => {
    scama = paths[originalUrl] || null
    callValidate()
  }) // END apiSpecPr.then
  next()
} // END middleware

function validate(scama, {verb, url, resBody, startedAt, statusCode, headers:{accept}}, error) {
  console.log(`${url} was FOUND in ${yamlPathSt}`)
  
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

function acceptTypes(acceptSt) {
  
  return acceptSt.split(",").map(type=>type.split(";")[0])
  
  // TODO: Add support for "relative quality factor"
  /* The example
  ' Accept: audio/*; q=0.2, audio/basic '
  SHOULD be interpreted as "I prefer audio/basic, but send me any audio type if it is the best available after an 80% mark-down in quality."
  */
} // END acceptTypes

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