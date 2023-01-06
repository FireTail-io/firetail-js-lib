
const errMessages = {
  dev:{
    missingAuthorizationToken:headerName=>`The authorization value needs to be in header or url as "${headerName}"`,
    missingJWTtoken:"No authorization token provided",
    notJWTBearer:"token dont not start with 'bearer: '",
    urlNotInYaml:({url,yamlPathSt})=>`${url} was NOT in ${yamlPathSt}`,
    badJWTFunctionOutput:`The JWT parce function did not return an oject`,
    missingArgs:"Missing required query argument.",
    //unknowenArgs:"Unknowen query argument.",
    missingJWTFunction:optId=>`No function with "${optId}" could be found`,
    missingJWTFunctions:`Missing security schemes functions`,
    notFound:({url,verb,scamaForEndPoint})=>`${url} ${verb.toUpperCase()} was not found. Only "${Object.keys(scamaForEndPoint).join(",").toUpperCase()}" should be used`,
    responseContentTypeMismatch:content=>`Could not find a matching type. Available types are ${Object.keys(content)}`,
    statusCodeNotFound:({statusCode,codes})=>`StatusCode ${statusCode} was not found. Available codes are ${codes}`,
    forbidenReqBodyKey:(key)=>`The key of "${key}" is not allowed in this call`,
    missingReqBodyKey:(key)=>`The key of "${key}" is required for this call`,
    responseReqBodyType:({expected, given})=>`Response is of wrong type. Expected "${expected}" given "${given}`,
    notANumber:val=>`${val} is not a value number`,
    belowMinimum:val=>`${val} is below the minimum value`,
    aboveMaximum:val=>`${val} is above the maximum value`,
    notAWholeNumber:val=>`${val} is not a whole number`,
    notValidString:val=>"Not a valid string:"+JSON.stringify(val),
    enumNotFound:({val,list})=>`"${val}" in the in the range of ${list}`,
    patternNotMatch:({val,pattern})=>`"${val}" didn't match ${pattern}`,
    toShort:val=>`"${val}" is to shot.`,
    toLong:val=>`"${val}" is to long.`,
    authenticationFailed:"Authentication failed",
    unknownType:type=>"Unknown type: "+type,
    clientCantAcceptThisContentType:replyContentType=>`Your request have an 'Accept' header that includes "${replyContentType}"`,
    appContentTypeNotInYaml:replyContentType=>`no schema definition was found for "${replyContentType}"`,
    noCustomBodyDecoder:replyContentType=>`no customBodyDecoder was found for "${replyContentType}"`,
    problemWithCustomBodyDecoder:replyContentType=>`"${replyContentType}" decoder has failed`,
    valueForbidden:name=>`The key of "${name}" in your request body, is not part of your openApi`
  },
  prod:{
    badOptionYamlPath:yamlPath=>"yamlPath is not validat:e: "+JSON.stringify(yamlPath),
    default:"There was a problem with your request. Please check your API spec",
    badJWTFunctionOutput:`Could not parce JWT`,
    missingJWTFunction:`Could not parce security`,
    responseContentTypeMismatch:`Could not find a matching type.`,
    unknownContentType:`invalid content-type for this end-point`,
    clientCantAcceptThisContentType:"Not Acceptable"
  }
} // errMessages

module.exports = errMessages
