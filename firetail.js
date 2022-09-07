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
            validate(scamaVerb, {
                verb: method,
                url: originalUrl,
                response: resBody,
                startedAt,
                finishedAt,
                statusCode: res.statusCode,
                headers:req.headers,
                params: req.params
              })
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

function validate(scama, {verb, url, response, startedAt, statusCode}, error) {
  console.log(`${url} was FOUND in ${yamlPathSt}`)
  console.log(`LET CHECK IF ${statusCode} - ${JSON.stringify(response)} IS validate?`)
  
  console.log(scama.responses["200"].content['application/json'].schema)
} // END validate