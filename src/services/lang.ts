
const errMessages = {
  dev:{
    missingJWTtoken:"No authorization token provided",
    notJWTBearer:"token dont not start with 'bearer: '",
    urlNotInYaml:({url,yamlPathSt})=>`${url} was NOT in ${yamlPathSt}`,
    badJWTFunctionOutput:`The JWT parce function did not return an oject`,
    missingArgs:"Missing required query argument.",
    unknowenArgs:"Unknowen query argument.",
    missingJWTFunction:optId=>`No function with "${optId}" could be found for parcing JWTs`,
    missingJWTFunctions:`Missing security schemes functions`,
    notFound:({url,verb,scamaForEndPoint})=>`${url} ${verb.toUpperCase()} was not found. Only "${Object.keys(scamaForEndPoint).join(",").toUpperCase()}" should be used`,
    responseContentTypeMismatch:content=>`Could not find a matching type. Available types are ${Object.keys(content)}`,
    statusCodeNotFound:({statusCode,codes})=>`StatusCode ${statusCode} was not found. Available codes are ${codes}`,
    forbidenReqBodyKey:(key)=>`The key of "${key}" is not allowed in this call`,
    missingReqBodyKey:(key)=>`The key of "${key}" is required for this call`,
    responseReqBodyType:({expected, given})=>`Response is of wrong type. Expected "${expected}" given "${given}`
  },
  prod:{
    badOptionYamlPath:yamlPath=>"yamlPath is not validate: "+JSON.stringify(yamlPath),
    default:"There was a problem with your request. Please check your API spec",
    badJWTFunctionOutput:`Could not parce JWT`,
    missingJWTFunction:`Could not parce JWT`,
    responseContentTypeMismatch:`Could not find a matching type.`
  }
} // errMessages

module.exports = errMessages
