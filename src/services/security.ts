
//=====================================================
//======================== validate security controller
//=====================================================

module.exports = function security({securities,scamaVerb, operationsFn, securitySchemes,headers, decodedJwt, req, genMessage}){
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
            const optName = secName//securitySchemes[secName]["x-bearerInfoFunc"]


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
              req.jwt = securities[optName](decodedJwt(headers))
            }else if(decodedJwt){
                const token = headers.authorization.split(" ").pop().replace(/['"]+/g, '')
                const tokenDecodablePart = token.split('.')[1];
                const decoded = Buffer.from(tokenDecodablePart, 'base64').toString();
                req.jwt = securities[optName](JSON.parse(decoded),token)
            }else if("function" === typeof securities[optName]){
              req.jwt = securities[optName](headers.authorization.split(" ").pop())
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
